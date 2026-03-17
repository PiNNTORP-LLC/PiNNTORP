package com.pinntorp.Server.Api;

import com.pinntorp.WebSockets.WebSocket;
import com.pinntorp.Server.Console;
import com.pinntorp.Server.Database;

import java.io.*;
import java.net.Socket;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

public class ConnectionHandler extends Thread {
    private Socket socket;
    private String webRoot;

    public ConnectionHandler(Socket socket, String webRoot) {
        this.socket = socket;
        this.webRoot = webRoot;
    }

    private String getRequestBody(InputStream in, int contentLength) throws IOException {
        if (contentLength <= 0)
            return "";
        byte[] body = new byte[contentLength];
        int read = 0;
        while (read < contentLength) {
            read += in.read(body, read, contentLength - read);
        }
        return new String(body, "UTF-8");
    }

    private String extractJsonString(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1)
            return null;
        start += search.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }

    private void sendJsonResponse(OutputStream out, int statusCode, String message, String status) throws IOException {
        String json = "{\"status\":\"" + status + "\",\"message\":\"" + message + "\"}";
        String response = "HTTP/1.1 " + statusCode + " OK\r\n" +
                "Content-Type: application/json\r\n" +
                "Content-Length: " + json.length() + "\r\n" +
                "Access-Control-Allow-Origin: *\r\n\r\n" +
                json;
        out.write(response.getBytes("UTF-8"));
        out.flush();
    }

    @Override
    public void run() {
        try {
            InputStream in = socket.getInputStream();
            OutputStream out = socket.getOutputStream();

            // Read the HTTP request headers manually until "\r\n\r\n"
            ByteArrayOutputStream headerBuffer = new ByteArrayOutputStream();
            int b;
            int last1 = -1, last2 = -1, last3 = -1, last4 = -1;

            while ((b = in.read()) != -1) {
                headerBuffer.write(b);
                last4 = last3;
                last3 = last2;
                last2 = last1;
                last1 = b;

                // Check if we reached the "\r\n\r\n" (13, 10, 13, 10)
                if (last4 == 13 && last3 == 10 && last2 == 13 && last1 == 10) {
                    break;
                }
            }

            String requestHeaderStr = new String(headerBuffer.toByteArray(), "UTF-8");
            if (requestHeaderStr.isEmpty()) {
                socket.close();
                return;
            }

            String[] lines = requestHeaderStr.split("\r\n");
            String requestLine = lines[0];
            String[] requestParts = requestLine.split(" ");
            if (requestParts.length < 2) {
                socket.close();
                return;
            }

            String method = requestParts[0];
            String path = requestParts[1];

            // Parse headers into a map
            Map<String, String> headers = new HashMap<>();
            for (int i = 1; i < lines.length; i++) {
                if (lines[i].isEmpty())
                    break;
                int splitIndex = lines[i].indexOf(": ");
                if (splitIndex != -1) {
                    headers.put(lines[i].substring(0, splitIndex), lines[i].substring(splitIndex + 2));
                }
            }

            // Route 1: WebSocket Upgrade with Auth verification
            if ("websocket".equalsIgnoreCase(headers.get("Upgrade"))) {
                // If you wanted to do handshake auth, you could read the token query param here
                // For now allow standard WS connection
                WebSocket ws = new WebSocket(socket, headers);

                while (ws.isOpen()) {
                    com.pinntorp.WebSockets.Message msg = ws.receive();
                    if (msg != null && msg.getOpcode() == 1) {
                        Console.log("[WS] Received: " + msg.getString());
                    }
                }
                return;
            }

            // Route 2: Register specific user
            if (path.startsWith("/api/register") && method.equals("POST")) {
                int contentLen = Integer.parseInt(headers.getOrDefault("Content-Length", "0"));
                String body = getRequestBody(in, contentLen);
                String user = extractJsonString(body, "username");
                String pass = extractJsonString(body, "password");
                String role = extractJsonString(body, "role"); // Could be null, defaults "user"

                if (user == null || pass == null) {
                    sendJsonResponse(out, 400, "Username and password required.", "error");
                } else if (Database.users.containsKey(user)) {
                    sendJsonResponse(out, 400, "User already exists.", "error");
                } else {
                    String salt = AuthHelper.generateSalt();
                    String hash = AuthHelper.hashPassword(pass, salt);
                    if (role == null)
                        role = "user";

                    Database.users.put(user, new Database.UserData(user, role, salt, hash));
                    Database.save();
                    sendJsonResponse(out, 201, "Registered successfully.", "success");
                }
                socket.close();
                return;
            }

            // Route 3: Login to get token
            if (path.startsWith("/api/login") && method.equals("POST")) {
                int contentLen = Integer.parseInt(headers.getOrDefault("Content-Length", "0"));
                String body = getRequestBody(in, contentLen);
                String user = extractJsonString(body, "username");
                String pass = extractJsonString(body, "password");

                Database.UserData userData = Database.users.get(user);

                if (user != null && pass != null && userData != null
                        && AuthHelper.verifyPassword(pass, userData.salt, userData.hash)) {
                    // Valid password! Grant JWT
                    String jwt = AuthHelper.generateJWT(user, userData.role);
                    String json = "{\"status\":\"success\",\"token\":\"" + jwt + "\"}";
                    String response = "HTTP/1.1 200 OK\r\n" +
                            "Content-Type: application/json\r\n" +
                            "Content-Length: " + json.length() + "\r\n" +
                            "Access-Control-Allow-Origin: *\r\n\r\n" +
                            json;
                    out.write(response.getBytes("UTF-8"));
                    out.flush();
                } else {
                    sendJsonResponse(out, 401, "Invalid username or password.", "error");
                }
                socket.close();
                return;
            }

            // Route 4: API HTTP Route (Fetch User State)
            if (path.startsWith("/api/state") && method.equals("GET")) {
                String authHeader = headers.get("Authorization");
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    sendJsonResponse(out, 403, "Missing JWT Authorization header.", "error");
                    socket.close();
                    return;
                }

                String token = authHeader.substring(7);
                String verifiedUsername = AuthHelper.validateJWTAndGetUsername(token);

                if (verifiedUsername == null) {
                    sendJsonResponse(out, 403, "Invalid JWT Token.", "error");
                    socket.close();
                    return;
                }

                Database.UserData user = Database.users.get(verifiedUsername);
                if (user == null) {
                    sendJsonResponse(out, 404, "User not found in database.", "error");
                    socket.close();
                    return;
                }

                String json = String.format(
                        "{\"status\":\"success\", \"gamesPlayed\":%d, \"wins\":%d, \"losses\":%d, \"profit\":%d}",
                        user.gamesPlayed, user.wins, user.losses, user.profit);
                String response = "HTTP/1.1 200 OK\r\n" +
                        "Content-Type: application/json\r\n" +
                        "Content-Length: " + json.length() + "\r\n" +
                        "Access-Control-Allow-Origin: *\r\n\r\n" +
                        json;
                out.write(response.getBytes("UTF-8"));
                out.flush();
                socket.close();
                return;
            }

            // Route 5: Gamble API (Requires JWT)
            if (path.startsWith("/api/gamble") && method.equals("POST")) {
                String authHeader = headers.get("Authorization");
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    sendJsonResponse(out, 403, "Missing JWT Authorization header.", "error");
                    socket.close();
                    return;
                }

                String token = authHeader.substring(7);
                String verifiedUsername = AuthHelper.validateJWTAndGetUsername(token);

                if (verifiedUsername == null) {
                    sendJsonResponse(out, 403, "Invalid JWT Token.", "error");
                    socket.close();
                    return;
                }

                // Token is good, determine slot game result
                int firstNum = (int) (Math.random() * 7) + 1;
                int secNum = (int) (Math.random() * 7) + 1;
                int thirdNum = (int) (Math.random() * 7) + 1;

                int profit = -5; // base loss
                if (firstNum == secNum && secNum == thirdNum) {
                    profit = firstNum * 5;
                } else if (firstNum == secNum || firstNum == thirdNum || secNum == thirdNum) {
                    profit = 10;
                }

                Database.UserData user = Database.users.get(verifiedUsername);
                if (user != null) {
                    user.gamesPlayed++;
                    if (profit > 0)
                        user.wins++;
                    else
                        user.losses++;
                    user.profit += profit;
                    Database.save();
                }

                String json = String.format(
                        "{\"nums\": [%d, %d, %d], \"profit\": %d, \"user\":\"%s\", \"stats\": {\"gamesPlayed\":%d, \"wins\":%d, \"losses\":%d, \"profit\":%d}}",
                        firstNum, secNum, thirdNum, profit, verifiedUsername,
                        user != null ? user.gamesPlayed : 0,
                        user != null ? user.wins : 0,
                        user != null ? user.losses : 0,
                        user != null ? user.profit : 0);

                String response = "HTTP/1.1 200 OK\r\n" +
                        "Content-Type: application/json\r\n" +
                        "Content-Length: " + json.length() + "\r\n" +
                        "Access-Control-Allow-Origin: *\r\n\r\n" +
                        json;

                out.write(response.getBytes("UTF-8"));
                out.flush();
                socket.close();
                return;
            }

            // Route 6: Dice API (Requires JWT)
            if (path.startsWith("/api/dice") && method.equals("POST")) {
                String authHeader = headers.get("Authorization");
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    sendJsonResponse(out, 403, "Missing JWT Authorization header.", "error");
                    socket.close();
                    return;
                }

                String token = authHeader.substring(7);
                String verifiedUsername = AuthHelper.validateJWTAndGetUsername(token);

                if (verifiedUsername == null) {
                    sendJsonResponse(out, 403, "Invalid JWT Token.", "error");
                    socket.close();
                    return;
                }

                int contentLen = Integer.parseInt(headers.getOrDefault("Content-Length", "0"));
                String body = getRequestBody(in, contentLen);
                int guess = 0;
                try {
                    String guessStr = extractJsonString(body, "guess");
                    if (guessStr == null) {
                        // Try integer if not string quote
                        String search = "\"guess\":";
                        int start = body.indexOf(search);
                        if (start != -1) {
                            start += search.length();
                            int end = body.indexOf(",", start);
                            if (end == -1)
                                end = body.indexOf("}", start);
                            guess = Integer.parseInt(body.substring(start, end).trim());
                        }
                    } else {
                        guess = Integer.parseInt(guessStr);
                    }
                } catch (Exception e) {
                    guess = 1; // fallback
                }

                int roll = (int) (Math.random() * 6) + 1;
                boolean won = (guess == roll);
                int profit = won ? 10 : -5;

                Database.UserData user = Database.users.get(verifiedUsername);
                if (user != null) {
                    user.gamesPlayed++;
                    if (won)
                        user.wins++;
                    else
                        user.losses++;
                    user.profit += profit;
                    Database.save();
                }

                String json = String.format(
                        "{\"roll\": %d, \"won\": %b, \"guess\": %d, \"profit\": %d, \"stats\": {\"gamesPlayed\":%d, \"wins\":%d, \"losses\":%d, \"profit\":%d}}",
                        roll, won, guess, profit,
                        user != null ? user.gamesPlayed : 0,
                        user != null ? user.wins : 0,
                        user != null ? user.losses : 0,
                        user != null ? user.profit : 0);

                String response = "HTTP/1.1 200 OK\r\n" +
                        "Content-Type: application/json\r\n" +
                        "Content-Length: " + json.length() + "\r\n" +
                        "Access-Control-Allow-Origin: *\r\n\r\n" +
                        json;

                out.write(response.getBytes("UTF-8"));
                out.flush();
                socket.close();
                return;
            }

            // Route 7: Static File Server
            if (method.equals("GET")) {
                if (path.equals("/")) {
                    path = "/index.html";
                }

                File file = new File(webRoot + path).getCanonicalFile();
                if (!file.getPath().startsWith(new File(webRoot).getCanonicalPath()) || !file.exists()
                        || file.isDirectory()) {
                    String nf = "HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n";
                    out.write(nf.getBytes("UTF-8"));
                    socket.close();
                    return;
                }

                String contentType = "text/plain";
                if (path.endsWith(".html"))
                    contentType = "text/html";
                else if (path.endsWith(".js"))
                    contentType = "application/javascript";
                else if (path.endsWith(".css"))
                    contentType = "text/css";

                long length = file.length();
                String resHeader = "HTTP/1.1 200 OK\r\n" +
                        "Content-Type: " + contentType + "\r\n" +
                        "Content-Length: " + length + "\r\n\r\n";
                out.write(resHeader.getBytes("UTF-8"));
                out.flush();

                Files.copy(file.toPath(), out);
                out.flush();
                socket.close();
            }

        } catch (Exception e) {
            Console.log("Connection error: " + e.getMessage());
            try {
                socket.close();
            } catch (Exception ignored) {
            }
        }
    }
}

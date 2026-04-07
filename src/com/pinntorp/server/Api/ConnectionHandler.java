package com.pinntorp.server.Api;

import com.pinntorp.server.Console;
import com.pinntorp.server.Database;
import com.pinntorp.server.websockets.CustomWebSocket;
import com.pinntorp.server.websockets.WsRawMessage;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;

public class ConnectionHandler extends Thread {
    private final Socket socket;
    private final String webRoot;

    /**
     * Creates a connection handler for a single socket
     */
    public ConnectionHandler(Socket socket, String webRoot) {
        this.socket = socket;
        this.webRoot = webRoot;
    }

    /**
     * Read the request body using the provided content length
     */
    private String getRequestBody(InputStream in, int contentLength) throws IOException {
        if (contentLength <= 0) return "";
        byte[] body = new byte[contentLength];
        int read = 0;
        while (read < contentLength) {
            int chunk = in.read(body, read, contentLength - read);
            if (chunk < 0) {
                break;
            }
            read += chunk;
        }
        return new String(body, "UTF-8");
    }

    /**
     * Extract a simple string field from a JSON body
     */
    private String extractJsonString(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) return null;
        start += search.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }

    /**
     * Send a JSON response with a status code
     */
    private void sendJsonResponse(OutputStream out, int statusCode, String json) throws IOException {
        String response = "HTTP/1.1 " + statusCode + " OK\r\n"
            + "Content-Type: application/json\r\n"
            + "Content-Length: " + json.length() + "\r\n"
            + "Access-Control-Allow-Origin: *\r\n\r\n"
            + json;
        out.write(response.getBytes("UTF-8"));
        out.flush();
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private void ensureSocialLists(Database.UserData user) {
        if (user.friends == null) user.friends = new java.util.ArrayList<>();
        if (user.receivedFriendRequests == null) user.receivedFriendRequests = new java.util.ArrayList<>();
        if (user.sentFriendRequests == null) user.sentFriendRequests = new java.util.ArrayList<>();
    }

    private String usernamesToJson(java.util.List<String> usernames) {
        StringBuilder json = new StringBuilder("[");
        for (int i = 0; i < usernames.size(); i++) {
            if (i > 0) json.append(",");
            json.append("{\"username\":\"").append(escapeJson(usernames.get(i))).append("\"}");
        }
        json.append("]");
        return json.toString();
    }

    @Override
    public void run() {
        try {
            // Open the socket streams for this request
            InputStream in = socket.getInputStream();
            OutputStream out = socket.getOutputStream();
            ByteArrayOutputStream headerBuffer = new ByteArrayOutputStream();
            int b;
            int last1 = -1, last2 = -1, last3 = -1, last4 = -1;

            // Read the HTTP request headers manually until "\r\n\r\n"
            while ((b = in.read()) != -1) {
                headerBuffer.write(b);
                last4 = last3;
                last3 = last2;
                last2 = last1;
                last1 = b;

                // Check if we reached the "\r\n\r\n" (13, 10, 13, 10)
                if (last4 == 13 && last3 == 10 && last2 == 13 && last1 == 10) break;
            }

            // Parse the request line and header map
            String requestHeaderStr = new String(headerBuffer.toByteArray(), "UTF-8");
            if (requestHeaderStr.isEmpty()) {
                socket.close();
                return;
            }

            String[] lines = requestHeaderStr.split("\r\n");
            String[] requestParts = lines[0].split(" ");
            if (requestParts.length < 2) {
                socket.close();
                return;
            }

            String method = requestParts[0];
            String path = requestParts[1];

            // Parse headers into a map
            Map<String, String> headers = new HashMap<>();
            for (int i = 1; i < lines.length; i++) {
                if (lines[i].isEmpty()) break;
                int splitIndex = lines[i].indexOf(": ");
                if (splitIndex != -1) {
                    headers.put(lines[i].substring(0, splitIndex), lines[i].substring(splitIndex + 2));
                }
            }

            String authHeader = headers.get("Authorization");
            String verifiedUsername = null;
            Database.UserData user = null;

            // Route 1: WebSocket Upgrade with Auth verification
            if ("websocket".equalsIgnoreCase(headers.get("Upgrade"))) {
                // If you wanted to do handshake auth, you could read the token query param here
                // For now allow standard WS connection
                CustomWebSocket ws = new CustomWebSocket(socket, headers);
                while (ws.isOpen()) {
                    WsRawMessage msg = ws.receive();
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
                String username = extractJsonString(body, "username");
                String pass = extractJsonString(body, "password");
                String role = extractJsonString(body, "role"); // Could be null, defaults "user"

                if (username == null || pass == null) {
                    sendJsonResponse(out, 400, "{\"status\":\"error\",\"message\":\"Username and password required.\"}");
                } else if (Database.users.containsKey(username)) {
                    sendJsonResponse(out, 400, "{\"status\":\"error\",\"message\":\"User already exists.\"}");
                } else {
                    String salt = AuthHelper.generateSalt();
                    String hash = AuthHelper.hashPassword(pass, salt);
                    Database.users.put(username, new Database.UserData(username, role == null ? "user" : role, salt, hash));
                    Database.save();
                    sendJsonResponse(out, 201, "{\"status\":\"success\",\"message\":\"Registered successfully.\"}");
                }
                socket.close();
                return;
            }

            // Route 3: Login to get token
            if (path.startsWith("/api/login") && method.equals("POST")) {
                int contentLen = Integer.parseInt(headers.getOrDefault("Content-Length", "0"));
                String body = getRequestBody(in, contentLen);
                String username = extractJsonString(body, "username");
                String pass = extractJsonString(body, "password");
                Database.UserData userData = Database.users.get(username);

                if (username != null && pass != null && userData != null
                    && AuthHelper.verifyPassword(pass, userData.salt, userData.hash)) {
                    // Valid password! Grant JWT
                    String jwt = AuthHelper.generateJWT(username, userData.role);
                    sendJsonResponse(out, 200, "{\"status\":\"success\",\"token\":\"" + jwt + "\"}");
                } else {
                    sendJsonResponse(out, 401, "{\"status\":\"error\",\"message\":\"Invalid username or password.\"}");
                }
                socket.close();
                return;
            }

            // Route 4: API HTTP Route (Fetch User State)
            if (path.startsWith("/api/state") && method.equals("GET")) {
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Missing JWT Authorization header.\"}");
                    socket.close();
                    return;
                }

                verifiedUsername = AuthHelper.validateJWTAndGetUsername(authHeader.substring(7));
                user = Database.users.get(verifiedUsername);
                if (verifiedUsername == null || user == null) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Invalid session.\"}");
                    socket.close();
                    return;
                }

                String json = String.format(
                    "{\"status\":\"success\",\"gamesPlayed\":%d,\"wins\":%d,\"losses\":%d,\"profit\":%d,\"balance\":%d}",
                    user.gamesPlayed, user.wins, user.losses, user.profit, 100 + user.profit
                );
                sendJsonResponse(out, 200, json);
                socket.close();
                return;
            }

            // Route 5: Gamble API (Requires JWT)
            if (path.startsWith("/api/gamble") && method.equals("POST")) {
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Missing JWT Authorization header.\"}");
                    socket.close();
                    return;
                }

                verifiedUsername = AuthHelper.validateJWTAndGetUsername(authHeader.substring(7));
                user = Database.users.get(verifiedUsername);
                if (verifiedUsername == null || user == null) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Invalid session.\"}");
                    socket.close();
                    return;
                }

                // Token is good, determine slot game result
                int firstNum = (int) (Math.random() * 7) + 1;
                int secNum = (int) (Math.random() * 7) + 1;
                int thirdNum = (int) (Math.random() * 7) + 1;
                int profit = -5; // base loss
                if (firstNum == secNum && secNum == thirdNum) {
                    profit = firstNum * 7;
                } else if (firstNum == secNum || firstNum == thirdNum || secNum == thirdNum) {
                    profit = 7;
                }

                user.gamesPlayed++;
                if (profit > 0) user.wins++;
                else user.losses++;
                user.profit += profit;
                Database.save();

                String json = String.format(
                    "{\"nums\":[%d,%d,%d],\"profit\":%d,\"stats\":{\"gamesPlayed\":%d,\"wins\":%d,\"losses\":%d,\"profit\":%d,\"balance\":%d}}",
                    firstNum, secNum, thirdNum, profit, user.gamesPlayed, user.wins, user.losses, user.profit, 100 + user.profit
                );
                sendJsonResponse(out, 200, json);
                socket.close();
                return;
            }

            // Route 6: Dice API (Requires JWT)
            if (path.startsWith("/api/dice") && method.equals("POST")) {
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Missing JWT Authorization header.\"}");
                    socket.close();
                    return;
                }

                verifiedUsername = AuthHelper.validateJWTAndGetUsername(authHeader.substring(7));
                user = Database.users.get(verifiedUsername);
                if (verifiedUsername == null || user == null) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Invalid session.\"}");
                    socket.close();
                    return;
                }

                int contentLen = Integer.parseInt(headers.getOrDefault("Content-Length", "0"));
                String body = getRequestBody(in, contentLen);
                int guess = 1;
                try {
                    String guessStr = extractJsonString(body, "guess");
                    if (guessStr != null) guess = Integer.parseInt(guessStr);
                } catch (Exception ignored) {
                }

                int roll = (int) (Math.random() * 6) + 1;
                boolean won = guess == roll;
                int profit = won ? 20 : -5;

                user.gamesPlayed++;
                if (won) user.wins++;
                else user.losses++;
                user.profit += profit;
                Database.save();

                String json = String.format(
                    "{\"roll\":%d,\"won\":%s,\"guess\":%d,\"profit\":%d,\"stats\":{\"gamesPlayed\":%d,\"wins\":%d,\"losses\":%d,\"profit\":%d,\"balance\":%d}}",
                    roll, won ? "true" : "false", guess, profit, user.gamesPlayed, user.wins, user.losses, user.profit, 100 + user.profit
                );
                sendJsonResponse(out, 200, json);
                socket.close();
                return;
            }

            // Route 6b: Blackjack result sync API (Requires JWT)
            if (path.startsWith("/api/blackjack") && method.equals("POST")) {
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Missing JWT Authorization header.\"}");
                    socket.close();
                    return;
                }

                verifiedUsername = AuthHelper.validateJWTAndGetUsername(authHeader.substring(7));
                user = Database.users.get(verifiedUsername);
                if (verifiedUsername == null || user == null) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Invalid session.\"}");
                    socket.close();
                    return;
                }

                int contentLen = Integer.parseInt(headers.getOrDefault("Content-Length", "0"));
                String body = getRequestBody(in, contentLen);

                String outcome = extractJsonString(body, "outcome");
                if (outcome == null) outcome = "push";

                int bet = 5;
                try {
                    String betStr = extractJsonString(body, "bet");
                    if (betStr == null) {
                        String search = "\"bet\":";
                        int start = body.indexOf(search);
                        if (start != -1) {
                            start += search.length();
                            int end = body.indexOf(",", start);
                            if (end == -1) end = body.indexOf("}", start);
                            bet = Integer.parseInt(body.substring(start, end).trim());
                        }
                    } else {
                        bet = Integer.parseInt(betStr);
                    }
                } catch (Exception ignored) {
                }

                int profit = 0;
                if ("blackjack".equals(outcome)) {
                    profit = (int) Math.ceil(bet * 1.5);
                    user.wins++;
                } else if ("win".equals(outcome)) {
                    profit = bet;
                    user.wins++;
                } else if ("loss".equals(outcome)) {
                    profit = -bet;
                    user.losses++;
                }

                user.gamesPlayed++;
                user.profit += profit;
                Database.save();

                String json = String.format(
                    "{\"status\":\"success\",\"profit\":%d,\"stats\":{\"gamesPlayed\":%d,\"wins\":%d,\"losses\":%d,\"profit\":%d,\"balance\":%d}}",
                    profit, user.gamesPlayed, user.wins, user.losses, user.profit, 100 + user.profit
                );
                sendJsonResponse(out, 200, json);
                socket.close();
                return;
            }

            // Route: Friends API (Requires JWT)
            if (path.startsWith("/api/friends") && method.equals("POST")) {
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Missing JWT Authorization header.\"}");
                    socket.close();
                    return;
                }

                verifiedUsername = AuthHelper.validateJWTAndGetUsername(authHeader.substring(7));
                user = Database.users.get(verifiedUsername);
                if (verifiedUsername == null || user == null) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Invalid session.\"}");
                    socket.close();
                    return;
                }

                ensureSocialLists(user);

                int contentLen = Integer.parseInt(headers.getOrDefault("Content-Length", "0"));
                String body = getRequestBody(in, contentLen);
                String action = extractJsonString(body, "action");
                String targetUsername = extractJsonString(body, "targetUsername");
                String friendUsername = extractJsonString(body, "friendUsername");

                if (action == null) {
                    sendJsonResponse(out, 400, "{\"status\":\"error\",\"message\":\"Missing action.\"}");
                    socket.close();
                    return;
                }

                if (action.equals("find")) {
                    Database.UserData target = Database.users.get(targetUsername);
                    String json = target != null
                            ? "{\"found\":true,\"username\":\"" + escapeJson(target.username) + "\"}"
                            : "{\"found\":false}";
                    sendJsonResponse(out, 200, json);
                    socket.close();
                    return;
                }

                if (action.equals("list-friends")) {
                    sendJsonResponse(out, 200, "{\"friends\":" + usernamesToJson(user.friends) + "}");
                    socket.close();
                    return;
                }

                if (action.equals("list-requests")) {
                    String json = "{\"sent\":" + usernamesToJson(user.sentFriendRequests)
                            + ",\"received\":" + usernamesToJson(user.receivedFriendRequests) + "}";
                    sendJsonResponse(out, 200, json);
                    socket.close();
                    return;
                }

                Database.UserData friendUser = Database.users.get(friendUsername);
                if (friendUsername == null || friendUser == null) {
                    sendJsonResponse(out, 404, "{\"status\":\"error\",\"message\":\"User not found.\"}");
                    socket.close();
                    return;
                }

                ensureSocialLists(friendUser);

                if (verifiedUsername.equals(friendUsername)) {
                    sendJsonResponse(out, 400, "{\"status\":\"error\",\"message\":\"You cannot friend yourself.\"}");
                    socket.close();
                    return;
                }

                if (action.equals("add")) {
                    if (user.friends.contains(friendUsername)) {
                        sendJsonResponse(out, 200, "{\"success\":false,\"message\":\"Already friends.\"}");
                    } else if (user.sentFriendRequests.contains(friendUsername)) {
                        sendJsonResponse(out, 200, "{\"success\":false,\"message\":\"Request already sent.\"}");
                    } else if (user.receivedFriendRequests.contains(friendUsername)) {
                        sendJsonResponse(out, 200, "{\"success\":false,\"message\":\"This user already sent you a request.\"}");
                    } else {
                        user.sentFriendRequests.add(friendUsername);
                        friendUser.receivedFriendRequests.add(verifiedUsername);
                        Database.save();
                        sendJsonResponse(out, 200, "{\"success\":true}");
                    }
                    socket.close();
                    return;
                }

                if (action.equals("remove")) {
                    user.friends.remove(friendUsername);
                    friendUser.friends.remove(verifiedUsername);
                    Database.save();
                    sendJsonResponse(out, 200, "{\"success\":true}");
                    socket.close();
                    return;
                }

                if (action.equals("accept")) {
                    user.receivedFriendRequests.remove(friendUsername);
                    friendUser.sentFriendRequests.remove(verifiedUsername);
                    if (!user.friends.contains(friendUsername)) user.friends.add(friendUsername);
                    if (!friendUser.friends.contains(verifiedUsername)) friendUser.friends.add(verifiedUsername);
                    Database.save();
                    sendJsonResponse(out, 200, "{\"success\":true}");
                    socket.close();
                    return;
                }

                if (action.equals("decline")) {
                    user.receivedFriendRequests.remove(friendUsername);
                    friendUser.sentFriendRequests.remove(verifiedUsername);
                    Database.save();
                    sendJsonResponse(out, 200, "{\"success\":true}");
                    socket.close();
                    return;
                }

                if (action.equals("cancel")) {
                    user.sentFriendRequests.remove(friendUsername);
                    friendUser.receivedFriendRequests.remove(verifiedUsername);
                    Database.save();
                    sendJsonResponse(out, 200, "{\"success\":true}");
                    socket.close();
                    return;
                }

                sendJsonResponse(out, 400, "{\"status\":\"error\",\"message\":\"Unsupported action requested.\"}");
                socket.close();
                return;
            }

            // Route 7: Clicker Earn/Spend API (Requires JWT)
            // Accepts {"amount": N} - positive = earning from clicks, negative = upgrade purchase.
            // Server caps: earn max 500 per call, spend max 15000 per call.
            if (path.startsWith("/api/earn") && method.equals("POST")) {
                if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Missing JWT Authorization header.\"}");
                    socket.close();
                    return;
                }

                verifiedUsername = AuthHelper.validateJWTAndGetUsername(authHeader.substring(7));
                user = Database.users.get(verifiedUsername);
                if (verifiedUsername == null || user == null) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Invalid session.\"}");
                    socket.close();
                    return;
                }

                int contentLen = Integer.parseInt(headers.getOrDefault("Content-Length", "0"));
                String body = getRequestBody(in, contentLen);
                int amount = 0;
                try {
                    String search = "\"amount\":";
                    int start = body.indexOf(search);
                    if (start != -1) {
                        start += search.length();
                        int end = body.indexOf("}", start);
                        int comma = body.indexOf(",", start);
                        if (comma != -1 && comma < end) end = comma;
                        amount = Integer.parseInt(body.substring(start, end).trim());
                    }
                } catch (Exception e) {
                    amount = 0;
                }

                // Clamp to prevent abuse
                final int MAX_EARN = 500;
                final int MAX_SPEND = 15000;
                if (amount > MAX_EARN || amount < -MAX_SPEND || amount == 0) {
                    sendJsonResponse(out, 400, "{\"status\":\"error\",\"message\":\"Invalid amount.\"}");
                    socket.close();
                    return;
                }

                // Prevent spending more than available balance (balance = 100 + profit)
                int currentBalance = 100 + user.profit;
                if (amount < 0 && currentBalance + amount < 0) {
                    sendJsonResponse(out, 400, "{\"status\":\"error\",\"message\":\"Insufficient balance.\"}");
                    socket.close();
                    return;
                }

                user.profit += amount;
                Database.save();

                sendJsonResponse(out, 200, "{\"status\":\"success\",\"message\":\"" + (100 + user.profit) + "\"}");
                socket.close();
                return;
            }

            // Route: Account Deletion
            if (path.startsWith("/api/user/delete") && method.equals("POST")) {
                if (authHeader == null || !authHeader.startsWith("Bearer")) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Missing JWT Authorization header.\"}");
                    socket.close();
                    return;
                }

                verifiedUsername = AuthHelper.validateJWTAndGetUsername(authHeader.substring(7));
                if (verifiedUsername == null) {
                    sendJsonResponse(out, 403, "{\"status\":\"error\",\"message\":\"Invalid JWT Token.\"}");
                    socket.close();
                    return;
                }

                Database.users.remove(verifiedUsername);

                for (Database.UserData u : Database.users.values()) {
                    if (u.friends != null) {
                        u.friends.remove(verifiedUsername);
                    }
                }

                Database.save();

                sendJsonResponse(out, 200, "{\"status\":\"success\",\"message\":\"Account deleted successfully.\"}");
                socket.close();
                return;
            }

            // Route 8: Static File Server
            if (method.equals("GET")) {
                if (path.equals("/")) {
                    path = "/index.html";
                }

                File file = new File(webRoot + path).getCanonicalFile();
                if (!file.getPath().startsWith(new File(webRoot).getCanonicalPath()) || !file.exists() || file.isDirectory()) {
                    out.write("HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n".getBytes("UTF-8"));
                    socket.close();
                    return;
                }

                String contentType = "text/plain";
                if (path.endsWith(".html")) contentType = "text/html";
                else if (path.endsWith(".js")) contentType = "application/javascript";
                else if (path.endsWith(".css")) contentType = "text/css";
                else if (path.endsWith(".png")) contentType = "image/png";
                else if (path.endsWith(".json")) contentType = "application/json";

                String resHeader = "HTTP/1.1 200 OK\r\n"
                    + "Content-Type: " + contentType + "\r\n"
                    + "Content-Length: " + file.length() + "\r\n\r\n";
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

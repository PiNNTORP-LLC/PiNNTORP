package com.pinntorp.Server.Api;

import com.pinntorp.WebSockets.WebSocket;
import com.pinntorp.Server.Console;

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

            // Route 1: WebSocket Upgrade
            if ("websocket".equalsIgnoreCase(headers.get("Upgrade"))) {
                WebSocket ws = new WebSocket(socket, headers);
                // In a real app, you'd start a thread to handle incoming ws messages or store
                // it
                // For now, let's just loop and read messages
                while (ws.isOpen()) {
                    com.pinntorp.WebSockets.Message msg = ws.receive();
                    if (msg != null && msg.getOpcode() == 1) {
                        Console.log("[WS] Received: " + msg.getString());
                    }
                }
                return;
            }

            // Route 2: API HTTP Route
            if (path.startsWith("/api/state")) {
                String json = "{\"status\":\"success\",\"message\":\"State loaded via merged single-port HTTP!\"}";
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

            // Route 3: Gamble API
            if (path.startsWith("/api/gamble") && method.equals("POST")) {
                // Determine slot game result
                int firstNum = (int) (Math.random() * 7) + 1;
                int secNum = (int) (Math.random() * 7) + 1;
                int thirdNum = (int) (Math.random() * 7) + 1;

                int profit = -5; // base loss
                if (firstNum == secNum && secNum == thirdNum) {
                    profit = firstNum * 5;
                } else if (firstNum == secNum || firstNum == thirdNum || secNum == thirdNum) {
                    profit = 10;
                }

                // Temporary inline JSON generation for immediate function return
                String json = String.format(
                        "{\"nums\": [%d, %d, %d], \"profit\": %d}",
                        firstNum, secNum, thirdNum, profit);

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

            // Route 3: Static File Server
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

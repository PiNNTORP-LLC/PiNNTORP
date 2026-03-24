package com.pinntorp.Server;

import com.pinntorp.WebSockets.WebSocketServer;

/**
 * This class serves as an entrypoint
 */
public class Main {
    private static WebSocketServer server;

    // Entrypoint
    public static void main(String[] args) {
        String webRoot = System.getProperty("user.dir") + "/..";
        int port = 8080;

        Env.load(webRoot);

        try {
            port = Integer.parseInt(Env.get("PORT", "8080"));
        } catch (NumberFormatException e) {
            Console.log("Notice: Invalid PORT in .env, defaulting to 8080");
        }

        try {
            Console.log("Starting unified HTTP & WebSocket server on port " + port + "...");
            Database.load();
            WebSocketServer nextServer = new WebSocketServer(port, webRoot);
            server = nextServer;
            server.start();
            Console.log("Server is running at http://localhost:" + port + "/");
        } catch (Exception e) {
            Console.log("Failed to start server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static void clean() {
        if (server != null) {
            server.requestStop();
        }
    }
}

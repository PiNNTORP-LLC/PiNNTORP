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
            String portEnv = Env.get("PORT", "8080");
            port = Integer.parseInt(portEnv);
        } catch (NumberFormatException e) {
            Console.log("Notice: Invalid PORT in .env, defaulting to 8080");
        }

        try {
            Console.log("Starting unified HTTP & WebSocket server on port " + port + "...");
            Database.load();

            server = new WebSocketServer(port, webRoot);
            server.start();

            Console.log("Server is running at http://localhost:" + port + "/");
            Console.log("- View website at: http://localhost:" + port + "/");
            Console.log("- Test HTTP API:   http://localhost:" + port + "/api/state");
            Console.log("- WebSocket URL:   ws://localhost:" + port + "/");
        } catch (Exception e) {
            Console.log("Failed to start server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Cleans up resources that need it.
     */
    public static void clean() {
        if (server != null) {
            server.requestStop();
        }
    }
}

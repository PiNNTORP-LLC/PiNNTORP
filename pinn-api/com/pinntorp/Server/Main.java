package com.pinntorp.Server;

import com.pinntorp.WebSockets.WebSocketServer;

/**
 * This class serves as an entrypoint
 */
public class Main {
    private static WebSocketServer server;

    // Entrypoint
    public static void main(String[] args) {
        int port = 8080;
        try {
            Console.log("Starting WebSocket server on port " + port + "...");
            server = new WebSocketServer(port);
            server.start();
            Console.log("WebSocket server is running!");
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

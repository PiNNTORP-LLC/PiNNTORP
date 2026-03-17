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

        // Root directory is generally "../" when compiled inside pinn-api
        // But running locally, root directory of the PiNNTORP repository where
        // index.html lives
        String webRoot = System.getProperty("user.dir") + "/..";

        try {
            Console.log("Starting unified HTTP & WebSocket server on port " + port + "...");
            server = new WebSocketServer(port, webRoot);
            server.start();

            Console.log("Server is running!");
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

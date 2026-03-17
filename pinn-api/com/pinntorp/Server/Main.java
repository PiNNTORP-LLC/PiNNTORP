package com.pinntorp.Server;

import com.pinntorp.WebSockets.WebSocketServer;
import com.pinntorp.Server.Api.StaticHttpServer;

/**
 * This class serves as an entrypoint
 */
public class Main {
    private static WebSocketServer webSocketServer;
    private static StaticHttpServer httpServer;

    // Entrypoint
    public static void main(String[] args) {
        int httpPort = 5500;
        int wsPort = 8080;

        // Root directory is generally "../" when compiled inside pinn-api
        // But running locally, root directory of the PiNNTORP repository where
        // index.html lives
        String webRoot = System.getProperty("user.dir") + "/..";

        try {
            Console.log("Starting HTTP Server on port " + httpPort + "...");
            httpServer = new StaticHttpServer(httpPort, webRoot);
            httpServer.start();

            Console.log("Starting WebSocket server on port " + wsPort + "...");
            webSocketServer = new WebSocketServer(wsPort);
            webSocketServer.start();

            Console.log("Both servers are running!");
            Console.log("- View website at: http://localhost:" + httpPort + "/");
            Console.log("- Test HTTP API:   http://localhost:" + httpPort + "/api/state");
            Console.log("- WebSocket URL:   ws://localhost:" + wsPort + "/");

        } catch (Exception e) {
            Console.log("Failed to start server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Cleans up resources that need it.
     */
    public static void clean() {
        if (webSocketServer != null) {
            webSocketServer.requestStop();
        }
        if (httpServer != null) {
            httpServer.stop();
        }
    }
}

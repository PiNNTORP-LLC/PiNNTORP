package com.pinntorp.Server.Api;

import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.file.Files;

import com.pinntorp.Server.Console;

public class StaticHttpServer {
    private HttpServer server;

    public StaticHttpServer(int port, String rootDirectory) throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);

        // Serve static files (HTML, JS, CSS)
        server.createContext("/", new StaticFileHandler(rootDirectory));

        // Setup API route Example
        server.createContext("/api/state", new ApiStateHandler());

        server.setExecutor(null); // creates a default executor
    }

    public void start() {
        server.start();
        Console.log("HTTP Server started");
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
        }
    }

    // Handles serving static HTML, JS, CSS files
    static class StaticFileHandler implements HttpHandler {
        private String rootDir;

        public StaticFileHandler(String rootDir) {
            this.rootDir = rootDir;
        }

        @Override
        public void handle(HttpExchange t) throws IOException {
            String path = t.getRequestURI().getPath();
            if (path.equals("/")) {
                path = "/index.html";
            }

            File file = new File(rootDir + path).getCanonicalFile();

            // Basic security check to prevent directory traversal
            if (!file.getPath().startsWith(new File(rootDir).getCanonicalPath())) {
                sendResponse(t, 403, "403 Forbidden");
                return;
            }

            if (!file.exists() || file.isDirectory()) {
                sendResponse(t, 404, "404 Not Found");
                return;
            }

            // Set basic content types
            if (path.endsWith(".html"))
                t.getResponseHeaders().set("Content-Type", "text/html");
            else if (path.endsWith(".js"))
                t.getResponseHeaders().set("Content-Type", "application/javascript");
            else if (path.endsWith(".css"))
                t.getResponseHeaders().set("Content-Type", "text/css");

            t.sendResponseHeaders(200, file.length());
            try (OutputStream os = t.getResponseBody()) {
                Files.copy(file.toPath(), os);
            }
        }
    }

    // Example API Handler
    static class ApiStateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            // CORS headers so frontend can read it if needed
            t.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
            t.getResponseHeaders().set("Content-Type", "application/json");

            String response = "{\"status\":\"success\",\"message\":\"State loaded via HTTP API!\"}";
            t.sendResponseHeaders(200, response.length());
            try (OutputStream os = t.getResponseBody()) {
                os.write(response.getBytes());
            }
        }
    }

    private static void sendResponse(HttpExchange t, int code, String message) throws IOException {
        t.sendResponseHeaders(code, message.length());
        try (OutputStream os = t.getResponseBody()) {
            os.write(message.getBytes());
        }
    }
}

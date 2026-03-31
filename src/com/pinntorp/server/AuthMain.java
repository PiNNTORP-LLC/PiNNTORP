package com.pinntorp.server;

import com.pinntorp.server.handlers.FriendsHandler;
import com.pinntorp.server.handlers.LoginHandler;
import com.sun.net.httpserver.HttpServer;

import java.net.InetSocketAddress;

/**
 * Minimal standalone entry point for the auth/friends HTTP API.
 * Does NOT start the WebSocket server — avoids the org.java_websocket dependency
 * that is missing from the project's lib/ folder.
 */
public class AuthMain {
    public static void main(String[] args) {
        int port = 5500;

        UserStore userStore = new UserStore("./users.json");
        userStore.loadUsers();

        SessionManager sessionManager = new SessionManager();

        try {
            HttpServer httpServer = HttpServer.create(new InetSocketAddress(port), 0);
            httpServer.createContext("/login",   new LoginHandler(userStore, sessionManager));
            httpServer.createContext("/friends", new FriendsHandler(userStore, sessionManager));
            httpServer.start();
            System.out.println("PiNNTORP auth server running on http://localhost:" + port);
        } catch (Exception e) {
            System.out.println("Failed to start auth server: " + e.getMessage());
            e.printStackTrace();
        }
    }
}

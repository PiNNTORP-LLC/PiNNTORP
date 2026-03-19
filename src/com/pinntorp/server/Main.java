package com.pinntorp.server;

import com.pinntorp.server.gui.ControlWindow;
import com.pinntorp.server.handlers.FriendsHandler;
import com.pinntorp.server.handlers.LobbyHandler;
import com.pinntorp.server.handlers.LoginHandler;
import com.pinntorp.server.handlers.UserHandler;
import com.pinntorp.server.websockets.WsServer;
import com.sun.net.httpserver.HttpServer;

import java.net.InetSocketAddress;

/**
 * This class serves as an entrypoint
 */
public class Main
{
    // Entrypoint
    public static void main(String[] args)
    {
        // Create the server management window
        ControlWindow controller = new ControlWindow();

        HttpServer httpServer;  // HTTP server
        WsServer wsServer;      // WebSocket server

        // Create the user store
        UserStore userStore = new UserStore();

        // Load the user store from the users file
        userStore.loadUsers();

        // Create the lobby manager
        LobbyManager lobbyManager = new LobbyManager();

        try {
            // Create the HTTP server
            httpServer = HttpServer.create(new InetSocketAddress(5500), 0);
            httpServer.createContext("/login", new LoginHandler(userStore));
            httpServer.createContext("/lobby", new LobbyHandler(userStore, lobbyManager));
            httpServer.createContext("/friends", new FriendsHandler(userStore));
            httpServer.createContext("/user", new UserHandler(userStore));

            // Start the HTTP server
            httpServer.start();
            Console.log("Main", "Started HTTP server on port ~5500~.");

            // Create and start the WebSocket server
            wsServer = new WsServer(5555);
            wsServer.start();
            Console.log("Main", "Started WebSocket server on port ~5555~.");

            // Clean up
            httpServer.stop(0);
            wsServer.stop();
        }
        catch(Exception e)
        {
            System.out.println("Exception " + e.getClass().getName() + " occurred while trying to initialize server.");
        }
    }
}

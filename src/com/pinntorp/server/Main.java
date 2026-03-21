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
        HttpServer httpServer;  // HTTP server
        WsServer wsServer;      // WebSocket server

        // Create the user store, and load users from user file
        UserStore userStore = new UserStore("./users.json");
        userStore.loadUsers();

        // Create the lobby manager
        LobbyManager lobbyManager = new LobbyManager();

        // Create the session manager
        SessionManager sessionManager = new SessionManager();

        try
        {
            // Create the HTTP server
            httpServer = HttpServer.create(new InetSocketAddress(5500), 0);
            httpServer.createContext("/login", new LoginHandler(userStore, sessionManager));
            httpServer.createContext("/lobby", new LobbyHandler(userStore, lobbyManager));
            httpServer.createContext("/friends", new FriendsHandler(userStore));
            httpServer.createContext("/user", new UserHandler(userStore));

            // Create the WebSocket server
            wsServer = new WsServer(5555);
        }
        catch(Exception e)
        {
            System.out.println("Exception " + e.getClass().getName() + " occurred while trying to initialize servers.");
            return;
        }

        // Create the server controller
        ServerController controller = new ServerController(httpServer, wsServer, userStore);

        // Create and show the server management window
        ControlWindow controlWindow = new ControlWindow(controller);
        controlWindow.setVisible(true);

        // Add a runtime shutdown hook to the controller shutdown method, making the JVM run the shutdown method before closing
        Runtime.getRuntime().addShutdownHook(new Thread(controller::shutdown));

        try {
            // Start the HTTP server
            httpServer.start();
            Console.log("Main", "Started HTTP server on port ~5500~.");

            // Start the WebSocket server
            wsServer.start();
            Console.log("Main", "Started WebSocket server on port ~5555~.");
        }
        catch(Exception e)
        {
            System.out.println("Exception " + e.getClass().getName() + " occurred while trying to start servers.");
        }
    }
}

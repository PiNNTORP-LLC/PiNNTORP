package com.pinntorp.Server;

import com.pinntorp.Server.Interface.ControlWindow;
import com.sun.net.httpserver.HttpContext;
import com.sun.net.httpserver.HttpServer;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;

/**
 * This class serves as an entrypoint
 */
public class Main
{
    // WebSocket server for game and lobby API
    private static WsServer wsServer;

    // HTTP server for auth and friends API
    private static HttpServer httpServer;

    // Entrypoint
    public static void main(String[] args)
    {
        // Create the server management window
        ControlWindow controller = new ControlWindow();

        try {
            // Create the HTTP server
            httpServer = HttpServer.create(new InetSocketAddress(5500), 0);
            HttpContext authContext = httpServer.createContext("/auth");
            HttpContext userContext = httpServer.createContext("/user");
            authContext.setHandler(new AuthHandler());
            userContext.setHandler(new UserHandler());
            httpServer.start();
            Console.log("Main", "Started HTTP server on port ~5500~.");

            // Create the WebSocket server
            wsServer = new WsServer(5555);
            wsServer.start();
            Console.log("Main", "Started WebSocket server on port ~5555~.");
        }
        catch(Exception e)
        {
            System.out.println("Exception " + e.getClass().getName() + " occurred while trying to initialize server.");
        }
    }

    /**
     * Cleans up resources that need it.
     * Called by ControlWindow when it's closing to clean up on exit.
     */
    public static void clean()
    {
        httpServer.stop(0);

    }
}

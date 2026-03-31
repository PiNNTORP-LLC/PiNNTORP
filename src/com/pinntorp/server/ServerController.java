package com.pinntorp.server;

import com.pinntorp.server.websockets.WsServer;
import com.sun.net.httpserver.HttpServer;

public class ServerController
{
    private final HttpServer httpServer;
    private final WsServer wsServer;
    private final UserStore userStore;

    public ServerController(HttpServer httpServer, WsServer wsServer, UserStore userStore)
    {
        this.httpServer = httpServer;
        this.wsServer = wsServer;
        this.userStore = userStore;
    }

    public void shutdown()
    {
        System.out.println("Shutting down server...");
        this.httpServer.stop(1);
        try
        {
            wsServer.stop();
        }
        catch(Exception e)
        {
            System.out.println("Encountered exception " + e.getClass().getName() + " while attempting to close WebSocket server:\n" + e);
        }
        userStore.saveUsers();
        System.out.println("Shutdown complete.");
    }
}

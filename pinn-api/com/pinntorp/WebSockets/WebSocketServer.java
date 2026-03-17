package com.pinntorp.WebSockets;

import com.pinntorp.Server.Api.ConnectionHandler;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * This class implements a unified server that listens for incoming connections
 * and spins up a ConnectionHandler thread to route it as HTTP or WebSocket.
 */
public class WebSocketServer extends Thread {
    private ServerSocket serverSocket = null;
    private volatile boolean running = true;
    private String webRoot;

    /**
     * Creates a unified server listening on a port.
     */
    public WebSocketServer(int port, String webRoot) throws IOException {
        this.serverSocket = new ServerSocket(port);
        this.webRoot = webRoot;
    }

    public void requestStop() {
        this.running = false;
    }

    @Override
    public void run() {
        while (running) {
            try {
                // Accept incoming connection
                Socket clientTcp = this.serverSocket.accept();
                // Pass it to the smart HTTP/WebSocket router thread
                new ConnectionHandler(clientTcp, webRoot).start();
            } catch (Exception e) {
                System.out.println("Encountered " + e.getClass().getName()
                        + " while trying to accept an incoming connection.\nTrace:\n" + e.getStackTrace()
                        + "\nException:\n" + e);
            }
        }
    }
}

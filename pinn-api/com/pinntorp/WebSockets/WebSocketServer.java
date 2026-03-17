package com.pinntorp.WebSockets;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;

/**
 * This class implements a simple WebSocket server that listens
 * for incoming connections with a thread, and returns a WebSocket
 * object for each client connection.
 *
 * Implementation reference:
 * https://en.wikipedia.org/wiki/WebSocket
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_a_WebSocket_server_in_Java
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
 * https://datatracker.ietf.org/doc/html/rfc6455#section-5.2
 */
public class WebSocketServer extends Thread {
    private ServerSocket serverSocket = null;
    private volatile boolean running = true;

    /**
     * Creates a WebSocket server that will listen for incoming
     * connections on the specified port.
     * 
     * @param port the port to listen on
     */
    public WebSocketServer(int port) throws IOException {
        this.serverSocket = new ServerSocket(port);
    }

    /**
     * Sets the running flag of the listening loop to false,
     * allowing the server to gracefully stop.
     */
    public void requestStop() {
        this.running = false;
    }

    /**
     * DO NOT CALL THIS METHOD
     * This is the internal thread run method
     */
    @Override
    public void run() {
        // Listening loop
        while (running) {
            try {
                // Accept incoming connection
                Socket clientTcp = this.serverSocket.accept();
                WebSocket clientWs = new WebSocket(clientTcp);
            } catch (Exception e) {
                System.out.println("Encountered " + e.getClass().getName()
                        + " while trying to accept an incoming WebSocket connection.\nTrace:\n" + e.getStackTrace()
                        + "\nException:\n" + e);
            }
        }
    }
}

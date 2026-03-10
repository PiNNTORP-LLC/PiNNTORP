package com.pinntorp.Server;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;

public class WsServer extends WebSocketServer
{
    public WsServer(int port)
    {
        super(new InetSocketAddress(port));
    }

    @Override
    public void onStart()
    {

    }

    @Override
    public void onOpen(WebSocket connection, ClientHandshake handshake)
    {

    }

    @Override
    public void onClose(WebSocket connection, int code, String reason, boolean remote)
    {

    }

    @Override
    public void onMessage(WebSocket connection, String message)
    {
        // Parse message as JSON

    }

    @Override
    public void onError(WebSocket connection, Exception e)
    {

    }
}

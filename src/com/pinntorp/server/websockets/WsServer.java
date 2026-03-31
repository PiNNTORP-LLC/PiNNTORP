package com.pinntorp.server.websockets;

import com.pinntorp.server.Json;
import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;

import java.net.InetSocketAddress;
import java.util.concurrent.ConcurrentHashMap;

public class WsServer extends WebSocketServer
{
    private final ConcurrentHashMap<WebSocket, Integer> connectionMap;

    public WsServer(int port)
    {
        super(new InetSocketAddress(port));
        this.connectionMap = new ConcurrentHashMap<>();
    }

    @Override
    public void onMessage(WebSocket connection, String messageString)
    {
        // Parse message as JSON
        WsMessage message = Json.GSON.fromJson(messageString, WsMessage.class);

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
    public void onError(WebSocket connection, Exception e)
    {

    }
}

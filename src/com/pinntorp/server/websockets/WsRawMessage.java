package com.pinntorp.server.websockets;

import java.nio.charset.StandardCharsets;

/**
 * This class acts as an object for packaging data and opcode, representing
 * a received WebSocket message.
 */
public class WsRawMessage
{
    private byte[] data;
    private int opcode;

    public WsRawMessage(byte[] data, int opcode)
    {
        this.data = data;
        this.opcode = opcode;
    }

    public byte[] getBytes()
    {
        return this.data;
    }

    public String getString()
    {
        return new String(this.data, StandardCharsets.UTF_8);
    }

    public int getOpcode()
    {
        return this.opcode;
    }
}

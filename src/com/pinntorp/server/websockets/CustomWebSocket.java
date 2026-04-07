package com.pinntorp.server.websockets;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * This class implements a simple WebSocket socket that allows
 * for easy communication between client and server.
 *
 * Implementation reference:
 * https://en.wikipedia.org/wiki/WebSocket
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_a_WebSocket_server_in_Java
 * https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
 * https://datatracker.ietf.org/doc/html/rfc6455#section-5.2
 */
public class CustomWebSocket {

    private Socket socket;
    private OutputStream output;
    private InputStream input;
    private boolean open;
    private boolean closeSent;

    /**
     * Creates a WebSocket connection over a socket.
     *
     * @param socket  the TCP socket to use
     * @param headers the HTTP headers from the upgrade request
     * @throws IOException              if an I/O error occurs
     * @throws NoSuchAlgorithmException if SHA-1 is missing
     */
    public CustomWebSocket(Socket socket, java.util.Map<String, String> headers)
            throws IOException, NoSuchAlgorithmException {
        this.socket = socket;
        this.output = socket.getOutputStream();
        this.input = socket.getInputStream();

        String keyString = (headers != null) ? headers.get("Sec-WebSocket-Key") : null;

        if (keyString != null && !keyString.isEmpty()) {
            // MDN magic for turning "Sec-WebSocket-Key" into "Sec-WebSocket-Accept"
            String base64Accept = Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-1")
                    .digest((keyString + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").getBytes(StandardCharsets.UTF_8)));

            // Generate handshake response
            byte[] response = ("HTTP/1.1 101 Switching Protocols\r\n"
                    + "Connection: Upgrade\r\n"
                    + "Upgrade: websocket\r\n"
                    + "Sec-WebSocket-Accept: "
                    + base64Accept
                    + "\r\n\r\n").getBytes(StandardCharsets.UTF_8);

            this.output.write(response, 0, response.length);
            this.open = true;
            this.closeSent = false;
        } else {
            this.close();
        }
    }

    public boolean isOpen() {
        return this.open;
    }

    public WsRawMessage receive() {
        if (!this.open)
            return null;

        byte[] message = null;
        int opcode = -1;
        try {
            boolean fin = false;
            do {
                int meta = this.input.read();
                if (meta == -1) {
                    this.open = false;
                    return null;
                }
                opcode = meta & 0x0f;
                fin = (meta & 0x80) == 0x80;

                int lengthMask = this.input.read();
                long length = lengthMask & 0x7f;
                boolean mask = (lengthMask & 0x80) == 0x80;

                if (length == 126) {
                    length = this.input.read() << 8 | this.input.read();
                } else if (length == 127) {
                    byte[] longLength = this.input.readNBytes(8);
                    length = 0;
                    for (int i = 0; i < 8; i++) {
                        length = length << 8 | (longLength[i] & 0xFF);
                    }
                }

                byte[] maskingKey = null;
                if (mask) {
                    maskingKey = this.input.readNBytes(4);
                }

                if (length <= Integer.MAX_VALUE) {
                    int intLength = (int) length;
                    byte[] encoded = this.input.readNBytes(intLength);
                    byte[] decoded = new byte[intLength];
                    if (mask) {
                        for (int i = 0; i < intLength; i++) {
                            decoded[i] = (byte) (encoded[i] ^ maskingKey[i & 0x03]);
                        }
                    } else {
                        decoded = encoded;
                    }

                    if (message == null) {
                        message = decoded;
                    } else {
                        byte[] merged = new byte[message.length + intLength];
                        System.arraycopy(message, 0, merged, 0, message.length);
                        System.arraycopy(decoded, 0, merged, message.length, intLength);
                        message = merged;
                    }
                } else {
                    throw new Exception("Message too large");
                }

                if (opcode == 8) {
                    this.close(true);
                    return null;
                }
            } while (!fin);
        } catch (Exception e) {
            this.open = false;
        }

        return new WsRawMessage(message, opcode);
    }

    public void send(byte[] message, byte[] maskingKey, boolean masked, int opcode) {
        if (!this.open)
            return;

        try {
            int length = message.length;
            this.output.write((byte) (0x80 | (opcode & 0x0f)));

            if (length < 126) {
                this.output.write(masked ? (length | 0x80) : length);
            } else if (length <= 65535) {
                this.output.write(masked ? (126 | 0x80) : 126);
                this.output.write((length >> 8) & 0xff);
                this.output.write(length & 0xff);
            } else {
                this.output.write(masked ? (127 | 0x80) : 127);
                for (int i = 7; i >= 0; i--) {
                    this.output.write((int) ((long) length >> (8 * i)) & 0xff);
                }
            }

            if (masked) {
                this.output.write(maskingKey);
                for (int i = 0; i < length; i++) {
                    this.output.write(message[i] ^ maskingKey[i & 0x03]);
                }
            } else {
                this.output.write(message);
            }
            this.output.flush();
        } catch (Exception e) {
            this.open = false;
        }
    }

    public void send(byte[] message) {
        this.send(message, null, false, 2);
    }

    public void send(String message) {
        this.send(message.getBytes(StandardCharsets.UTF_8), null, false, 1);
    }

    public void close(boolean clientInitiated) throws IOException {
        if (!this.open)
            return;
        if (clientInitiated) {
            this.send(new byte[] { (byte) 0x03, (byte) 0xe8 }, null, false, 8);
        } else {
            this.send(new byte[] { (byte) 0x03, (byte) 0xe8 }, null, false, 8);
            // Confirmation frame expected, but for simplicity we close now
        }
        this.open = false;
        this.socket.close();
    }

    public void close() throws IOException {
        this.close(false);
    }
}

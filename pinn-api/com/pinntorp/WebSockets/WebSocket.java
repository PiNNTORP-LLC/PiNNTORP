package com.pinntorp.WebSockets;

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
public class WebSocket
{

    private Socket socket;
    private OutputStream output;
    private InputStream input;
    private boolean open;
    private boolean closeSent;

    /**
     * Creates a WebSocket connection over a socket.
     * @param socket    the TCP socket to use
     * @throws IOException  if an I/O error occurs while reading or writing on the socket
     * @throws NoSuchAlgorithmException if the SHA-1 algorithm isn't available for performing the handshake
     */
    public WebSocket(Socket socket) throws IOException, NoSuchAlgorithmException
    {
        // Get input and output streams for socket
        this.output = socket.getOutputStream();
        this.input = socket.getInputStream();

        // Read HTTP request
        String request = new String(this.input.readAllBytes(), StandardCharsets.UTF_8);

        // Strip request "\r\n\r\n" tail
        request = request.substring(0, request.length()-2);

        // Split request into headers
        String[] headers = request.split("\\r\\n");

        // Check that the websocket upgrade request is valid, and get the key
        boolean isValidRequest = false;
        String keyString = "";
        if(headers[0].startsWith("GET"))
        {
            // Iterate through the headers of the request
            for (String header : headers)
            {
                // Check that the "Upgrade: websocket" header is present
                if (header.equals("Upgrade: websocket"))
                {
                    isValidRequest = true;
                }
                // Get the key from the "Sec-WebSocket-Key" header
                else if (header.startsWith("Sec-WebSocket-Key: "))
                {
                    keyString = header.substring(22);
                    isValidRequest = true;
                }
            }
        }

        // If request valid, generate and send handshake response
        if(isValidRequest)
        {
            // MDN magic for turning "Sec-WebSocket-Key" into "Sec-WebSocket-Accept"
            String base64Accept = Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-1").digest((keyString + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").getBytes(StandardCharsets.UTF_8)));

            // Generate handshake response
            byte[] response = (
                    "HTTP/1.1 101 Switching Protocols\r\n"
                            + "Connection: Upgrade\r\n"
                            + "Upgrade: websocket\r\n"
                            + "Sec-WebSocket-Accept: "
                            + base64Accept
                            + "\r\n\r\n").getBytes(StandardCharsets.UTF_8);

            // Write the response back to the client, completing handshake
            this.output.write(response, 0, response.length);
            this.open = true;
            this.closeSent = false;
        }
        else
        {
            // Request is invalid, jobs done
            this.close();
        }
    }

    /**
     * Returns true if the websocket connection is open.
     * @return whether WebSocket is open
     */
    public boolean isOpen()
    {
        return this.open;
    }

    /**
     * Receive the next available WebSocket message.
     * @return the message received
     */
    public Message receive()
    {
        // Check if socket is actually open still
        if(!this.open)
        {
            return null;
        }

        byte[] message = null;  // Decoded message buffer
        int opcode = -1;        // Message opcode
        try
        {
            // Read fragments until last fragment reached
            boolean fin = false;
            do
            {
                // Read meta byte
                int meta = this.input.read();
                opcode = meta & 0x0f;
                fin = (meta & 0x80) == 0x80;

                // Read payload length and the mask bit
                int lengthMask = this.input.read();
                long length = lengthMask & 0x7f;
                boolean mask = (lengthMask & 0x80) == 0x80;

                // Check if extended payload length
                if (length == 126)
                {
                    // Read the next two bytes as a 16-bit unsigned int
                    length = this.input.read() << 8 | this.input.read();
                }
                else if (length == 127)
                {
                    // Read the next eight bytes as a 64-bt unsigned int
                    byte[] longLength = this.input.readNBytes(8);
                    length = 0;
                    for (int i = 0; i < 8; i++) {
                        length = length << 8 | longLength[i];
                    }
                }

                // Read masking key if mask set
                byte[] maskingKey = null;
                if (mask)
                {
                    maskingKey = this.input.readNBytes(4);
                }

                // Read the payload data
                if (length <= Integer.MAX_VALUE)
                {
                    // Clamp length down to an int if it's less than the max int value
                    int intLength = (int) Math.min(length, Integer.MAX_VALUE);

                    // Read and decode the payload data
                    byte[] encoded = this.input.readNBytes(intLength);
                    byte[] decoded = new byte[intLength];
                    for (int i = 0; i < intLength; i++) {
                        decoded[i] = (byte) (encoded[i] ^ maskingKey[i & 0x03]);
                    }

                    // Add decoded data to message buffer
                    if(message == null)
                    {
                        // Set decoded as the message buffer if it's empty
                        message = decoded;
                    }
                    else
                    {
                        // Stick decoded to the end of the message buffer
                        byte[] merged = new byte[message.length + intLength];
                        System.arraycopy(message, 0, merged, 0, message.length);
                        System.arraycopy(decoded, 0, merged, message.length, intLength);
                        message = merged;
                    }
                }
                else
                {
                    // The message is massive, just throw an exception
                    throw new Exception("The message is massive");

                    // TODO: handle 64-bit unsigned payload length
                }

                // Check if close frame received and close frame was not sent by the server
                if(opcode == 8 && !closeSent)
                {
                    this.close(true);
                }
            } while(!fin);
        }
        catch(Exception e)
        {
            System.out.println("Encountered " + e.getClass().getName() + " while attempting to receive string over websocket.\n" + e);
        }

        // Return the message received
        return new Message(message, opcode);
    }

    /**
     * Send a WebSocket frame with the provided parameters over the WebSocket.
     * @param message       the payload to send
     * @param maskingKey    the 4 byte masking key to mask the payload with if masked is set to true
     * @param masked        the masked flag, which should only be set to true for client to server frames
     * @param opcode        the frame <a href="https://en.wikipedia.org/wiki/WebSocket#Opcodes">opcode</a>
     */
    public void send(byte[] message, byte[] maskingKey, boolean masked, int opcode)
    {
        // Check if socket is actually open still
        if(!this.open)
        {
            return;
        }

        try
        {
            // Get the length of the message
            int length = message.length;

            // Send the meta byte
            this.output.write((byte)(0x80 | (opcode & 0x0f)));

            // Send the payload length
            if(length < 126)
            {
                // Payload length is one byte large
                if(masked)
                {
                    // Set "mask" bit with payload length
                    this.output.write(length & 0x7f | 0x80);
                }
                else
                {
                    this.output.write(length & 0x7f);
                }
            }
            else if(Integer.compareUnsigned(length, 65535) <= 0)
            {
                // Payload length is "126" and two bytes large
                if(masked)
                {
                    // Payload length is "254" if "mask" bit is set
                    this.output.write(254);
                }
                else
                {
                    this.output.write(126);
                }
                int low = length & 0xff;
                int high = length - low;
                this.output.write(high);
                this.output.write(low);
            }
            else
            {
                // Payload length is "127" and eight bytes large
                if(masked)
                {
                    // Payload length is "255" if "mask" bit is set
                    this.output.write(255);
                }
                else
                {
                    this.output.write(127);
                }
                for(int i = 0; i < 8; i++)
                {
                    this.output.write(length & (0xff << 8 * (7 - i)));
                }
            }

            // Send the masking key and the masked message if the masked flag is set
            if(masked)
            {
                this.output.write(maskingKey);
                for(int i = 0; i < length; i++)
                {
                    this.output.write(message[i] ^ maskingKey[i & 0x03]);
                }
            }
            else
            {
                this.output.write(message);
            }
        }
        catch(Exception e)
        {
            System.out.println("Encountered " + e.getClass().getName() + " while attempting to send message over websocket.\n" + e);
        }
    }

    /**
     * Send the provided binary message over the WebSocket.
     * @param message   the message to send
     */
    public void send(byte[] message)
    {
        this.send(message, null, false, 2);
    }

    /**
     * Send the provided string message over the WebSocket.
     * @param message   the message to send
     */
    public void send(String message)
    {
        this.send(message.getBytes(StandardCharsets.UTF_8), null, false, 1);
    }

    /**
     * Send a close request to the client, closing the WebSocket upon receiving the close response.
     * Alternatively, send close response and close the WebSocket if clientInitiated is set to true.
     * @param clientInitiated   Set to true if the first close frame was received from the client, indicating client requested close
     * @throws IOException      If an I/O error occurs while closing the underlying TCP socket.
     */
    public void close(boolean clientInitiated) throws IOException
    {
        // Check if close was initiated by client
        if(clientInitiated)
        {
            // Close was initiated by client, send close response with status code 1000 "Normal closure"
            this.send(new byte[]{(byte)0x03, (byte)0xe8}, null, false, 8);
        }
        else
        {
            // Initiate close with status code 1000 "Normal closure"
            this.send(new byte[]{(byte)0x03, (byte)0xe8}, null, false, 8);

            // Receive frames until close frame received
            while(true)
            {
                Message frame = this.receive();
                if(frame.getOpcode() == 8)
                {
                    // Close frame received
                    break;
                }
            }
        }

        // Close connection
        this.open = false;
        this.socket.close();
    }

    /**
     * Send a close request to the client, and then close this WebSocket
     * upon receiving a close confirmation back.
     * @throws IOException  If an I/O error occurs while closing the underlying TCP socket.
     */
    public void close() throws IOException
    {
        this.close(false);
    }
}

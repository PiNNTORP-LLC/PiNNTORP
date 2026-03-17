# WebSocket Statechart Diagram

The following diagram represents the lifecycle and operational states of the `WebSocket.java` class, including handshaking, active communication, and connection termination processes.

```mermaid
stateDiagram-v2
    [*] --> Handshaking: Constructor(Socket)
    
    state Handshaking {
        [*] --> ReadHeaders
        ReadHeaders --> ValidatingHeaders
        ValidatingHeaders --> SendingResponse: Headers Valid
        ValidatingHeaders --> [*]: Headers Invalid
    }
    
    Handshaking --> Open: Handshake Complete\n(open = true)
    Handshaking --> Closed: Handshake Failed\n(close() called)
    
    state Open {
        [*] --> Idle
        Idle --> Receiving: receive() called
        Receiving --> Idle: Frame Received\n(opcode != 8)
        
        Idle --> Sending: send() called
        Sending --> Idle: Data Sent
    }
    
    Open --> Closing_ClientInitiated: Receive Close Frame\n(opcode 8)
    Open --> Closing_ServerInitiated: close() called
    
    state Closing_ClientInitiated {
        [*] --> SendCloseResponse: Send Status 1000
        SendCloseResponse --> [*]
    }
    
    state Closing_ServerInitiated {
        [*] --> SendCloseRequest: Send Status 1000
        SendCloseRequest --> WaitConfirmation: receive() loop
        WaitConfirmation --> [*]: Recv Close Frame\n(opcode 8)
    }
    
    Closing_ClientInitiated --> Closed: Finish Close
    Closing_ServerInitiated --> Closed: Finish Close
    
    state Closed {
        [*] --> CloseSocket: socket.close()\n(open = false)
        CloseSocket --> [*]
    }

    Closed --> [*]
```

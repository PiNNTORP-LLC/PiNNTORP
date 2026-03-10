# PiNNTORP System Architecture

This document contains UML diagrams representing the current state of both the Java backend and the JavaScript frontend aswell as the connection between them.

## 1. Backend (Java) Class Diagram

```mermaid
classDiagram
    direction TB

    class Main {
        +main(String[] args)
        +clean()
    }

    class ControlWindow {
        +ControlWindow()
    }

    class ConsolePanel {
        -JTextArea consoleText
        +ConsolePanel()
        +updateConsole()
    }

    class Console {
        -ConcurrentLinkedQueue~String~ messageBuffer
        -AtomicBoolean flushScheduled
        -Runnable flushFunction
        +setFlushFunction(Runnable function)
        +markAsFlushed()
        +log(String message)
        +poll() String
    }

    class BrowserPanel {
        +BrowserPanel()
    }

    class InspectorPanel {
        +InspectorPanel()
    }

    class WebSocketServer {
        -ServerSocket serverSocket
        -boolean running
        +WebSocketServer(int port)
        +requestStop()
        +run()
    }

    class WebSocket {
        -Socket socket
        -OutputStream output
        -InputStream input
        -boolean open
        +WebSocket(Socket socket)
        +isOpen() boolean
        +receive() Message
        +send(String message)
        +close()
    }

    class Message {
        -byte[] data
        -int opcode
        +Message(byte[] data, int opcode)
        +getBytes() byte[]
        +getString() String
        +getOpcode() int
    }

    Main ..> ControlWindow
    ControlWindow *-- ConsolePanel
    ControlWindow *-- BrowserPanel
    ControlWindow *-- InspectorPanel
    ConsolePanel ..> Console
    WebSocketServer ..> WebSocket
    WebSocket ..> Message
```

---

## 2. Frontend (JavaScript) Module Diagram

```mermaid
graph TD
    subgraph Core
        State[state.js]
        Storage[storage.js]
    end

    subgraph Features
        Game[game.js]
        Friends[friends.js]
        Stats[stats.js]
    end

    subgraph Views [UI Layers]
        GV[gameView.js]
        FV[friendsView.js]
        SV[statsView.js]
    end

    App[app.js] --> State
    App --> GV
    App --> FV
    App --> SV

    GV --> Game
    FV --> Friends
    SV --> Stats

    Game --> State
    Friends --> State
    Stats --> State

    Game --> Storage
    Friends --> Storage
    Stats --> Storage
    
    Storage -.-> LocalStorage[(Local Storage)]
```

---

## 3. Data Structure (State)
The frontend state is shaped as follows:

```mermaid
classDiagram
    class GlobalState {
        +String currentUser
        +Map~String, User~ users
    }

    class User {
        +int gamesPlayed
        +int wins
        +int losses
        +int profit
        +String[] friends
        +String[] favoriteGames
    }

    GlobalState "1" *-- "many" User
```

---

## 4. Current Connection Status
Currently, there is **no communication** between these two systems.

```mermaid
sequenceDiagram
    participant Browser as Client (JS App)
    participant Java as Server (PiNNTORP Server)
    
    Browser->>Browser: Saves to LocalStorage
```

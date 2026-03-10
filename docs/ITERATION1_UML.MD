# PiNNTORP System Architecture

This document contains UML diagrams representing the current state of both the Java backend and the JavaScript frontend aswell as the connection between them.

## 1. Frontend Module Relationships
The frontend is built with vanilla JavaScript using a modular approach.

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

## 2. Frontend Data Structure
The state of the application is centralized.

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

## 3. Game Flow: Slots
The following sequence diagram shows the flow of a single round of the Slots from user interaction to data persistence.

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant GV as gameView.js
    participant Game as game.js/slotGame.js
    participant State as state.js
    participant Storage as storage.js
    
    User->>GV: Clicks "Spin" Button
    GV->>Game: play()
    
    Note over Game: Generates 3 random numbers (1-7)
    Note over Game: Check matches (3-of-3 or 2-of-3)
    
    Game->>State: Update user statistics
    Note right of State: Profit: +Win (multiplier) or -Loss (bet)
    
    Game->>Storage: saveState(state)
    Storage->>Storage: Write to LocalStorage
    
    Game-->>GV: Returns [num1, num2, num3]
    GV->>GV: Update slot display in DOM
    GV->>GV: Trigger Stats View Re-render
```

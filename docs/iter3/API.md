# PiNNTORP API Reference (Iteration 3)

The PiNNTORP backend provides a unified RESTful API and WebSocket interface on **Port 8080**.

## 1. Authentication

All protected routes require a **JSON Web Token (JWT)** in the `Authorization` header.

### `POST /api/register`
Creates a new user account.
- **Body**: `{"username": "...", "password": "..."}`
- **Response**: `201 Created` on success.

### `POST /api/login`
Authenticates a user and returns a session token.
- **Body**: `{"username": "...", "password": "..."}`
- **Response**: `{"status": "success", "token": "JWT_TOKEN_HERE"}`

---

## 2. User & State

### `GET /api/state`
Returns the current player's statistics and balance.
- **Header**: `Authorization: Bearer <TOKEN>`
- **Response**: `{"status": "success", "gamesPlayed": 0, "wins": 0, "losses": 0, "profit": 0}`

### `POST /api/user/delete` (New in Iteration 3)
Permanently deletes the authenticated user's account.
- **Header**: `Authorization: Bearer <TOKEN>`
- **Response**: `200 OK` on success.

---

## 3. Game Logic (Authoritative)

### `POST /api/gamble` (Slot Machine)
Executes a single spin of the slot machine.
- **Header**: `Authorization: Bearer <TOKEN>`
- **Response**: `{"nums": [1, 2, 3], "profit": 10, ...}`

### `POST /api/dice` (Dice Roll)
Executes a dice roll guess.
- **Header**: `Authorization: Bearer <TOKEN>`
- **Body**: `{"guess": 4}`
- **Response**: `{"roll": 4, "won": true, "profit": 10, ...}`

---

## 4. WebSockets

Connect to `ws://localhost:8080/` to participate in real-time features.

### Message Formats
- **Join Lobby**: `{"type": "join_lobby", "lobbyId": "..."}`
- **Game Move**: `{"type": "move", "action": "hit"}`
- **Broadcast**: Server sends `{"type": "update", "state": {...}}` to all clients in the lobby.

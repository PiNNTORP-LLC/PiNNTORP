# Iteration 3 Writeup

**Iteration Duration:** March 24 - April 6, 2026

Iteration 3 was focused on transforming PiNNTORP from a loose collection of frontend components into a **fully unified, multiplayer gambling platform** with a single server and professional-grade security, logging, and account management.

## 1. Key Achievements

### 1.1 Unified Architecture
Iteration 3's primary technical outcome was the **unification of the server architecture**. Previously, the project required separate instances for static files, authentication, and game data (split across ports 5500, 5000, and often 8080). 
- We successfully merged all services into a single **Java Unified Server (Port 8080)**.
- This eliminated CORS issues and significantly reduced the complexity of deployment.
- The `start-server.bat` script now initiates this single instance, making the dev-to-test cycle seamless.

### 1.2 Multiplayer Blackjack & Lobbies
Building upon Iteration 2's core game mechanics, we introduced a **WebSocket-based Lobby system**.
- Players can now join a Blackjack table synchronously with up to 4 other users.
- Game states (e.g., card draws, dealer timers, and bets) are now **server-authoritative**, preventing client-side cheating.
- A new `LobbyManager` on the backend handles player joining/leaving and game state broadcasting.

### 1.3 Account Deletion & Security
To meet modern data privacy standards, we implemented the following:
- **Full Account Deletion**: A new endpoint `/api/user/delete` that wipes all traces of a user from the `users.json` database and simultaneously clears their frontend session.
- **JWT Authentication**: Migrated from simple session IDs to signed JSON Web Tokens (JWT) for all protected API calls, improving security and scalability.
- **Backend-First State**: User balance, friends list, and game history now prefer the backend (if available) as the single source of truth, with local storage as a robust fallback.

### 1.4 Technical Debt & Polishing
- Redundant server files in `src/` and `pinn-api/` were archived or merged to prevent confusion.
- Comprehensive JSDoc and JavaDoc documentation was added across the most complex modules (`ConnectionHandler.java`, `game.js`).
- UI consistency was improved with a global header/footer and a dedicated Profile section.

## 2. Updated Project Metadata

| Metric | Status |
|---|---|
| **Primary Port** | 8080 (HTTP & WebSocket) |
| **Data Format** | JSON (JWT, users.json) |
| **Major Features** | Lobbies, Blackjack, Friends, Auth, Account Deletion |
| **System Testing** | 10 Scenarios (ST-01 to ST-10) fully implemented |

---

## 3. Reflections on Iteration 3

The team's velocity increased as we moved towards a shared understanding of the unified backend. The decision to prioritize architectural cleanup early in the iteration paid off by allowing for rapid implementation of the Multiplayer Lobby system. PiNNTORP is now positioned as a robust, scalable platform ready for final stakeholder delivery.

*Document prepared by the PiNNTORP LLC Engineering Team.*

# Lab 10 - Customer Meeting

**Project:** PiNNTORP LLC - Online Gambling Platform  
**Team:** Adrian Ahmadi, Hayden Dunn, Eric Beaulne, and Nikola Grujin  
**Date:** 2026-03-27

---

## 1. Completed Features of Iteration 2

| ID | Feature | Assignee | Status |
|---|---|---|---|
| I2-01a | Recommendation Algorithm - Mix of Friend and User Play Frequency | Adrian + Nikola | Done |
| I2-01b | Deduplication of Duplicate Game Keys like `Number Guesser` -> `Dice Roll` | Adrian | Done |
| I2-02a | Java Auth Server `/login` Endpoint - Register, Login, Logout with CORS Support | Nikola | Done |
| I2-02b | Java Auth Server `/friends` Endpoint - Add, Remove, List, Requests, Accept, Decline, Cancel, Find | Nikola | Done |
| I2-02c | Frontend `auth.js` - Session Management, Header Chip with Username + Logout, Login, Register Forms | Eric | Done |
| I2-02d | Frontend `friendsView.js` - Full Rewrite Using Backend When Online, Local Implementation When Offline | Adrian | Done |
| I2-02e | Gated Login and Register Pages, Redirects for Unauthenticated Users on `games.html` and `profile.html` | Hayden | Done |
| I2-03 | Blackjack Card Game with Hit, Stand, Dealer with a Bet Input | Adrian | Done |
| I2-04a | Logging of Game History Using `logResult()` in All Four Games, History Displayed on Profile Page | Hayden | Done |
| I2-04b | Updated Tests for Stats Module, Account Deletion Stubs (TDD Red Tests) | Hayden | Done |
| I2-05 | `start-server.bat` Script Compiles and Runs Java Servers Automatically | Hayden | Done |
| - | Favicon Path Fix Across All HTML Pages | Hayden | Done |

---

## 2. Testing Plan

### 2.1 Unit Tests

| ID | Module | Description | View |
|---|---|---|---|
| UT-01 | `state.js` | State is initialized with the correct default values | CB |
| UT-02 | `storage.js` | Saving and loading state returns the same data | CB |
| UT-03 | `friends.js` | Adding a friend adds them to the list | CB |
| UT-04 | `friends.js` | Adding a duplicate friend is rejected | CB |
| UT-05 | `friends.js` | Removing a friend removes them from the list | CB |
| UT-06 | `stats.js` | Stats start at zero for a new user | CB |
| UT-07 | `stats.js` | Resetting stats sets all values to zero | CB |
| UT-08 | `rec.js` | A friend's favourite game appears in recommendations | CB |
| UT-09 | `rec.js` | The user's own favourite game is recommended to themselves | CB |
| UT-10 | `account.js` | Deleting an account removes it from storage | CB |
| UT-11 | `account.js` | Deleting an account removes the user from all friend lists | CB |
| UT-12 | `account.js` | Deleting an account that does not exist returns an error | CB |
| UT-13 | `slotGame.js` | Slot game calculates win/loss correctly | CB |
| UT-14 | `diceRoll.js` | Dice roll calculates win/loss correctly | CB |
| UT-15 | `coinFlip.js` | Coin flip calculates win/loss correctly | CB |
| UT-16 | `stats.js` | Win/loss ratio does not error when no games have been played | CB |
| UT-17 | `storage.js` | localStorage is cleaned up properly after saving state | TB |
| UT-18 | `stats.js` | No leftover data remains after resetting stats | TB |
| UT-19 | `account.js` | No leftover data remains in storage after deleting an account | TB |
| UT-20 | `LoginHandler` (Java) | Registering a new user stores their credentials | CB |
| UT-21 | `LoginHandler` (Java) | Logging in with correct credentials succeeds | CB |
| UT-22 | `LoginHandler` (Java) | Registering with an existing username is rejected | CB |
| UT-23 | `UserStore` (Java) | Looking up a user that does not exist returns nothing | CB |
| UT-24 | `SessionManager` (Java) | An expired session token is rejected | CB |

### 2.2 Integration Tests

| ID | Components | Description | View |
|---|---|---|---|
| IT-01 | `state.js` + `storage.js` | State is still correct after saving and reloading | CB |
| IT-02 | `stats.js` + `state.js` | Playing a game correctly updates the stats | CB |
| IT-03 | `friends.js` + `rec.js` | A friend's games show up in recommendations | CB |
| IT-04 | `rec.js` + `state.js` | Games played more often rank higher in recommendations | CB |
| IT-05 | `auth.js` + `LoginHandler` | Logging in saves a session token and the server recognizes it | TB |
| IT-06 | `friendsView.js` + `FriendsHandler` | Adding a friend in the UI is saved by the server | TB |
| IT-07 | `auth.js` + `FriendsHandler` | A request to the friends API without being logged in is rejected, and no data is returned | TB |
| IT-08 | `LoginHandler` + `SessionManager` | Logging in produces a valid session token | CB |
| IT-09 | `FriendsHandler` + `UserStore` | Adding a friend fails if one of the users does not exist | CB |
| IT-10 | `LoginHandler` + `UserStore` | Logging out invalidates the session | CB |
| IT-11 | `LoginHandler` + `UserStore` | User data is cleaned up properly after registering then deleting an account | TB |
| IT-12 | `FriendsHandler` + `SessionManager` | Friends operations require a valid session | CB |

### 2.3 System Tests

| ID | Scenario | Expected Steps | Expected Result | View |
|---|---|---|---|---|
| ST-01 | New user registration | Open app and register a new user | User registration successful and redirect to games | OB |
| ST-02 | Login, play a game, bet, check balance | Login and play slots, bet on slots, check balance | Display result of the bet and update balance | OB |
| ST-03 | View history of games played | Play a game of blackjack and view profile and history | Display game in a table | OB |
| ST-04 | Friend request flow | Register two users and send friend request and accept it | Both users will be in friend list of each other | OB |
| ST-05 | Recommendations update | Register a new user, add friend playing Dice Roll, and check recommendations | Dice Roll will be in recommendations list | OB |
| ST-06 | Unauthenticated Redirect | Try to access games.html without authentication | Should redirect to index.html page | OB |
| ST-07 | Session Persistence | Log in to the application, close the tab, and then reopen the application | Should still be logged in | OB |
| ST-08 | Account Deletion | Log in to the application, delete your account, and then log in again | Should not log in; should display message saying account does not exist | OB |
| ST-09 | Deleted User Removed from Friend List | Delete your friend who is in your friend list | Should not display the deleted user in the friend list | OB |
| ST-10 | Full New User Experience | Create account, play all games, and then check stats | Should display stats for all games | OB |

### 2.4 Testing View Assignments

| View | Who | How |
|---|---|---|
| **Clear Box (CB)** | Adrian (JS), Nikola (Java) | Full source access, automated tests |
| **Translucent Box (TB)** | Nikola (Java integration), Eric (stats/view integration) | API known, internals not inspected |
| **Opaque Box (OB)** | Hayden (gameplay & recommendations), Eric (account) | Browser only, no source access |

---

## 3. Build Scripts

There are two scripts included in the repository's root directory.

### `start-server.bat`

You can simply double-click or use it from the terminal with no arguments needed.

**What it does (in order):**
1. Compiles `pinn-api/` using pre-built class files found in `pinn-api/build/`
2. Runs the game server on port 8080
3. Compiles auth/friends server found in `src/` using the gson jar found in `pinn-api/lib/`
4. Kills any existing process on port 5500 to avoid "address already in use" error on restart
5. Runs auth server on port 5500
6. Opens browser to `http://localhost:8080`
7. **Fallback** - If Java compilation fails, start a Python or Node.js static file server on port 5500 and open browser

### `run-tests.bat`

Runs the full automated JavaScript test suite.

```
node --test tests/friends.test.js tests/stats.test.js tests/accountDeletion.test.js
```

Exit code 0 = all tests pass.

---

## 4. Documentation Plan

### 4.1 Developer Documentation

| What | Format | Where | Who |
|---|---|---|---|
| Java class and method documentation | JavaDoc comments | `src/com/pinntorp/server/` and `pinn-api/` | Nikola |
| JavaScript module documentation | JSDoc comments | `js/` modules | Adrian + Hayden |
| Architecture overview (components, ports, data flow) | Markdown | `docs/iter3/ARCHITECTURE.md` | Eric |
| API reference (/login, /friends endpoints) | Markdown table | `docs/iter3/API.md` | Nikola |

### 4.2 User / In-Application Documentation

| What | Format | Where | Who |
|---|---|---|---|
| How to run the app (bat script, prerequisites) | Markdown | `README.md` (root) | Hayden |
| In-app game rules | Tooltip/help text on each game panel | `games.html` | Adrian |
| Friends system explainer | Short paragraph | `friends.html` | Adrian |

### 4.3 Initial Documentation

The following documentation is already available:
- `README.md` - project overview, tech stack, how to start the server
- `docs/iter1/` - task board, UML diagram, burndown chart, retrospective
- `docs/iter2/` - task board, WebSocket state chart, burndown chart

---

## 5. Proposal - Leaderboard Feature

We suggest the addition of a **Global Leaderboard** panel on `index.html`, ranking all registered users by overall profit.

- New GET endpoint `/leaderboard` returns top 10 users by profit from `users.json`.
- Frontend calls the endpoint on page load and displays a ranked table.
- No additional data storage required - profit is already stored per user.

**Estimated development time:** 3-4 developer days.

### Customer Decision Required:

Will this be included in Iteration 3?

* [ ] Yes - include in Iteration 3 backlog
* [ ] No - remove this
* [ ] Modified version: ___________________________

---

## 6. Final Required Feature List

*Please indicate which features are required to be complete at the final customer meeting (Lab 11):*

| Feature | Required / Nice-to-Have / Not Required |
|---|---|
| Account deletion | |
| All tests passing | |
| Developer documentation (JavaDoc/JSDoc) | |
| Architecture/API reference docs | |
| Leaderboard | |
| Other: ___________________________ | |

---

*Document prepared by Hayden Dunn (Quality Assurance) - PiNNTORP LLC*

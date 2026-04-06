import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const loginHandlerSource = readFileSync("src/com/pinntorp/server/handlers/LoginHandler.java", "utf8");
const userStoreSource = readFileSync("src/com/pinntorp/server/UserStore.java", "utf8");
const sessionManagerSource = readFileSync("src/com/pinntorp/server/SessionManager.java", "utf8");
const sessionSource = readFileSync("src/com/pinntorp/server/Session.java", "utf8");
const friendsHandlerSource = readFileSync("src/com/pinntorp/server/handlers/FriendsHandler.java", "utf8");
const authSource = readFileSync("js/core/auth.js", "utf8");
const friendsViewSource = readFileSync("js/friends/friendsView.js", "utf8");
const appSource = readFileSync("js/app.js", "utf8");

test("[UT-20] registering a new user stores their credentials", () => {
    assert.match(loginHandlerSource, /action\.equals\("register"\)/);
    assert.match(loginHandlerSource, /userStore\.register\(username, password\)/);
    assert.match(loginHandlerSource, /userStore\.saveUsers\(\)/);
});

test("[UT-21] logging in with correct credentials succeeds", () => {
    assert.match(loginHandlerSource, /action\.equals\("login"\)/);
    assert.match(loginHandlerSource, /userStore\.login\(username, password\)/);
    assert.match(loginHandlerSource, /response\.addProperty\("success", playerID != -1\)/);
});

test("[UT-22] registering with an existing username is rejected", () => {
    assert.match(userStoreSource, /findByUsername\(username\) != -1/);
    assert.match(userStoreSource, /return -1;/);
});

test("[UT-23] looking up a user that does not exist returns nothing", () => {
    assert.match(userStoreSource, /public int findByUsername\(String username\)/);
    assert.match(userStoreSource, /return -1;/);
});

test("[UT-24] an expired session token is rejected", () => {
    assert.match(sessionManagerSource, /public Session verifySession\(String sessionID\)/);
    assert.match(sessionManagerSource, /session == null \? null : session\.verify\(\)/);
    assert.match(sessionSource, /if\(System\.currentTimeMillis\(\) > this\.expiry\)/);
    assert.match(sessionSource, /return null;/);
});

test("[IT-05] logging in saves a session token and the server recognizes it", () => {
    assert.match(authSource, /localStorage\.setItem\("jwt", data\.token\)/);
    assert.match(loginHandlerSource, /this\.sessionManager\.startSession\(playerID\)/);
});

test("[IT-06] adding a friend in the UI is saved by the server", () => {
    assert.match(friendsViewSource, /friendsPost\(\{ action: "add", friendUsername:/);
    assert.match(friendsHandlerSource, /request\.action\.equals\("add"\)/);
    assert.match(friendsHandlerSource, /this\.userStore\.saveUsers\(\)/);
});

test("[IT-07] a friends API request without login is rejected and no data is returned", () => {
    assert.match(friendsHandlerSource, /verifySession\(request\.sessionID\)/);
    assert.match(friendsHandlerSource, /exchange\.sendResponseHeaders\(401, -1\)/);
});

test("[IT-08] logging in produces a valid session token", () => {
    assert.match(sessionManagerSource, /generateSessionID/);
    assert.match(sessionManagerSource, /startSession\(int playerID\)/);
    assert.match(sessionManagerSource, /this\.sessions\.put\(sessionID, new Session\(playerID\)\)/);
});

test("[IT-09] adding a friend fails if one of the users does not exist", () => {
    assert.match(userStoreSource, /public boolean sendFriendRequest\(int playerID, int friendID\)/);
    assert.match(userStoreSource, /if\(sender != null && receiver != null\)/);
    assert.match(userStoreSource, /return false;/);
});

test("[IT-10] logging out invalidates the session", () => {
    assert.match(authSource, /export function logoutUser\(\)/);
    assert.match(authSource, /localStorage\.removeItem\("jwt"\)/);
    assert.match(loginHandlerSource, /action\.equals\("logout"\)/);
    assert.match(loginHandlerSource, /this\.sessionManager\.endSession\(sessionID\)/);
});

test("[IT-12] friends operations require a valid session", () => {
    assert.match(friendsHandlerSource, /if\(!request\.action\.equals\("find"\)\)/);
    assert.match(friendsHandlerSource, /session == null \|\| session\.getPlayerID\(\) != request\.playerID/);
});

test("[ST-06] unauthenticated users are redirected away from protected pages", () => {
    assert.match(appSource, /const _protectedPages = \["index\.html", "games\.html", "profile\.html", "coin\.html", "friends\.html"\]/);
    assert.match(appSource, /if \(_protectedPages\.includes\(_page\) && !isLoggedIn\(\)\)/);
    assert.match(appSource, /window\.location\.replace\("login\.html"\)/);
});

test("[ST-07] session persistence uses the stored jwt on app startup", () => {
    assert.match(authSource, /export function isLoggedIn\(\)/);
    assert.match(authSource, /return !!localStorage\.getItem\("jwt"\)/);
    assert.match(appSource, /if \(isLoggedIn\(\)\)/);
    assert.match(appSource, /const \{ username \} = getSession\(\)/);
});

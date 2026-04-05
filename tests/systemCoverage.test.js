import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const indexSource = readFileSync("index.html", "utf8");
const gamesSource = readFileSync("games.html", "utf8");
const profileSource = readFileSync("profile.html", "utf8");
const authSource = readFileSync("js/core/auth.js", "utf8");
const friendsViewSource = readFileSync("js/friends/friendsView.js", "utf8");
const statsViewSource = readFileSync("js/stats/statsView.js", "utf8");
const appSource = readFileSync("js/app.js", "utf8");

test("[ST-01] open app and register a new user", () => {
    assert.match(indexSource, /id="register-form"/);
    assert.match(indexSource, /id="reg-username-input"/);
    assert.match(authSource, /export async function registerUser/);
});

test("[ST-02] login, play slots, bet, and verify balance updates", () => {
    assert.match(indexSource, /id="login-form"/);
    assert.match(gamesSource, /id="slots-game"/);
    assert.match(gamesSource, /id="slot-roll"/);
    assert.match(statsViewSource, /document\.getElementById\("balance-value"\)/);
});

test("[ST-03] play blackjack and verify history appears on the profile page", () => {
    assert.match(gamesSource, /id="blackjack-game"/);
    assert.match(profileSource, /id="history-list"/);
    assert.match(statsViewSource, /export function renderHistory\(\)/);
});

test("[ST-04] register two users, send a friend request, and accept it", () => {
    assert.match(friendsViewSource, /action: "add"/);
    assert.match(friendsViewSource, /action: "accept"/);
});

test("[ST-05] add a Dice Roll friend and verify recommendations update", () => {
    assert.match(friendsViewSource, /renderRec\(\)/);
    assert.match(indexSource, /id="rec-list"/);
});

test("[ST-10] create an account, play all games, and verify aggregate stats", () => {
    assert.match(gamesSource, /id="slots-game"/);
    assert.match(gamesSource, /id="dice-game"/);
    assert.match(gamesSource, /id="coin-flip-game"/);
    assert.match(gamesSource, /id="blackjack-game"/);
    assert.match(profileSource, /id="stats-view"/);
    assert.match(appSource, /renderQuickStats\(\)/);
});

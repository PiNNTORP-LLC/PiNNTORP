import test from "node:test";
import assert from "node:assert/strict";

import { addFriend, getFriends, removeFriend } from "../js/friends/friends.js";
import { ensureUserState, state, replaceState } from "../js/core/state.js";

globalThis.localStorage = {
    saved: {},
    clear() {
        this.saved = {};
    },
    getItem(key) {
        if (key in this.saved) return this.saved[key];
        return null;
    },
    setItem(key, value) {
        this.saved[key] = String(value);
    }
};

globalThis.alertHistory = [];
globalThis.alert = (message) => {
    globalThis.alertHistory.push(message);
};

function resetFriendPage(friendList = ["dummy_alice"]) {
    globalThis.localStorage.clear();
    globalThis.alertHistory = [];

    replaceState({
        currentUser: "main_user",
        users: {
            main_user: {
                gamesPlayed: 12,
                wins: 8,
                losses: 4,
                profit: 65,
                friends: friendList,
                favoriteGames: []
            },
            dummy_alice: {
                gamesPlayed: 6,
                wins: 4,
                losses: 2,
                profit: 15,
                friends: [],
                favoriteGames: []
            },
            dummy_charlie: {
                gamesPlayed: 9,
                wins: 3,
                losses: 6,
                profit: -10,
                friends: [],
                favoriteGames: []
            }
        }
    });
}

test("main_user already has dummy_alice on the friend list", () => {
    resetFriendPage();

    const friends = getFriends();

    assert.equal(friends.length, 1);
    assert.equal(friends[0], "dummy_alice");
});

test("default fallback state seeds all dummy users into main_user friends", () => {
    globalThis.localStorage.clear();
    replaceState(null);

    assert.deepEqual(state.users.main_user.friends, [
        "dummy_alice",
        "dummy_bob",
        "dummy_charlie"
    ]);
});

test("ensureUserState creates a separate local profile for a signed-in username", () => {
    replaceState(null);

    const sessionUser = ensureUserState("casey");
    state.currentUser = "casey";
    sessionUser.wins = 4;

    assert.equal(state.users.casey.wins, 4);
    assert.equal(state.users.main_user.wins, 0);
    assert.deepEqual(Object.keys(state.users).sort(), [
        "casey",
        "dummy_alice",
        "dummy_bob",
        "dummy_charlie",
        "main_user"
    ]);
});

test("blank text from the friend form is ignored", () => {
    resetFriendPage();

    const worked = addFriend(" ");

    assert.equal(worked, false);
    assert.deepEqual(getFriends(), ["dummy_alice"]);
    assert.equal(globalThis.localStorage.getItem("pinntorp_state_v1"), null);
});

test("typing a username that does not exist shows the same alert the app uses", () => {
    resetFriendPage();

    const worked = addFriend("not_a_real_user");

    assert.equal(worked, false);
    assert.deepEqual(globalThis.alertHistory, ["User does not exist"]);
    assert.deepEqual(getFriends(), ["dummy_alice"]);
});

test("typing a name that is not stored exactly in the user list does not change the friends list", () => {
    resetFriendPage();

    const worked = addFriend("DUMMY_ALICE");

    assert.equal(worked, false);
    assert.deepEqual(getFriends(), ["dummy_alice"]);
    assert.deepEqual(globalThis.alertHistory, ["User does not exist"]);
});

test("adding dummy_charlie updates both the in-memory state and the saved browser copy", () => {
    resetFriendPage();

    assert.equal(state.users.main_user.friends.includes("dummy_charlie"), false);

    const worked = addFriend("dummy_charlie");

    assert.equal(worked, true);
    assert.deepEqual(state.users.main_user.friends, ["dummy_alice", "dummy_charlie"]);

    const rawSavedState = globalThis.localStorage.getItem("pinntorp_state_v1");
    const savedState = JSON.parse(rawSavedState);
    assert.deepEqual(savedState.users.main_user.friends, ["dummy_alice", "dummy_charlie"]);
});

test("removing dummy_alice leaves main_user with no friends", () => {
    resetFriendPage();
    removeFriend("dummy_alice");

    assert.deepEqual(getFriends(), []);

    const savedState = JSON.parse(globalThis.localStorage.getItem("pinntorp_state_v1"));
    assert.deepEqual(savedState.users.main_user.friends, []);
});

test("trying to remove dummy_charlie does nothing when only dummy_alice is on the list", () => {
    resetFriendPage(["dummy_alice"]);

    const before = [...state.users.main_user.friends];

    removeFriend("dummy_charlie");

    assert.deepEqual(state.users.main_user.friends, before);
    assert.deepEqual(getFriends(), ["dummy_alice"]);
    assert.equal(globalThis.localStorage.getItem("pinntorp_state_v1"), null);
});

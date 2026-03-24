import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { state, replaceState } from "../js/core/state.js";
import { deleteCurrentAccount } from "../js/account/account.js";

globalThis.localStorage = {
    data: {},
    clear() {
        this.data = {};
    },
    getItem(key) {
        return this.data[key] ?? null;
    },
    setItem(key, value) {
        this.data[key] = String(value);
    }
};

function seedAccountState() {
    replaceState({
        currentUser: "main_user",
        users: {
            main_user: {
                gamesPlayed: 12,
                wins: 8,
                losses: 4,
                profit: 65,
                friends: ["dummy_alice", "dummy_bob"],
                favoriteGames: ["Slots"]
            },
            dummy_alice: {
                gamesPlayed: 6,
                wins: 4,
                losses: 2,
                profit: 15,
                friends: ["main_user"],
                favoriteGames: ["Slots"]
            },
            dummy_bob: {
                gamesPlayed: 9,
                wins: 3,
                losses: 6,
                profit: -10,
                friends: ["main_user", "dummy_alice"],
                favoriteGames: ["Dice Roll"]
            }
        }
    });
}

beforeEach(() => {
    globalThis.localStorage.clear();
    seedAccountState();
});

test("red: deleting the current account removes that user from the state", () => {
    const deletedUsername = deleteCurrentAccount();

    assert.equal(deletedUsername, "main_user");
    assert.equal(state.users.main_user, undefined);
    assert.equal(state.currentUser, null);
});

test("deleting the current account also removes that username from every remaining friend list", () => {
    deleteCurrentAccount();

    assert.deepEqual(state.users.dummy_alice.friends, []);
    assert.deepEqual(state.users.dummy_bob.friends, ["dummy_alice"]);
});

test("deleting the current account persists the updated users map to localStorage", () => {
    deleteCurrentAccount();

    const savedState = JSON.parse(globalThis.localStorage.getItem("pinntorp_state_v1"));
    assert.equal(savedState.currentUser, null);
    assert.equal(savedState.users.main_user, undefined);
    assert.deepEqual(savedState.users.dummy_alice.friends, []);
    assert.deepEqual(savedState.users.dummy_bob.friends, ["dummy_alice"]);
});

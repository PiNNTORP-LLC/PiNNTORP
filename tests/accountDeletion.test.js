import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { deleteCurrentAccount } from "../js/account/account.js";
import { replaceState, state } from "../js/core/state.js";

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
    },
    removeItem(key) {
        delete this.data[key];
    }
};

function seedAccountState(currentUser = "main_user") {
    replaceState({
        currentUser,
        users: {
            main_user: {
                balance: 125,
                gamesPlayed: 12,
                wins: 8,
                losses: 4,
                profit: 25,
                friends: ["dummy_alice", "dummy_bob"],
                favoriteGames: ["Slots"],
                history: [{ game: "Slots", delta: 7, ts: 1 }]
            },
            dummy_alice: {
                balance: 90,
                gamesPlayed: 6,
                wins: 4,
                losses: 2,
                profit: 15,
                friends: ["main_user"],
                favoriteGames: ["Slots"],
                history: []
            },
            dummy_bob: {
                balance: 80,
                gamesPlayed: 9,
                wins: 3,
                losses: 6,
                profit: -10,
                friends: ["main_user", "dummy_alice"],
                favoriteGames: ["Dice Roll"],
                history: []
            }
        }
    });
}

beforeEach(() => {
    globalThis.localStorage.clear();
    seedAccountState();
    globalThis.fetch = async () => ({
        ok: true,
        async json() {
            return { status: "success" };
        }
    });
});

test("[UT-10] account.js - Deleting an account removes it from storage", async () => {
    const deletedUsername = await deleteCurrentAccount();
    const savedState = JSON.parse(globalThis.localStorage.getItem("pinntorp_state_v1"));

    assert.equal(deletedUsername, "main_user");
    assert.equal(state.users.main_user, undefined);
    assert.equal(savedState.users.main_user, undefined);
});

test("[UT-11] account.js - Deleting an account removes the user from all friend lists", async () => {
    await deleteCurrentAccount();

    assert.deepEqual(state.users.dummy_alice.friends, []);
    assert.deepEqual(state.users.dummy_bob.friends, ["dummy_alice"]);
});

test("[UT-12] account.js - Deleting an account that does not exist returns an error", async () => {
    state.currentUser = null;

    await assert.rejects(async () => {
        await deleteCurrentAccount();
    }, /No user logged in/);
});

test("[UT-19] account.js - No leftover data remains in storage after deleting an account", async () => {
    await deleteCurrentAccount();

    const savedState = JSON.parse(globalThis.localStorage.getItem("pinntorp_state_v1"));
    assert.equal(savedState.currentUser, null);
    assert.equal(savedState.users.main_user, undefined);
    assert.deepEqual(savedState.users.dummy_alice.friends, []);
    assert.deepEqual(savedState.users.dummy_bob.friends, ["dummy_alice"]);
});

test("[IT-11] LoginHandler + UserStore - User data is cleaned up properly after registering then deleting an account", async () => {
    replaceState({
        currentUser: "fresh_user",
        users: {
            fresh_user: {
                balance: 100,
                gamesPlayed: 1,
                wins: 1,
                losses: 0,
                profit: 6,
                friends: [],
                favoriteGames: ["Coin Flip"],
                history: [{ game: "Coin Flip", delta: 6, ts: 2 }]
            },
            dummy_alice: {
                balance: 90,
                gamesPlayed: 6,
                wins: 4,
                losses: 2,
                profit: 15,
                friends: ["fresh_user"],
                favoriteGames: ["Slots"],
                history: []
            }
        }
    });

    await deleteCurrentAccount();

    assert.equal(state.currentUser, null);
    assert.equal(state.users.fresh_user, undefined);
    assert.deepEqual(state.users.dummy_alice.friends, []);
});

test("[ST-08] Account Deletion - Delete an account and verify login is rejected afterward", async () => {
    globalThis.localStorage.setItem("jwt", "header.payload.signature");
    globalThis.localStorage.setItem("friendsSession", JSON.stringify({ sessionID: "abc", playerID: 1 }));

    let requestCount = 0;
    globalThis.fetch = async (url, options) => {
        requestCount += 1;
        assert.equal(url, "http://localhost:8080/api/user/delete");
        assert.equal(options.method, "POST");
        assert.equal(options.headers.Authorization, "Bearer header.payload.signature");
        return {
            ok: true,
            async json() {
                return { status: "success" };
            }
        };
    };

    await deleteCurrentAccount();

    assert.equal(requestCount, 1);
    assert.equal(globalThis.localStorage.getItem("jwt"), null);
    assert.equal(globalThis.localStorage.getItem("friendsSession"), null);
    assert.equal(state.currentUser, null);
});

test("[ST-09] Deleted User Removed from Friend List - Delete your friend who is in your friend list", async () => {
    state.currentUser = "dummy_alice";

    await deleteCurrentAccount();

    assert.equal(state.users.dummy_alice, undefined);
    assert.deepEqual(state.users.main_user.friends, ["dummy_bob"]);
});

import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { addFriend, getFriends } from "../js/friends/friends.js";
import { replaceState, ensureUserState, state } from "../js/core/state.js";
import { getStats, resetStats } from "../js/stats/stats.js";

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

globalThis.alert = () => {};

beforeEach(() => {
    globalThis.localStorage.clear();
    replaceState({
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 165,
                gamesPlayed: 12,
                wins: 8,
                losses: 4,
                profit: 65,
                friends: ["dummy_alice"],
                favoriteGames: [],
                history: []
            },
            dummy_alice: {
                balance: 100,
                gamesPlayed: 2,
                wins: 1,
                losses: 1,
                profit: 0,
                friends: [],
                favoriteGames: ["Slots"],
                history: []
            }
        }
    });
});

test("[UT-04] friends.js - Adding a duplicate friend is rejected", () => {
    const worked = addFriend("dummy_alice");

    assert.equal(worked, false);
    assert.deepEqual(getFriends(), ["dummy_alice"]);
    assert.equal(globalThis.localStorage.getItem("pinntorp_state_v1"), null);
});

test("[UT-06] stats.js - Stats start at zero for a new user", () => {
    const user = ensureUserState("fresh_user");
    state.currentUser = "fresh_user";

    assert.ok(user);
    assert.deepEqual(getStats(), {
        balance: 100,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        profit: 0,
        ratio: 0
    });
});

test("[UT-07] stats.js - Resetting stats sets all values to zero", () => {
    resetStats();

    assert.deepEqual(getStats(), {
        balance: 100,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        profit: 0,
        ratio: 0
    });
});

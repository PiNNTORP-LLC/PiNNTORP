import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { getStats, resetStats } from "../js/stats/stats.js";
import { replaceState } from "../js/core/state.js";

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
                friends: ["dummy_charlie"],
                favoriteGames: []
            }
        }
    });
});

test("getStats returns the saved totals", () => {
    assert.deepEqual(getStats(), {
        balance: 165,
        wins: 8,
        losses: 4,
        gamesPlayed: 12,
        profit: 65,
        ratio: "2.00"
    });
});

test("getStats handles zero losses", () => {
    replaceState({
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 110,
                gamesPlayed: 5,
                wins: 5,
                losses: 0,
                profit: 10,
                friends: ["dummy_charlie"],
                favoriteGames: []
            }
        }
    });

    assert.deepEqual(getStats(), {
        balance: 110,
        wins: 5,
        losses: 0,
        gamesPlayed: 5,
        profit: 10,
        ratio: 5
    });
});

test("resetStats zeros everything out and keeps the friend list", () => {
    resetStats();

    assert.deepEqual(getStats(), {
        balance: 100,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        profit: 0,
        ratio: 0
    });

    const saved = JSON.parse(globalThis.localStorage.getItem("pinntorp_state_v1"));
    assert.deepEqual(saved.users.main_user, {
        balance: 100,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        profit: 0,
        friends: ["dummy_charlie"],
        favoriteGames: [],
        history: []
    });
});

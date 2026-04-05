import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { loadState, saveState } from "../js/core/storage.js";

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
});

test("[UT-02] storage.js - Saving and loading state returns the same data", () => {
    const appState = {
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 145,
                gamesPlayed: 9,
                wins: 5,
                losses: 4,
                profit: 45,
                friends: ["dummy_alice"],
                favoriteGames: ["Slots"],
                history: [{ game: "Slots", delta: 7, ts: 12345 }]
            }
        }
    };

    saveState(appState);

    assert.deepEqual(loadState(), appState);
});

test("[UT-17] storage.js - localStorage is cleaned up properly after saving state", () => {
    saveState({
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 130,
                gamesPlayed: 4
            }
        }
    });

    saveState({
        currentUser: "second_user",
        users: {
            second_user: {
                balance: 210,
                gamesPlayed: 11
            }
        }
    });

    assert.deepEqual(loadState(), {
        currentUser: "second_user",
        users: {
            second_user: {
                balance: 210,
                gamesPlayed: 11
            }
        }
    });
});

test("[REGRESS-09] loadState returns null when localStorage contains invalid JSON", () => {
    globalThis.localStorage.setItem("pinntorp_state_v1", "{not-valid-json");

    assert.equal(loadState(), null);
});

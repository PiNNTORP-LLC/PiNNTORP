import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { replaceState, state } from "../js/core/state.js";
import { saveState, loadState } from "../js/core/storage.js";
import { getStats } from "../js/stats/stats.js";
import { coinFlipApi } from "../js/game/games/coinFlip.js";
import { addFriend } from "../js/friends/friends.js";
import { getRecommendedGames } from "../js/recommendation/rec.js";

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

const originalRandom = Math.random;

beforeEach(() => {
    globalThis.localStorage.clear();
    Math.random = originalRandom;
});

test("[IT-01] state is still correct after saving and reloading", () => {
    const snapshot = {
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 140,
                gamesPlayed: 8,
                wins: 5,
                losses: 3,
                profit: 40,
                friends: ["dummy_alice"],
                favoriteGames: ["Slots"],
                history: [{ game: "Slots", delta: 7, ts: 1 }]
            }
        }
    };

    saveState(snapshot);
    replaceState(loadState());

    assert.deepEqual(state.users.main_user, {
        balance: 140,
        gamesPlayed: 8,
        wins: 5,
        losses: 3,
        profit: 40,
        friends: ["dummy_alice"],
        favoriteGames: ["Slots"],
        history: [{ game: "Slots", delta: 7, ts: 1 }]
    });
});

test("[IT-02] playing a game correctly updates the stats", () => {
    replaceState({
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 100,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                profit: 0,
                friends: [],
                favoriteGames: [],
                history: []
            }
        }
    });

    Math.random = () => 0.9;
    coinFlipApi.play("Heads");

    assert.deepEqual(getStats(), {
        balance: 106,
        wins: 1,
        losses: 0,
        gamesPlayed: 1,
        profit: 6,
        ratio: 1
    });
});

test("[IT-03] a friend's games show up in recommendations", () => {
    replaceState({
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 100,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                profit: 0,
                friends: [],
                favoriteGames: [],
                history: []
            },
            friend_1: {
                balance: 100,
                gamesPlayed: 5,
                wins: 2,
                losses: 3,
                profit: 0,
                friends: [],
                favoriteGames: ["Blackjack"],
                history: []
            }
        }
    });

    addFriend("friend_1");

    const recommendations = getRecommendedGames();

    assert.equal(recommendations[0].game, "Blackjack");
    assert.deepEqual(recommendations[0].friends, ["friend_1"]);
});

test("[IT-04] games played more often rank higher in recommendations", () => {
    replaceState({
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 100,
                gamesPlayed: 4,
                wins: 2,
                losses: 2,
                profit: 0,
                friends: [],
                favoriteGames: [],
                history: [
                    { game: "Slots", delta: 7, ts: 1 },
                    { game: "Slots", delta: -5, ts: 2 },
                    { game: "Slots", delta: 7, ts: 3 },
                    { game: "Coin Flip", delta: 6, ts: 4 }
                ]
            }
        }
    });

    const recommendations = getRecommendedGames();

    assert.equal(recommendations[0].game, "Slots");
    assert.equal(recommendations[0].playCount, 3);
    assert.equal(recommendations[1].game, "Coin Flip");
    assert.equal(recommendations[1].playCount, 1);
});

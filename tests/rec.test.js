import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { getRecommendedGames } from "../js/recommendation/rec.js";
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
});

test("[UT-08] rec.js - A friend's favourite game appears in recommendations", () => {
    replaceState({
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 100,
                gamesPlayed: 0,
                wins: 0,
                losses: 0,
                profit: 0,
                friends: ["friend_1"],
                favoriteGames: [],
                history: []
            },
            friend_1: {
                balance: 100,
                gamesPlayed: 3,
                wins: 2,
                losses: 1,
                profit: 15,
                friends: [],
                favoriteGames: ["Blackjack"],
                history: []
            }
        }
    });

    const recommendations = getRecommendedGames();

    assert.equal(recommendations.length > 0, true);
    assert.equal(recommendations[0].game, "Blackjack");
    assert.deepEqual(recommendations[0].friends, ["friend_1"]);
});

test("[UT-09] rec.js - The user's own favourite game is recommended to themselves", () => {
    replaceState({
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 100,
                gamesPlayed: 4,
                wins: 2,
                losses: 2,
                profit: 5,
                friends: [],
                favoriteGames: [],
                history: [
                    { game: "Slots", delta: 7, ts: 1 },
                    { game: "Slots", delta: -5, ts: 2 },
                    { game: "Slots", delta: 14, ts: 3 },
                    { game: "Coin Flip", delta: 6, ts: 4 }
                ]
            }
        }
    });

    const recommendations = getRecommendedGames();

    assert.equal(recommendations[0].game, "Slots");
    assert.equal(recommendations[0].playCount, 3);
    assert.deepEqual(recommendations[0].friends, []);
});

test("[REGRESS-08] Number Guesser is deduplicated into Dice Roll recommendations", () => {
    replaceState({
        currentUser: "main_user",
        users: {
            main_user: {
                balance: 100,
                gamesPlayed: 2,
                wins: 1,
                losses: 1,
                profit: 0,
                friends: ["friend_1", "friend_2"],
                favoriteGames: [],
                history: [
                    { game: "Dice Roll", delta: 20, ts: 1 }
                ]
            },
            friend_1: {
                balance: 100,
                gamesPlayed: 1,
                wins: 1,
                losses: 0,
                profit: 20,
                friends: [],
                favoriteGames: ["Number Guesser"],
                history: []
            },
            friend_2: {
                balance: 100,
                gamesPlayed: 1,
                wins: 0,
                losses: 1,
                profit: -5,
                friends: [],
                favoriteGames: ["Dice Roll"],
                history: []
            }
        }
    });

    const recommendations = getRecommendedGames();
    const diceEntry = recommendations.find((entry) => entry.game === "Dice Roll");

    assert.ok(diceEntry);
    assert.equal(diceEntry.playCount, 1);
    assert.deepEqual(diceEntry.friends, ["friend_1", "friend_2"]);
});

import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { replaceState, state } from "../js/core/state.js";
import { slotGameApi } from "../js/game/games/slotGame.js";
import { diceRollApi } from "../js/game/games/diceRoll.js";
import { coinFlipApi } from "../js/game/games/coinFlip.js";

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

const originalRandom = Math.random;

function seedPlayer() {
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
}

function withRandomSequence(values) {
    let index = 0;
    Math.random = () => {
        const value = values[index];
        index += 1;
        return value ?? values[values.length - 1];
    };
}

beforeEach(() => {
    globalThis.localStorage.clear();
    seedPlayer();
    Math.random = originalRandom;
});

afterEach(() => {
    Math.random = originalRandom;
});

test("[UT-15] coinFlip.js - Coin flip calculates win/loss correctly: win case", () => {
    withRandomSequence([0.9]);

    const result = coinFlipApi.play("Heads");
    const user = state.users.main_user;

    assert.equal(result, "Heads");
    assert.equal(user.balance, 106);
    assert.equal(user.profit, 6);
    assert.equal(user.wins, 1);
    assert.equal(user.losses, 0);
    assert.equal(user.history[0].delta, 6);
});

test("[UT-14A] diceRoll.js - Dice roll calculates win/loss correctly: win case", async () => {
    withRandomSequence([0.3]);

    const round = await diceRollApi.play(2);
    const user = state.users.main_user;

    assert.deepEqual(round, { guess: 2, roll: 2, won: true });
    assert.equal(user.balance, 120);
    assert.equal(user.profit, 20);
    assert.equal(user.wins, 1);
    assert.equal(user.history[0].delta, 20);
});

test("[UT-14B] diceRoll.js - Dice roll calculates win/loss correctly: loss case", async () => {
    withRandomSequence([0.8]);

    const round = await diceRollApi.play(1);
    const user = state.users.main_user;

    assert.deepEqual(round, { guess: 1, roll: 5, won: false });
    assert.equal(user.balance, 95);
    assert.equal(user.profit, -5);
    assert.equal(user.losses, 1);
    assert.equal(user.history[0].delta, -5);
});

test("[UT-13A] slotGame.js - Slot game calculates win/loss correctly: two-match case", async () => {
    withRandomSequence([0.0, 0.0, 0.4]);

    const nums = await slotGameApi.play();
    const user = state.users.main_user;

    assert.deepEqual(nums, [1, 1, 3]);
    assert.equal(user.balance, 107);
    assert.equal(user.profit, 7);
    assert.equal(user.wins, 1);
    assert.equal(user.history[0].delta, 7);
});

test("[UT-13B] slotGame.js - Slot game calculates win/loss correctly: jackpot case", async () => {
    withRandomSequence([0.99, 0.99, 0.99]);

    const nums = await slotGameApi.play();
    const user = state.users.main_user;

    assert.deepEqual(nums, [7, 7, 7]);
    assert.equal(user.balance, 149);
    assert.equal(user.profit, 49);
    assert.equal(user.wins, 1);
    assert.equal(user.history[0].delta, 49);
});

test("[UT-13C] slotGame.js - Slot game calculates win/loss correctly: loss case", async () => {
    withRandomSequence([0.0, 0.2, 0.4]);

    const nums = await slotGameApi.play();
    const user = state.users.main_user;

    assert.deepEqual(nums, [1, 2, 3]);
    assert.equal(user.balance, 95);
    assert.equal(user.profit, -5);
    assert.equal(user.losses, 1);
    assert.equal(user.history[0].delta, -5);
});

import { state } from "../../core/state.js";
import { saveState } from "../../core/storage.js";
import { logResult } from "../../stats/stats.js";
import { getAuthHeaders, hasBackendSession, requestJson } from "../../core/network.js";

/**
* MODULE: Games (diceRoll.js)
*-------------------------------------------------------
* Purpose: implement a dice roll game logic where the user has to guess the number on the dice before the roll
*/

// for now using the assumption that the user makes a $5 bet
async function rollDice(guess) {
    // Prefer the backend result when the user has a session
    if (hasBackendSession()) {
        try {
            const user = state.users[state.currentUser];
            const round = await requestJson("/api/dice", {
                method: "POST",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({ guess: Number(guess) })
            });

            if (user && round.stats) {
                user.gamesPlayed = round.stats.gamesPlayed;
                user.wins = round.stats.wins;
                user.losses = round.stats.losses;
                user.profit = round.stats.profit;
                user.balance = 100 + (round.stats.profit || 0);
                logResult("Dice Roll", round.profit);
            }

            saveState(state);
            return { guess: round.guess, roll: round.roll, won: round.won };
        } catch (error) {
            console.warn("Falling back to local dice game:", error);
        }
    }

    // Fall back to the local round logic when offline
    const roll = Math.floor(Math.random() * 6) + 1;
    const won = Number(guess) === roll;
    const user = state.users[state.currentUser];

    user.gamesPlayed += 1;
    if (won) {
        user.wins += 1;
        user.balance += 10;
        user.profit += 10;
        logResult("Dice Roll", 10);
    } else {
        user.losses += 1;
        user.balance -= 5;
        user.profit -= 5;
        logResult("Dice Roll", -5);
    }

    saveState(state);
    return { guess: Number(guess), roll, won };
}

export const diceRollApi = {
    play: rollDice
};

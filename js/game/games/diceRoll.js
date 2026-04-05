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
    const WIN_PAYOUT = 20;
    const LOSS_AMOUNT = 5;
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
                user.gamesPlayed += 1;
                if (round.won) user.wins += 1;
                else user.losses += 1;
                user.profit += round.profit;
                user.balance += round.profit;
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
        user.balance += WIN_PAYOUT;
        user.profit += WIN_PAYOUT;
        logResult("Dice Roll", WIN_PAYOUT);
    } else {
        user.losses += 1;
        user.balance -= LOSS_AMOUNT;
        user.profit -= LOSS_AMOUNT;
        logResult("Dice Roll", -LOSS_AMOUNT);
    }

    saveState(state);
    return { guess: Number(guess), roll, won };
}

export const diceRollApi = {
    play: rollDice
};

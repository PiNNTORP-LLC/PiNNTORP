import { state } from "../../core/state.js";
import { saveState } from "../../core/storage.js";
import { logResult } from "../../stats/stats.js";
import { getAuthHeaders, hasBackendSession, requestJson } from "../../core/network.js";

/**
* MODULE: Games (slotGame.js)
*-------------------------------------------------------
* Purpose: Implement Slot Machine logic
*/

function threeOutOfThreeMatch(num1, num2, num3) {
    return num1 === num2 && num1 === num3;
}

function twoOutOfThreeMatch(num1, num2, num3) {
    return num1 === num2 || num1 === num3 || num2 === num3;
}

async function playSlotRound() {
    // Prefer the backend result when the user has a session
    if (hasBackendSession()) {
        try {
            const user = state.users[state.currentUser];
            const round = await requestJson("/api/gamble", {
                method: "POST",
                headers: getAuthHeaders({ "Content-Type": "application/json" })
            });

            if (user && round.stats) {
                user.gamesPlayed += 1;
                if (round.profit > 0) user.wins += 1;
                else user.losses += 1;
                user.profit += round.profit;
                user.balance += round.profit;
                logResult("Slots", round.profit);
            }

            saveState(state);
            return round.nums;
        } catch (error) {
            console.warn("Falling back to local slots game:", error);
        }
    }

    // Fall back to the local round logic
    const user = state.users[state.currentUser];
    const firstNum = Math.floor(Math.random() * 7) + 1;
    const secNum = Math.floor(Math.random() * 7) + 1;
    const thirdNum = Math.floor(Math.random() * 7) + 1;

    user.gamesPlayed += 1;
    if (threeOutOfThreeMatch(firstNum, secNum, thirdNum)) {
        const jackpot = firstNum * 5;
        user.wins += 1;
        user.balance += jackpot;
        user.profit += jackpot;
        logResult("Slots", jackpot);
    } else if (twoOutOfThreeMatch(firstNum, secNum, thirdNum)) {
        user.wins += 1;
        user.balance += 10;
        user.profit += 10;
        logResult("Slots", 10);
    } else {
        user.losses += 1;
        user.balance -= 5;
        user.profit -= 5;
        logResult("Slots", -5);
    }

    saveState(state);
    return [firstNum, secNum, thirdNum];
}

export const slotGameApi = {
    play: playSlotRound
};

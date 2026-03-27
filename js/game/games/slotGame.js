import { state } from "../../core/state.js";
import { saveState } from "../../core/storage.js";
import { logResult } from "../../stats/stats.js";
import { getAuthHeaders, hasBackendSession, requestJson } from "../../core/network.js";

// helper functions for checking values of slot numbers
function twoOutOfThreeMatch(num1, num2, num3) {
    if (num1 == num2 || num1 == num3 || num2 == num3) {
        return true;
    } else {
        return false;
    }
}

function threeOutOfThreeMatch(num1, num2, num3) {
    if (num1 == num2 && num1 == num3 && num3 == num2) {
        return true;
    } else {
        return false;
    }
}

// for now using the assumption that the user makes a $5 bet
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
                user.gamesPlayed = round.stats.gamesPlayed;
                user.wins = round.stats.wins;
                user.losses = round.stats.losses;
                user.profit = round.stats.profit;
                user.balance = round.stats.balance;
            }

            saveState(state);
            return round.nums;
        } catch (error) {
            console.warn("Falling back to local slots game:", error);
        }
    }

    // Fall back to the local round logic when offline
    const user = state.users[state.currentUser];

    // randomise the 3 slot numbers
    const firstNum = Math.floor(Math.random() * 7) + 1;
    const secNum = Math.floor(Math.random() * 7) + 1;
    const thirdNum = Math.floor(Math.random() * 7) + 1;

    // if all three match then multiply the number on the machine by the original bet
    // (for now assuming the user put a $5 bet)
    if (threeOutOfThreeMatch(firstNum, secNum, thirdNum)) {
        const jackpot = firstNum * 5;
        user.gamesPlayed += 1;
        user.wins += 1;
        user.balance += jackpot;
        user.profit += jackpot;
        logResult("Slots", jackpot);
    } else if (twoOutOfThreeMatch(firstNum, secNum, thirdNum)) {
        user.gamesPlayed += 1;
        user.wins += 1;
        user.balance += 10;
        user.profit += 10;
        logResult("Slots", 10);
    } else {
        user.gamesPlayed += 1;
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

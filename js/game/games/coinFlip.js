import { state } from "../../core/state.js";
import { saveState } from "../../core/storage.js";
import { logResult } from "../../stats/stats.js";

/**
* MODULE: Games (coinFlip.js)
*-------------------------------------------------------
* Purpose: Implement a standard game of coin flip logic
*/

function flipCoin(guess) {
    const WIN_PAYOUT = 6;
    const LOSS_AMOUNT = 5;
    const result = Math.random() >= 0.5 ? "Heads" : "Tails";
    const won = guess === result;
    const user = state.users[state.currentUser];

    user.gamesPlayed += 1;
    if (won) {
        user.wins += 1;
        user.balance += WIN_PAYOUT;
        user.profit += WIN_PAYOUT;
        logResult("Coin Flip", WIN_PAYOUT);
    } else {
        user.losses += 1;
        user.balance -= LOSS_AMOUNT;
        user.profit -= LOSS_AMOUNT;
        logResult("Coin Flip", -LOSS_AMOUNT);
    }

    saveState(state);
    return result;
}

export const coinFlipApi = {
    play: flipCoin
};

import { state } from "../../core/state.js";
import { saveState } from "../../core/storage.js";
import { logResult } from "../../stats/stats.js";

function flipCoin(guess) {
    const result = Math.random() >= 0.5 ? "Heads" : "Tails";
    const won = guess === result;
    const user = state.users[state.currentUser];

    user.gamesPlayed += 1;
    if (won) {
        user.wins += 1;
        user.balance += 10;
        user.profit += 10;
        logResult("Coin Flip", 10);
    } else {
        user.losses += 1;
        user.balance -= 5;
        user.profit -= 5;
        logResult("Coin Flip", -5);
    }

    saveState(state);
    return result;
}

export const coinFlipApi = {
    play: flipCoin
};

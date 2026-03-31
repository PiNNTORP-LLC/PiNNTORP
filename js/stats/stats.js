import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

/**
* MODULE: Statistics (stats.js)
*-------------------------------------------------------
* Purpose: Calculates the user's balance, profit, games played, and the win/loss ratio
*/

export function getStats() {
    const user = state.users[state.currentUser];
    const { balance, wins, losses, gamesPlayed, profit } = user;
    const ratio = losses === 0 ? wins : (wins / losses).toFixed(2);
    return { balance, wins, losses, gamesPlayed, profit, ratio };
}

export function getHistory() {
    const user = state.users[state.currentUser];
    return Array.isArray(user.history) ? user.history : [];
}

// Call this before saveState in each game — adds one entry to the front,
// keeps the log capped at 50 entries.
export function logResult(game, delta) {
    const user = state.users[state.currentUser];
    user.history.unshift({ game, delta, ts: Date.now() });
    if (user.history.length > 50) user.history.length = 50;
    if (!user.favoriteGames.includes(game)) {
        user.favoriteGames.push(game);
    }
}

export function resetStats() {
    const user = state.users[state.currentUser];
    user.balance = 100;
    user.gamesPlayed = 0;
    user.wins = 0;
    user.losses = 0;
    user.profit = 0;
    user.history = [];
    saveState(state);
}

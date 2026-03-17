import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

export function getStats() {
    const user = state.users[state.currentUser];
    if (!user) {
        return { wins: 0, losses: 0, gamesPlayed: 0, profit: 0, ratio: 0 };
    }
    const { wins, losses, gamesPlayed, profit } = user;
    const ratio = losses === 0 ? wins : (wins / losses).toFixed(2);
    return { wins, losses, gamesPlayed, profit, ratio };
}

export function resetStats() {
    const user = state.users[state.currentUser];
    if (!user) return;

    user.gamesPlayed = 0;
    user.wins = 0;
    user.losses = 0;
    user.profit = 0;
    saveState(state);
}
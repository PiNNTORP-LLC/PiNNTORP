import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

export function getStats() {
    const user = state.users[state.currentUser];
    const { balance, wins, losses, gamesPlayed, profit } = user;
    const ratio = losses === 0 ? wins : (wins / losses).toFixed(2);
    return { balance, wins, losses, gamesPlayed, profit, ratio };
}

export function resetStats() {
    // state.stats = { games_won: 0, games_lost: 0, gamesPlayed: 0 };
    const user = state.users[state.currentUser];
    user.balance = 100;
    user.gamesPlayed = 0;
    user.wins = 0;
    user.losses = 0;
    user.profit = 0;
    saveState(state);
}

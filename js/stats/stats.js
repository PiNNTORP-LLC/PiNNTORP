import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

export function getStats() {
    const { wins, losses, gamesPlayed } = state.stats;
    const ratio = losses === 0 ? wins : (wins / losses).toFixed(2);
    return { wins, losses, gamesPlayed, ratio };
}

export function resetStats() {
    state.stats = { wins: 0, losses: 0, gamesPlayed: 0 };
    saveState(state);
}
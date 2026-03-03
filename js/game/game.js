import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

export function playRound(guess) {
    const roll = Math.floor(Math.random() * 3) + 1;
    const won = Number(guess) === roll;

    state.stats.gamesPlayed += 1;
    if (won) state.stats.wins += 1;
    else state.stats.losses += 1;

    saveState(state);
    return { guess: Number(guess), roll, won };
}
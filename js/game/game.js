import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

export function playRound(guess) {
    const roll = Math.floor(Math.random() * 3) + 1;
    const won = Number(guess) === roll;
    const user = state.users[state.currentUser]

    user.gamesPlayed += 1;
    if (won) user.wins += 1, user.profit += 10;
    else user.losses += 1, user.profit -= 5;

    saveState(state);
    return { guess: Number(guess), roll, won };
}
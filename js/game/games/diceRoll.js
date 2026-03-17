import { state } from "../../core/state.js";
import { saveState } from "../../core/storage.js";

// for now using the assumption that the user makes a $5 bet
async function rollDice(guess) {
    try {
        const token = localStorage.getItem("jwt");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch("http://localhost:8080/api/dice", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ guess: Number(guess) })
        });

        const data = await response.json();

        // Update user state based on backend response
        if (data.stats) {
            const user = state.users[state.currentUser];
            if (user) {
                Object.assign(user, data.stats);
            }
        }

        saveState(state);
        return { guess: data.guess, roll: data.roll, won: data.won };

    } catch (error) {
        console.error("Dice roll API failed:", error);
        return { guess: Number(guess), roll: 1, won: false };
    }
}

export const diceRollApi = {
    play: rollDice
};

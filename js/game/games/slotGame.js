import { state } from "../../core/state.js";
import { saveState } from "../../core/storage.js";

async function playSlotRound() {
    try {
        const token = localStorage.getItem("jwt");
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const response = await fetch("http://localhost:8080/api/gamble", {
            method: "POST",
            headers: headers
        });

        const data = await response.json();

        // Update user state based on backend profit calculations
        const user = state.users[state.currentUser];
        user.gamesPlayed += 1;

        if (data.profit > 0) {
            user.wins += 1;
        } else {
            user.losses += 1;
        }
        user.profit += data.profit;

        saveState(state);
        return data.nums;

    } catch (error) {
        console.error("Backend gamble request failed:", error);
        return [0, 0, 0];
    }
}

export const slotGameApi = {
    play: playSlotRound
};

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
        if (data.stats) {
            const user = state.users[state.currentUser];
            Object.assign(user, data.stats);
        }

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

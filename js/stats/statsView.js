import { getStats, getHistory, resetStats } from "./stats.js";

/**
* MODULE: Statistics (statsView.js)
*-------------------------------------------------------
* Purpose: Handles the UI logic for the user's statistics
* Renders the History List
*/

export function renderBalance() {
    const el = document.getElementById("balance-value");

    if (!el) return;

    const s = getStats();
    const sign = s.balance >= 0 ? "$" : "-$";
    el.textContent = `${sign}${Math.abs(s.balance)}`;
}

export function renderStats() {
    const el = document.getElementById("stats-view");

    const s = getStats();
    renderBalance();

    if (!el) return;

    el.innerHTML = `
    <p>Balance: ${s.balance}</p>
    <p>Games: ${s.gamesPlayed}</p>
    <p>Wins: ${s.wins}</p>
    <p>W/L: ${s.ratio}</p>
    <p>Profit: ${s.profit}</p>
    `;
    // For now hide the losses from the user to avoid discouragement
    // <p>Losses: ${s.losses}</p>
}

export function renderHistory() {
    const el = document.getElementById("history-list");
    if (!el) return;

    const history = getHistory();

    if (history.length === 0) {
        el.innerHTML = '<p class="history-empty">No games played yet.</p>';
        return;
    }

    el.innerHTML = history.map(entry => {
        const sign = entry.delta > 0 ? "+" : "";
        const cls = entry.delta > 0 ? "history-win" : entry.delta < 0 ? "history-loss" : "history-push";
        const deltaText = entry.delta === 0 ? "Push" : `${sign}$${Math.abs(entry.delta)}`;
        const time = new Date(entry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        return `<div class="history-row">
            <span class="history-game">${entry.game}</span>
            <span class="history-delta ${cls}">${deltaText}</span>
            <span class="history-time">${time}</span>
        </div>`;
    }).join("");
}

export function initStatsView() {
    const resetButton = document.getElementById("reset-stats");

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            resetStats();
            renderStats();
            renderHistory();
        });
    }

    renderStats();
    renderHistory();
}

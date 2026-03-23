import { getStats, resetStats } from "./stats.js";

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

export function initStatsView() {
    const resetButton = document.getElementById("reset-stats");

    if (resetButton) {
        resetButton.addEventListener("click", () => {
        resetStats();
        renderStats();
        });
    }

    renderStats();
}

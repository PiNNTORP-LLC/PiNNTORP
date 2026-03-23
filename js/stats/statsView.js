import { getStats, resetStats } from "./stats.js";

export function renderStats() {
    const el = document.getElementById("stats-view");

    if (!el) return;

    const s = getStats();
    el.innerHTML = `
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

    if (!resetButton) return;

    resetButton.addEventListener("click", () => {
    resetStats();
    renderStats();
    });

    renderStats();
}
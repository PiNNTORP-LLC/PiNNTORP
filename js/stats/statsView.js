import { getStats, resetStats } from "./stats.js";

export function renderStats() {
    const el = document.getElementById("stats-view");
    const s = getStats();
    el.innerHTML = `
    <p>Games: ${s.gamesPlayed}</p>
    <p>Wins: ${s.wins}</p>
    <p>Losses: ${s.losses}</p>
    <p>Profit: ${s.profit}</p>
    <p>W/L: ${s.ratio}</p>
    `;
}

export function initStatsView() {
    document.getElementById("reset-stats").addEventListener("click", () => {
    resetStats();
    renderStats();
    });

    renderStats();
}
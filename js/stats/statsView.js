import { getStats, getHistory, resetStats, getLeaderboard } from "./stats.js";

/**
* MODULE: Statistics (statsView.js)
*-------------------------------------------------------
* Purpose: Handles the UI logic for the user's statistics
* Renders the History List
*/

export function renderBalance() {
    const el = document.getElementById("balance-value");
    const s = getStats();
    if (el) {
        const sign = s.balance >= 0 ? "$" : "-$";
        el.textContent = `${sign}${Math.abs(s.balance)}`;
    }
    // Keep the persistent left sidebar in sync on every page
    renderQuickStats();
    renderRecentGameCard();
    renderHomeActivity();
}

export function renderQuickStats() {
    const el = document.getElementById("quick-stats");
    if (!el) {
        return;
    }

    const s = getStats();
    const profitSign = s.profit > 0 ? "+" : "";
    const profitCls = s.profit > 0 ? "qs-pos" : s.profit < 0 ? "qs-neg" : "";
    const balSign = s.balance >= 0 ? "$" : "-$";

    el.innerHTML = `
        <div class="qs-card">
            <span class="qs-label">Balance</span>
            <span class="qs-value">${balSign}${Math.abs(s.balance)}</span>
        </div>
        <div class="qs-card">
            <span class="qs-label">Profit</span>
            <span class="qs-value ${profitCls}">${profitSign}$${Math.abs(s.profit)}</span>
        </div>
        <div class="qs-card">
            <span class="qs-label">Games</span>
            <span class="qs-value">${s.gamesPlayed}</span>
        </div>
        <div class="qs-card">
            <span class="qs-label">W / L</span>
            <span class="qs-value">${s.wins} / ${s.losses}</span>
        </div>
        <div class="qs-card">
            <span class="qs-label">Ratio</span>
            <span class="qs-value">${s.ratio}</span>
        </div>
    `;
}

export function renderStats() {
    const el = document.getElementById("stats-view");

    const s = getStats();
    renderBalance();
    renderLeaderboard();

    if (!el) {
        return;
    }

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
    if (!el) {
        return;
    }

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

export function renderHomeActivity() {
    const el = document.getElementById("home-activity-list");
    if (!el) {
        return;
    }

    const history = getHistory().slice(0, 3);

    if (history.length === 0) {
        el.innerHTML = `
            <div class="home-activity-empty">
                <p>No games played yet.</p>
                <a class="home-inline-link" href="games.html">Play a game to start building your activity.</a>
            </div>
        `;
        return;
    }

    el.innerHTML = history.map(entry => {
        const deltaSign = entry.delta > 0 ? "+" : entry.delta < 0 ? "-" : "";
        const deltaText = entry.delta === 0 ? "Push" : `${deltaSign}$${Math.abs(entry.delta)}`;
        const deltaCls = entry.delta > 0 ? "home-activity-delta home-activity-delta--win"
            : entry.delta < 0 ? "home-activity-delta home-activity-delta--loss"
                : "home-activity-delta home-activity-delta--push";
        const playedAt = new Date(entry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        return `
            <div class="home-activity-row">
                <div class="home-activity-main">
                    <span class="home-activity-game">${entry.game}</span>
                    <span class="home-activity-time">${playedAt}</span>
                </div>
                <span class="${deltaCls}">${deltaText}</span>
            </div>
        `;
    }).join("");
}

function getRecentGameMeta(gameName = "") {
    const key = gameName.trim().toLowerCase();
    const metas = {
        "slots": {
            theme: "slots",
            icon: "7 7 7",
            href: "games.html#slots-game",
        },
        "dice roll": {
            theme: "dice",
            icon: "⚄",
            href: "games.html#dice-game",
        },
        "number guesser": {
            theme: "dice",
            icon: "⚄",
            href: "games.html#dice-game",
        },
        "coin flip": {
            theme: "coin",
            icon: "◐",
            href: "games.html#coin-flip-game",
        },
        "blackjack": {
            theme: "blackjack",
            icon: "A♠",
            href: "games.html#blackjack-game",
        }
    };
    return metas[key] ?? {
        theme: "default",
        icon: "★",
        href: "games.html",
    };
}

export function renderRecentGameCard() {
    const el = document.getElementById("recent-game-card");
    if (!el) {
        return;
    }

    const history = getHistory();
    const latest = history[0];

    if (!latest) {
        el.className = "home-hero-art";
        el.innerHTML = `
            <div class="recent-game-empty">
                <span class="recent-game-kicker">Most Recent Game</span>
                <strong>No games played yet</strong>
                <p>Your latest table will appear here as soon as you finish a round.</p>
                <a class="recent-game-link" href="games.html">Open Games</a>
            </div>
        `;
        return;
    }

    const meta = getRecentGameMeta(latest.game);
    const deltaSign = latest.delta > 0 ? "+" : latest.delta < 0 ? "-" : "";
    const deltaText = latest.delta === 0 ? "Push" : `${deltaSign}$${Math.abs(latest.delta)}`;
    const deltaCls = latest.delta > 0 ? "recent-game-delta recent-game-delta--win"
        : latest.delta < 0 ? "recent-game-delta recent-game-delta--loss"
            : "recent-game-delta recent-game-delta--push";
    const playedAt = latest.ts
        ? new Date(latest.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "Just now";

    el.className = `home-hero-art recent-game-card recent-game-card--${meta.theme}`;
    el.innerHTML = `
        <div class="recent-game-copy">
            <span class="recent-game-kicker">Most Recent Game</span>
            <h3 class="recent-game-title">${latest.game}</h3>
            <div class="recent-game-stats">
                <div class="recent-game-stat">
                    <span>Result</span>
                    <strong class="${deltaCls}">${deltaText}</strong>
                </div>
                <div class="recent-game-stat">
                    <span>Played</span>
                    <strong>${playedAt}</strong>
                </div>
            </div>
            <a class="recent-game-link" href="${meta.href}">Play Again</a>
        </div>
        <div class="recent-game-visual" aria-hidden="true">
            <span class="recent-game-icon">${meta.icon}</span>
        </div>
    `;
}

function rankBadge(rank) {
    if (rank >= 1 && rank <= 3) {
        const names = { 1: "gold", 2: "silver", 3: "bronze" };
        return `<span class="lb-badge lb-badge--${names[rank]}" aria-label="Rank ${rank}">
            <svg class="lb-medal" viewBox="0 0 24 34" width="28" height="32" xmlns="http://www.w3.org/2000/svg">
                <polygon points="7,0 17,0 17,9 12,13 7,9" fill="currentColor" opacity="0.92"/>
                <circle cx="12" cy="25" r="9" fill="currentColor"/>
                <circle cx="12" cy="25" r="6.1" fill="none" stroke="rgba(11,15,14,0.35)" stroke-width="0.9"/>
                <text x="12" y="29.5" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="800" fill="rgba(11,15,14,0.88)">${rank}</text>
            </svg>
        </span>`;
    }
    return `<span class="lb-rank-num">#${rank}</span>`;
}

function formatCompactCurrency(value) {
    const abs = Math.abs(value);
    if (abs < 1000) {
        return `$${abs}`;
    }
    if (abs < 1000000) {
        const compact = (abs / 1000).toFixed(abs >= 10000 ? 0 : 1).replace(/\.0$/, "");
        return `$${compact}K`;
    }
    const compact = (abs / 1000000).toFixed(abs >= 10000000 ? 0 : 1).replace(/\.0$/, "");
    return `$${compact}M`;
}

export function renderLeaderboard() {
    const el = document.getElementById("leaderboard-list");
    if (!el) {
        return;
    }

    const { top5, userEntry, userInTop5 } = getLeaderboard();

    const rowHtml = (entry) => {
        const profitSign = entry.profit >= 0 ? "+" : "";
        const profitCls = entry.profit > 0 ? "lb-profit-pos" : entry.profit < 0 ? "lb-profit-neg" : "";
        const rankCls = entry.rank <= 3 ? ` lb-row--rank-${entry.rank}` : "";
        const youTag = entry.isCurrentUser ? `<span class="lb-you-tag">You</span>` : "";
        return `<div class="lb-row${entry.isCurrentUser ? " lb-row--you" : ""}${rankCls}">
            <div class="lb-medal-col">${rankBadge(entry.rank)}</div>
            <span class="lb-name">${entry.username}${youTag}</span>
            <span class="lb-profit ${profitCls}">${profitSign}${formatCompactCurrency(entry.profit)}</span>
        </div>`;
    };

    const rows = top5.map(e => rowHtml(e)).join("");
    const divider = (!userInTop5 && userEntry)
        ? `<div class="lb-divider">· · ·</div>${rowHtml(userEntry)}`
        : "";

    el.innerHTML = rows + divider;
}

export function initStatsView() {
    const resetButton = document.getElementById("reset-stats");

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            resetStats();
            renderStats();
            renderHistory();
            renderQuickStats();
            renderRecentGameCard();
            renderHomeActivity();
        });
    }

    renderStats();
    renderHistory();
    renderRecentGameCard();
    renderHomeActivity();
}

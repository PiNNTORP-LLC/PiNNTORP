import { getRecommendedGames } from "./rec.js";
import { isLoggedIn } from "../core/auth.js";

/**
* MODULE: Recommendations (recView.js)
*-------------------------------------------------------
* Purpose: UI Logic for displaying the recommended games
*/


const GAME_HASHES = {
    "slots": { hash: "slots-game", label: "Slots" },
    "dice roll": { hash: "dice-game", label: "Dice Roll" },
    "number guesser": { hash: "dice-game", label: "Dice Roll" },
    "coin flip": { hash: "coin-flip-game", label: "Coin Flip" },
    "blackjack": { hash: "blackjack-game", label: "Blackjack" }
};

const onGamesPage = window.location.pathname.endsWith("games.html");

const GAME_ART = {
    "slots": { theme: "slots", icon: "7 7 7" },
    "dice roll": { theme: "dice", icon: "⚄" },
    "coin flip": { theme: "coin", icon: "◐" },
    "blackjack": { theme: "blackjack", icon: "A♠" }
};

function getGameLink(gameName) {
    const entry = GAME_HASHES[gameName.trim().toLowerCase()];
    if (!entry) return { href: "games.html", label: gameName, hash: null };
    // switches the panel without a full navigation.
    return {
        href: onGamesPage ? `#${entry.hash}` : `games.html#${entry.hash}`,
        label: entry.label,
        hash: entry.hash
    };
}

function buildReasonLine(rec) {
    const hasFriends = rec.friends.length > 0;
    const hasPlays   = rec.playCount > 0;

    if (hasFriends && hasPlays) {
        const label = rec.friends.length === 1 ? "friend" : "friends";
        return {
            meta: `You play this & ${rec.friends.length} ${label} recommend it`,
            detail: rec.friends.join(", ")
        };
    }
    if (hasFriends) {
        const label = rec.friends.length === 1 ? "friend" : "friends";
        return {
            meta: `Recommended by ${rec.friends.length} ${label}`,
            detail: rec.friends.join(", ")
        };
    }
    if (hasPlays) {
        const timesLabel = rec.playCount === 1 ? "time" : "times";
        return {
            meta: `You've played this ${rec.playCount} ${timesLabel}`,
            detail: ""
        };
    }
    return { meta: "Popular game", detail: "" };
}

function createRecommendationCard(rec, index) {
    const item = document.createElement("a");
    const gameLink = getGameLink(rec.game);
    const activeHash = window.location.hash.slice(1);
    const isActive = onGamesPage && gameLink.hash && gameLink.hash === activeHash;
    const reason = buildReasonLine(rec);
    const art = GAME_ART[rec.game.trim().toLowerCase()] ?? { theme: "default", icon: "★" };

    item.className = isActive ? "rec-card rec-card-active" : "rec-card";
    item.href = gameLink.href;
    item.setAttribute("aria-label", `Open ${gameLink.label}, recommendation ${index + 1}`);
    item.dataset.theme = art.theme;
    item.innerHTML = `
        <div class="rec-media">
            <span class="rec-rank">#${index + 1}</span>
            <span class="rec-art-icon">${art.icon}</span>
        </div>
        <div class="rec-body">
            <strong class="rec-title">${gameLink.label}</strong>
            <span class="rec-meta">${reason.meta}</span>
            ${reason.detail ? `<span class="rec-friends">${reason.detail}</span>` : ""}
        </div>
        <span class="rec-cta">Play Now</span>
    `;

    return item;
}

export function renderRec() {
    const list = document.getElementById("rec-list");

    if (!list) return;

    if (!isLoggedIn()) {
        list.className = "rec-list";
        list.innerHTML = '<p class="rec-empty">Log in to see personalized recommendations.</p>';
        return;
    }

    const recommendations = getRecommendedGames();

    if (!recommendations || recommendations.length === 0) {
        list.className = "rec-list";
        list.innerHTML = '<p class="rec-empty">You have no recommendations right now.</p>';
        return;
    }

    list.innerHTML = "";
    list.className = "rec-list rec-track";

    recommendations.forEach((rec, index) => {
        list.appendChild(createRecommendationCard(rec, index));
    });
}

export function initRecView() {
    renderRec();
    // Re-render when the active game tab changes so the active card stays in sync
    if (onGamesPage) {
        window.addEventListener("hashchange", renderRec);
    }
}

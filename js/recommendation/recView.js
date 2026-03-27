import { getRecommendedGames } from "./rec.js";

const GAME_HASHES = {
    "slots": { hash: "slots-game", label: "Slots" },
    "dice roll": { hash: "dice-game", label: "Dice Roll" },
    "number guesser": { hash: "dice-game", label: "Dice Roll" },
    "coin flip": { hash: "coin-flip-game", label: "Coin Flip" }
};

const onGamesPage = window.location.pathname.endsWith("games.html");

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

function createRecommendationCard(rec, index) {
    const item = document.createElement("a");
    const friendsWhoPlay = rec.friends.join(", ");
    const gameLink = getGameLink(rec.game);
    const friendLabel = rec.friends.length === 1 ? "friend" : "friends";
    const activeHash = window.location.hash.slice(1);
    const isActive = onGamesPage && gameLink.hash && gameLink.hash === activeHash;

    item.className = isActive ? "rec-card rec-card-active" : "rec-card";
    item.href = gameLink.href;
    item.setAttribute("aria-label", `Open ${gameLink.label}, recommendation ${index + 1}`);
    item.innerHTML = `
        <span class="rec-rank">#${index + 1}</span>
        <strong class="rec-title">${gameLink.label}</strong>
        <span class="rec-meta">Recommended by ${rec.friends.length} ${friendLabel}</span>
        <span class="rec-friends">${friendsWhoPlay}</span>
    `;

    return item;
}

export function renderRec() {
    const list = document.getElementById("rec-list");

    if (!list) return;

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

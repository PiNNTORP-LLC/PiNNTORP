import { getRecommendedGames } from "./rec.js";

const GAME_LINKS = {
    slots: { href: "games.html#slots-game", label: "Slots" },
    "dice roll": { href: "games.html#dice-game", label: "Dice Roll" },
    "number guesser": { href: "games.html#dice-game", label: "Dice Roll" },
    "coin flip": { href: "games.html#coin-flip-game", label: "Coin Flip" }
};

function getGameLink(gameName) {
    return GAME_LINKS[gameName.trim().toLowerCase()] ?? {
        href: "games.html",
        label: gameName
    };
}

function createRecommendationCard(rec, index) {
    const item = document.createElement("a");
    const friendsWhoPlay = rec.friends.join(", ");
    const gameLink = getGameLink(rec.game);
    const friendLabel = rec.friends.length === 1 ? "friend" : "friends";

    item.className = "rec-card";
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
}

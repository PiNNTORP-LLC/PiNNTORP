import { getRecommendedGames } from "./rec.js";

export function renderRec() {
    const list = document.getElementById("rec-list");

    if (!list) return;

    const recommendations = getRecommendedGames();

    if (!recommendations || recommendations.length === 0) {
        list.innerHTML = "<p>You Have No Recommendations Right Now.</p>";
        return;
    }

    list.innerHTML = "";

    let i = 1;
    recommendations.forEach(rec => {
        const item = document.createElement("p");

        const friendsWhoPlay = rec.friends.join(", ");

        item.textContent = i + ". " + rec.game + " - Friends who play: " + friendsWhoPlay;
        list.appendChild(item);
        i += 1;
    });
}

export function initRecView() {
    renderRec();
}
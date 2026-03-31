import { state } from "../core/state.js";

/**
* MODULE: Recommendations (rec.js)
*-------------------------------------------------------
* Purpose: The algorithm calculates which games to recommend based on friend activity
*/

// Games that share the same panel must share a canonical key so they
// aren't counted as separate recommendations.
const ALIASES = {
    "number guesser": "dice roll"
};

function canonicalKey(name) {
    const key = name.trim().toLowerCase();
    return ALIASES[key] ?? key;
}

export function getRecommendedGames() {
    const user = state.users[state.currentUser];

    // --- Signal 1: play frequency from the user's own history ---
    const playCounts = {};   // lowercase game key -> count
    const gameNames = {};    // lowercase key -> canonical display name
    for (const entry of user.history) {
        const key = canonicalKey(entry.game);
        playCounts[key] = (playCounts[key] || 0) + 1;
        if (!gameNames[key]) gameNames[key] = entry.game;
    }

    // --- Signal 2: how many friends have each game as a favourite ---
    const friendLists = {};  // lowercase key -> [friendName, ...]
    for (const friendName of user.friends) {
        const friend = state.users[friendName];
        if (!friend) continue;
        for (const game of friend.favoriteGames) {
            const key = canonicalKey(game);
            if (!friendLists[key]) friendLists[key] = [];
            friendLists[key].push(friendName);
            if (!gameNames[key]) gameNames[key] = game;
        }
    }

    // Union of all seen games, excluding ones the user has already favourited
    const allKeys = new Set([...Object.keys(playCounts), ...Object.keys(friendLists)]);
    const totalPlays = user.history.length || 1;

    const results = [];
    for (const key of allKeys) {
        const playCount = playCounts[key] || 0;
        const friends   = friendLists[key] || [];

        // Friends are the primary signal; play frequency adds a secondary boost
        // so a frequently-played game surfaces even without friend coverage.
        const score = friends.length + (playCount / totalPlays) * 2;

        results.push({ game: gameNames[key], friends, playCount, score });
    }

    return results.sort((a, b) => b.score - a.score);
}
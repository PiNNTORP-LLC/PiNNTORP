import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";
import { isLoggedIn } from "../core/auth.js";

/**
* MODULE: Statistics (stats.js)
*-------------------------------------------------------
* Purpose: Calculates the user's balance, profit, games played, and the win/loss ratio
*/

export function getStats() {
    const user = state.users[state.currentUser];
    if (!user) {
        return { balance: 100, wins: 0, losses: 0, gamesPlayed: 0, profit: 0, ratio: 0 };
    }
    const { balance, wins, losses, gamesPlayed, profit } = user;
    const ratio = losses === 0 ? wins : (wins / (losses || 1)).toFixed(2);
    return { balance, wins, losses, gamesPlayed, profit, ratio };
}

export function getHistory() {
    const user = state.users?.[state.currentUser];
    if (!user || !user.history) {
        return [];
    }
    return Array.isArray(user.history) ? user.history : [];
}

// Call this before saveState in each game - adds one entry to the front,
// keeps the log capped at 50 entries.
export function logResult(game, delta) {
    const user = state.users?.[state.currentUser];
    if (!user) {
        return;
    }
    if (!user.history) {
        user.history = [];
    }
    user.history.unshift({ game, delta, ts: Date.now() });
    if (user.history.length > 50) {
        user.history.length = 50;
    }

    if (!user.favoriteGames) {
        user.favoriteGames = [];
    }
    if (!user.favoriteGames.includes(game)) {
        user.favoriteGames.push(game);
    }
}

// Fake top-scoring accounts always shown at the top of the leaderboard
const FAKE_LEADERS = [
    { username: "OneMore_Time", profit: 4250 },
    { username: "BigMoney", profit: 3180 },
    { username: "TheBigOne", profit: 2750 },
    { username: "MrMegaGamble", profit: 1920 },
    { username: "SuperBlackjackPro", profit: 500 },
];

export function getLeaderboard() {
    // Only mark a "current user" entry when someone is actually logged in
    const currentUser = isLoggedIn() ? state.currentUser : null;

    // Build entries for every real account in state
    const realEntries = Object.entries(state.users).map(([username, user]) => ({
        username,
        profit: user.profit ?? 0,
        isCurrentUser: currentUser !== null && username === currentUser,
        isFake: false
    }));

    // Merge fake leaders
    const fakeEntries = FAKE_LEADERS.map(e => ({ ...e, isCurrentUser: false, isFake: true }));

    const all = [...fakeEntries, ...realEntries].sort((a, b) => b.profit - a.profit);

    // Assign ranks (1-based)
    all.forEach((e, i) => { e.rank = i + 1; });

    const top5 = all.slice(0, 5);

    // Only compute userEntry when logged in
    const userEntry = currentUser
        ? (all.find(e => e.isCurrentUser) ?? {
            username: currentUser,
            profit: 0,
            rank: all.length + 1,
            isCurrentUser: true,
            isFake: false
        })
        : null;

    // Don't duplicate the user in the "you" slot if they're already in top 5
    const userInTop5 = top5.some(e => e.isCurrentUser);

    return { top5, userEntry, userInTop5 };
}

export function resetStats() {
    const user = state.users?.[state.currentUser];
    if (!user) {
        return;
    }
    user.balance = 100;
    user.gamesPlayed = 0;
    user.wins = 0;
    user.losses = 0;
    user.profit = 0;
    user.history = [];
    saveState(state);
}

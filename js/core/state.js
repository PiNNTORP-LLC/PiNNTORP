/**
* MODULE: Core System (state.js)
*-------------------------------------------------------
* Purpose: Manages the memory state of the application
* Creates a template for every user
* Creates dummy accounts
*/

function createUserTemplate() {
    return {
        balance: 100,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        profit: 0,
        friends: [],
        favoriteGames: [],
        history: []
    };
}

function getDummyUsers() {
    return {
        "dummy_alice": {
            ...createUserTemplate(),
            favoriteGames: ["Slots"]
        },
        "dummy_bob": {
            ...createUserTemplate(),
            favoriteGames: ["Slots", "Coin Flip"]
        },
        "dummy_charlie": {
            ...createUserTemplate(),
            favoriteGames: ["Number Guesser", "Coin Flip"]
        }
    };
}

export const state = {
    currentUser: "main_user",
    users: {} // all users
};

function normalizeUser(user = {}) {
    const history = Array.isArray(user.history) ? user.history : [];
    let favoriteGames = Array.isArray(user.favoriteGames) ? user.favoriteGames : [];
    if (favoriteGames.length === 0 && history.length > 0) {
        const seen = new Set();
        for (const entry of history) {
            if (entry.game && !seen.has(entry.game)) {
                seen.add(entry.game);
                favoriteGames.push(entry.game);
            }
        }
    }
    const nextUser = {
        ...createUserTemplate(),
        ...user,
        balance: Number.isFinite(user.balance) ? user.balance : 100,
        profit: Number.isFinite(user.profit) ? user.profit : 0,
        friends: Array.isArray(user.friends) ? [...user.friends] : [],
        favoriteGames: [...favoriteGames],
        history: [...history]
    };
    return nextUser;
}

export function ensureUserState(username) {
    if (!username) return null;

    if (!state.users[username]) {
        state.users[username] = createUserTemplate();
    } else {
        state.users[username] = normalizeUser(state.users[username]);
    }

    const dummyUsers = getDummyUsers();
    for (const [dummyUsername, dummyUser] of Object.entries(dummyUsers)) {
        state.users[dummyUsername] = dummyUser;
    }

    return state.users[username];
}

export function replaceState(nextState) {
    if (nextState && nextState.users) {
        state.currentUser = nextState.currentUser || "main_user";
        state.users = {};
        for (const username of Object.keys(nextState.users)) {
            state.users[username] = normalizeUser(nextState.users[username]);
        }
        ensureUserState(state.currentUser);
    } else {
        state.users = {
            "main_user": createUserTemplate(),
            ...getDummyUsers()
        };
        state.currentUser = "main_user";
        state.users["main_user"].friends = ["dummy_alice", "dummy_bob", "dummy_charlie"];
    }
}

export async function fetchRemoteState() {
    const { hasBackendSession, getAuthHeaders, requestJson } = await import("./network.js");

    if (!hasBackendSession()) {
        return false;
    }

    try {
        const token = localStorage.getItem("jwt");
        const bits = token.split(".");
        const payload = JSON.parse(atob(bits[1]));
        const username = payload.sub || state.currentUser;

        const data = await requestJson("/api/state", {
            method: "GET",
            headers: getAuthHeaders()
        });

        state.currentUser = username;
        const current = state.users[username] || {};
        current.balance = data.balance ?? 100 + (data.profit ?? 0);
        current.gamesPlayed = data.gamesPlayed ?? 0;
        current.wins = data.wins ?? 0;
        current.losses = data.losses ?? 0;
        current.profit = data.profit ?? 0;
        state.users[username] = normalizeUser(current);
        return true;
    } catch (error) {
        console.warn("Backend state sync unavailable:", error);
        return false;
    }
}

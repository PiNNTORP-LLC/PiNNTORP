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

// export const state = {
//     friends: [],
//     stats: { wins: 0, losses: 0, gamesPlayed: 0 }
// };

export const state = {
    currentUser: "main_user",
    users: {} // all users
};

function normalizeUser(user = {}) {
    const nextUser = {
        ...createUserTemplate(),
        ...user,
        balance: Number.isFinite(user.balance) ? user.balance : 100,
        profit: Number.isFinite(user.profit) ? user.profit : 0,
        friends: Array.isArray(user.friends) ? user.friends : [],
        favoriteGames: Array.isArray(user.favoriteGames) ? user.favoriteGames : [],
        history: Array.isArray(user.history) ? user.history : []
    };
    return nextUser;
}

export function replaceState(nextState) {
    // if (!nextState) return;

    // load saved data if it exists
    if (nextState && nextState.users) {
        state.currentUser = nextState.currentUser || "main_user";
        state.users = {};
        for (const username of Object.keys(nextState.users)) {
            state.users[username] = normalizeUser(nextState.users[username]);
        }
        return;
    }

    // if we don't have saved data create user and dummy accounts
    state.users = {
        "main_user": createUserTemplate(),
        "dummy_alice": createUserTemplate(),
        "dummy_bob": createUserTemplate(),
        "dummy_charlie": createUserTemplate()
    };

    if (state.users["dummy_alice"]) state.users["dummy_alice"].favoriteGames = ["Slots"];
    if (state.users["dummy_bob"]) state.users["dummy_bob"].favoriteGames = ["Slots", "Coin Flip"];
    if (state.users["dummy_charlie"]) state.users["dummy_charlie"].favoriteGames = ["Number Guesser", "Coin Flip"];

    // state.friends = Array.isArray(nextState.friends) ? nextState.friends : [];
    // state.stats = {
    //     wins: Number(nextState.stats?.wins) || 0,
    //     losses: Number(nextState.stats?.losses) || 0,
    //     gamesPlayed: Number(nextState.stats?.gamesPlayed) || 0
    // };
}

export async function fetchRemoteState() {
    // Load the network helpers lazily so local only pages still work
    const { hasBackendSession, getAuthHeaders, requestJson } = await import("./network.js");

    if (!hasBackendSession()) {
        return false;
    }

    try {
        // Read the current username from the stored JWT
        const token = localStorage.getItem("jwt");
        const bits = token.split(".");
        const payload = JSON.parse(atob(bits[1]));
        const username = payload.sub || state.currentUser;

        // Fetch the latest server side stats for the active user
        const data = await requestJson("/api/state", {
            method: "GET",
            headers: getAuthHeaders()
        });

        // Merge the remote stats into the local state shape
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

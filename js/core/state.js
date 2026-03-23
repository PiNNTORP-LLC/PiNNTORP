function createUserTemplate() {
    return {
        balance: 100,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        profit: 0,
        friends: [],
        favoriteGames: []
    };
}

// export const state = {
//     friends: [],
//     stats: { wins: 0, losses: 0, gamesPlayed: 0 }
// };

export const state = {
    currentUser: "main_user",
    users: {} // all users
}

function normalizeUser(user = {}) {
    return {
        ...createUserTemplate(),
        ...user,
        balance: Number.isFinite(user.balance) ? user.balance : 100,
        profit: Number.isFinite(user.profit) ? user.profit : 0,
        friends: Array.isArray(user.friends) ? user.friends : [],
        favoriteGames: Array.isArray(user.favoriteGames) ? user.favoriteGames : []
    };
}

export function replaceState(nextState) {
    // if (!nextState) return;

    // load saved data if it exists
    if (nextState && nextState.users) {
        state.currentUser = nextState.currentUser || "main_user";
        state.users = Object.fromEntries(
            Object.entries(nextState.users).map(([username, user]) => [username, normalizeUser(user)])
        );
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

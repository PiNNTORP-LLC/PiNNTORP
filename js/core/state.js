function createUserTemplate() {
    return {
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

export function replaceState(nextState) {
    // if (!nextState) return;

    // load saved data if it exists
    if (nextState && nextState.users) {
        state.currentUser = nextState.currentUser || "main_user";
        state.users = nextState.users;
        return;
    }

    // if we don't have saved data create user and dummy accounts
    state.users = {
        "main_user": createUserTemplate(),
        "dummy_alice": createUserTemplate(),
        "dummy_bob": createUserTemplate(),
        "dummy_charlie": createUserTemplate()
    };

    // state.friends = Array.isArray(nextState.friends) ? nextState.friends : [];
    // state.stats = {
    //     wins: Number(nextState.stats?.wins) || 0,
    //     losses: Number(nextState.stats?.losses) || 0,
    //     gamesPlayed: Number(nextState.stats?.gamesPlayed) || 0
    // };
}
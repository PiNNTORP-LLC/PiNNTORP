export const state = {
    currentUser: "main_user",
    users: {} // all users
};

// Initial state until loaded from server
export function replaceState(nextState) {
    if (nextState && nextState.users) {
        state.currentUser = nextState.currentUser || "main_user";
        state.users = nextState.users;
    }
}

export async function fetchState() {
    const token = localStorage.getItem("jwt");
    if (!token) return false;

    try {
        const payloadStr = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadStr);
        state.currentUser = payload.sub;

        const res = await fetch("http://localhost:8080/api/state", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await res.json();
        if (res.ok && data.status === "success") {
            if (!state.users[state.currentUser]) {
                state.users[state.currentUser] = {
                    gamesPlayed: 0, wins: 0, losses: 0, profit: 0, friends: [], favoriteGames: []
                };
            }
            const user = state.users[state.currentUser];
            user.gamesPlayed = data.gamesPlayed || 0;
            user.wins = data.wins || 0;
            user.losses = data.losses || 0;
            user.profit = data.profit || 0;
            return true;
        }
    } catch (err) {
        console.error("Failed to fetch state from backend:", err);
    }
    return false;
}
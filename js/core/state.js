export const state = {
    friends: [],
    stats: { wins: 0, losses: 0, gamesPlayed: 0 }
};

export function replaceState(nextState) {
    if (!nextState) return;

    state.friends = Array.isArray(nextState.friends) ? nextState.friends : [];
    state.stats = {
        wins: Number(nextState.stats?.wins) || 0,
        losses: Number(nextState.stats?.losses) || 0,
        gamesPlayed: Number(nextState.stats?.gamesPlayed) || 0
    };
}
import { state } from "../core/state.js";

export function getRecommendedGames() {
    const user = state.users[state.currentUser];
    const friendsUsernames = user.friends;
    const gameTallies = {};

    friendsUsernames.forEach(friendName => {
        const friendData = state.users[friendName];

        // count all favorite games from friends
        if (friendData) {
            friendData.favoriteGames.forEach(game => {
                // skip if user already has game in their favorites
                if (!user.favoriteGames.includes(game)) {
                    if (!gameTallies[game]) {
                        gameTallies[game] = [];
                    }
                    gameTallies[game].push(friendName);
                }
            });
        }
    });

    // sort by popularity
    return Object.keys(gameTallies).sort((a,b) => gameTallies[b].length - gameTallies[a].length)
    .map(gameName => {
        return {
            game: gameName,
            friends: gameTallies[gameName]
        }
    });
}
import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

/*
* MODULE: Friends List Logic (friends.js)
*-------------------------------------------------------
* Purpose: Handles the friends list logic for when the user adds and removes a friend
*/

export function getFriends() {
    return state.users[state.currentUser].friends;
}

/**
 * Adds friend to the users friends list
 * @param {string} name - Name of friend to add 
 * @returns 
 */
export function addFriend(name) {
    const value = name.trim();
    if (!value) return false;

    // edge case were dummy account does not exist
    if (!state.users[value]) {
        alert("User does not exist");
        return false;
    }

    const currentFriends = getFriends();

    if (currentFriends.some((f) => f.toLowerCase() === value.toLowerCase())) return false;

    state.users[state.currentUser].friends = [...currentFriends, value];
    saveState(state);
    return true;
}

/**
 * removes a friend from the users friends list
 * @param {string} name 
 * @returns 
 */
export function removeFriend(name) {
    const user = state.users[state.currentUser];
    const next = user.friends.filter((f) => f !== name);
    if (next.length === user.friends.length) return;

    user.friends = next;
    saveState(state);
}
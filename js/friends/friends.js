import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

export function getFriends() {
    return state.friends;
}

export function addFriend(name) {
    const value = name.trim();
    if (!value) return false;
    if (state.friends.some((f) => f.toLowerCase() === value.toLowerCase())) return false;

    state.friends.push(value);
    saveState(state);
    return true;
}

export function removeFriend(name) {
    const next = state.friends.filter((f) => f !== name);
    if (next.length === state.friends.length) return;

    state.friends = next;
    saveState(state);
}
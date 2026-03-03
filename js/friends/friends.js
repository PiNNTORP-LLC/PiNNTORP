import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

export function getFriends() {
    return state.friends;
}

export function addFriend(name) {
    // this function will add a friend to the state by name and save the updated state to localStorage
}

export function removeFriend(name) {
    // this function will remove a friend from the state by name and save the updated state to localStorage
}
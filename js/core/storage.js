/**
* MODULE: Core System (storage.js)
*-------------------------------------------------------
* Purpose: Handles saving and loading the state to the browsers localStorage
*/

const KEY = "pinntorp_state_v1";

export function loadState() {
    try {
        return JSON.parse(localStorage.getItem(KEY));
    } catch (e) {
        return null;
    }
}

export function saveState(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
}
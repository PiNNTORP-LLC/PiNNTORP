import { initGameStage, initGameView, initSlotView, initCoinFlipView, initBlackjackView } from "./game/gameView.js";
import { initAuthUI, isLoggedIn, getSession } from "./core/auth.js";
import { initAccountView } from "./account/account.js";
import { initFriendsView } from "./friends/friendsView.js";
import { initStatsView } from "./stats/statsView.js";
import { initRecView } from "./recommendation/recView.js";
import { ensureUserState, fetchRemoteState, replaceState, state } from "./core/state.js";
import { loadState, saveState } from "./core/storage.js";

/**
* MODULE: Entry (app.js)
*-------------------------------------------------------
* Purpose: Initializes the application
* Checks login status
* Initilizes all the UIs
*/

// Initialize auth UI on every page (header chip + form handlers)
initAuthUI();

// Protect game and profile pages — redirect to home if not logged in
const _page = window.location.pathname.split("/").pop() || "index.html";
if ((_page === "games.html" || _page === "profile.html") && !isLoggedIn()) {
    window.location.replace("index.html");
}

// Restore the last local snapshot first
const saved = loadState();
replaceState(saved);

if (isLoggedIn()) {
    const { username } = getSession();
    if (username) {
        state.currentUser = username;
        ensureUserState(username);
        saveState(state);
    }
}

// Refresh state from the backend when a session is available
if (isLoggedIn()) {
    await fetchRemoteState();
}

// Initialize the current page features
initGameStage();
initSlotView();
initGameView();
initCoinFlipView();
initBlackjackView();
initFriendsView();
initStatsView();
initRecView();
initAccountView();

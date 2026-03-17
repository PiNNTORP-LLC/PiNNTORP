import { initAuth } from "./core/auth.js";
import { loadState } from "./core/storage.js";
import { fetchState, replaceState } from "./core/state.js";
import { initGameView } from "./game/gameView.js";
import { initFriendsView } from "./friends/friendsView.js";
import { initStatsView, renderStats } from "./stats/statsView.js";
import { initSlotView } from "./game/gameView.js";
import { initNetwork } from "./core/network.js";
import { initTabs } from "./core/tabs.js";

// Always initialize authentication screens
initAuth();

// Only initialize the application runtime if logged in
if (localStorage.getItem("jwt")) {
    const ws = initNetwork();

    replaceState(loadState());

    // Async IIFE to fetch state before initializing stats/game
    (async () => {
        const success = await fetchState();
        if (!success) {
            console.warn("Session invalid or user not found. Logging out.");
            localStorage.removeItem("jwt");
            window.location.reload();
            return;
        }

        initTabs();
        initSlotView();
        initGameView();
        initFriendsView();
        initStatsView();
    })();
}
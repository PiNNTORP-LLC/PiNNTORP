import { initGameStage, initGameView, initSlotView, initCoinFlipView } from "./game/gameView.js";
import { initFriendsView } from "./friends/friendsView.js";
import { initStatsView } from "./stats/statsView.js";
import { initRecView } from "./recommendation/recView.js";
import { fetchRemoteState, replaceState } from "./core/state.js";
import { loadState } from "./core/storage.js";

// Restore the last local snapshot first
const saved = loadState();
replaceState(saved);

// Refresh state from the backend when a session is available
await fetchRemoteState();

// Initialize the current page features
initGameStage();
initSlotView();
initGameView();
initCoinFlipView();
initFriendsView();
initStatsView();
initRecView();

import { initGameView, initSlotView, initCoinFlipView } from "./game/gameView.js";
import { initFriendsView } from "./friends/friendsView.js";
import { initStatsView } from "./stats/statsView.js";
import { initRecView } from "./recommendation/recView.js";
import { replaceState } from "./core/state.js";
import { loadState } from "./core/storage.js";

replaceState(loadState());
initSlotView();
initGameView();
initCoinFlipView();
initFriendsView();
initStatsView();
initRecView();
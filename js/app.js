import { loadState } from "./core/storage.js";
import { replaceState } from "./core/state.js";
import { initGameView } from "./game/gameView.js";
import { initFriendsView } from "./friends/friendsView.js";
import { initStatsView } from "./stats/statsView.js";
import { initSlotView } from "./game/gameView.js";
import { initRecView } from "./recommendation/recView.js";

replaceState(loadState());
initSlotView();
initGameView();
initFriendsView();
initStatsView();
initRecView();
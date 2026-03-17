import { loadState } from "./core/storage.js";
import { replaceState } from "./core/state.js";
import { initGameView } from "./game/gameView.js";
import { initFriendsView } from "./friends/friendsView.js";
import { initStatsView } from "./stats/statsView.js";
import { initSlotView } from "./game/gameView.js";
import { initNetwork } from "./core/network.js";

const ws = initNetwork();

replaceState(loadState());
initSlotView();
initGameView();
initFriendsView();
initStatsView();
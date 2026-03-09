import { guessGameApi } from "./games/guessGame.js";
import { slotGameApi } from "./games/slotGame.js";

const gameApis = {
    guess: guessGameApi,
    slots: slotGameApi
};

export function getGameApi(gameName) {
    return gameApis[gameName];
}

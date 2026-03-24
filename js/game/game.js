import { coinFlipApi } from "./games/coinFlip.js";
import { diceRollApi } from "./games/diceRoll.js";
import { slotGameApi } from "./games/slotGame.js";

const gameApis = {
    dice: diceRollApi,
    slots: slotGameApi,
    coinFlip: coinFlipApi
};

export function getGameApi(gameName) {
    return gameApis[gameName];
}

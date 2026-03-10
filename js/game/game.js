import { diceRollApi } from "./games/diceRoll.js";
import { slotGameApi } from "./games/slotGame.js";

const gameApis = {
    dice: diceRollApi,
    slots: slotGameApi
};

export function getGameApi(gameName) {
    return gameApis[gameName];
}

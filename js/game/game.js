import { coinFlipApi } from "./games/coinFlip.js";
import { diceRollApi } from "./games/diceRoll.js";
import { slotGameApi } from "./games/slotGame.js";
import { blackjackApi } from "./games/blackjack.js";

const gameApis = {
    dice: diceRollApi,
    slots: slotGameApi,
    coinFlip: coinFlipApi,
    blackjack: blackjackApi
};

export function getGameApi(gameName) {
    return gameApis[gameName];
}

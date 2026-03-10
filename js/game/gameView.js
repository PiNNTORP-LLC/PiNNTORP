import { getGameApi } from "./game.js";
import { renderStats } from "../stats/statsView.js";

const diceGameApi = getGameApi("dice");
const slotGameApi = getGameApi("slots");

export function initGameView() {
    const controls = document.getElementById("game-controls");
    const result = document.getElementById("game-result");

    [1, 2, 3, 4, 5, 6].forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(value);
        button.addEventListener("click", () => {
            const round = diceGameApi.play(value);
            result.textContent = round.won
            ? `Win: guessed ${round.guess}, rolled ${round.roll}`
            : `Loss: guessed ${round.guess}, rolled ${round.roll}`;
            renderStats();
        });
        controls.appendChild(button);
    });
}

export function initSlotView() {
    const button = document.getElementById("slot-roll");
    const firstNum = document.getElementById("first-num");
    const secNum = document.getElementById("second-num");
    const thirdNum = document.getElementById("third-num");

    button.addEventListener("click", () => {
        const slotNums = slotGameApi.play();
        firstNum.textContent = String(slotNums[0]);
        secNum.textContent = String(slotNums[1]);
        thirdNum.textContent = String(slotNums[2]);

        renderStats();
    })
}

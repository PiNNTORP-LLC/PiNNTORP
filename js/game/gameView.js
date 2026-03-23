import { getGameApi } from "./game.js";
import { renderStats } from "../stats/statsView.js";

const diceGameApi = getGameApi("dice");
const slotGameApi = getGameApi("slots");
const coinFlipApi = getGameApi("coinFlip");

export function initGameView() {
    const controls = document.getElementById("game-controls");
    const result = document.getElementById("game-result");

    if (!controls || !result) return;

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

    if (!button) return;

    button.addEventListener("click", () => {
        const slotNums = slotGameApi.play();
        firstNum.textContent = String(slotNums[0]);
        secNum.textContent = String(slotNums[1]);
        thirdNum.textContent = String(slotNums[2]);

        renderStats();
    })
}

export function initCoinFlipView() {
   const headsButton = document.getElementById("heads");
   const tailsButton = document.getElementById("tails");
   const resultText = document.getElementById("coinResult");
   const choiceText = document.getElementById("choice");

   if (!headsButton) return;

   headsButton.addEventListener("click", () => {
        const result = coinFlipApi.play("Heads");
        resultText.textContent = `Flipped: ${result}`;
        choiceText.textContent = "Choose: Heads";
        renderStats();
   });

   tailsButton.addEventListener("click", () => {
        const result = coinFlipApi.play("Tails");
        resultText.textContent = `Flipped: ${result}`;
        choiceText.textContent = "Choose: Tails";
        renderStats();
   });
}
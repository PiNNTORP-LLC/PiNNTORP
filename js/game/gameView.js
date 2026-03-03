import { playRound } from "./game.js";
import { renderStats } from "../stats/statsView.js";

export function initGameView() {
    const controls = document.getElementById("game-controls");
    const result = document.getElementById("game-result");

    [1, 2, 3].forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = String(value);
    button.addEventListener("click", () => {
        const round = playRound(value);
        result.textContent = round.won
        ? `Win: guessed ${round.guess}, rolled ${round.roll}`
        : `Loss: guessed ${round.guess}, rolled ${round.roll}`;
        renderStats();
    });
    controls.appendChild(button);
    });
}
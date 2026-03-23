import { state } from "../../core/state.js";
import { saveState } from "../../core/storage.js";

// helper functions for checking values of slot numbers
function twoOutOfThreeMatch(num1, num2, num3) {
    if (num1 == num2 || num1 == num3 || num2 == num3) {
        return true;
    } else {
        return false;
    }
}

function threeOutOfThreeMatch(num1, num2, num3) {
    if (num1 == num2 && num1 == num3 && num3 == num2) {
        return true;
    } else {
        return false;
    }
}

// for now using the assumption that the user makes a $5 bet
function playSlotRound() {
    const user = state.users[state.currentUser];

    // randomise the 3 slot numbers
    const firstNum = Math.floor(Math.random() * 7) + 1;
    const secNum = Math.floor(Math.random() * 7) + 1;
    const thirdNum = Math.floor(Math.random() * 7) + 1;

    // if all three match then multiply the number on the machine by the original bet
    // (for now assuming the user put a $5 bet)
    if (threeOutOfThreeMatch(firstNum, secNum, thirdNum)) {
        user.gamesPlayed += 1;
        user.wins += 1;
        user.balance += firstNum * 5;
        user.profit += firstNum * 5;
    } else if (twoOutOfThreeMatch(firstNum, secNum, thirdNum)) {
        user.gamesPlayed += 1;
        user.wins += 1;
        user.balance += 10;
        user.profit += 10; // double if only 2 match
    } else {
        user.gamesPlayed += 1;
        user.losses += 1;
        user.balance -= 5;
        user.profit -= 5;
    }

    saveState(state);
    return [firstNum, secNum, thirdNum];
}

export const slotGameApi = {
    play: playSlotRound
};

import { state } from "../../core/state.js";
import { saveState } from "../../core/storage.js";
import { logResult } from "../../stats/stats.js";

const SUITS = ["♠", "♣", "♥", "♦"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

let deck = [];
let playerHand = [];
let dealerHand = [];
let currentBet = 5;

function buildDeck() {
    deck = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            deck.push({ suit, value });
        }
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function cardValue(card) {
    if (card.value === "A") return 11;
    if (["J", "Q", "K"].includes(card.value)) return 10;
    return parseInt(card.value, 10);
}

function handTotal(hand) {
    let total = 0;
    let aces = 0;
    for (const card of hand) {
        total += cardValue(card);
        if (card.value === "A") aces++;
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

function deal(bet) {
    currentBet = bet;
    buildDeck();
    playerHand = [deck.pop(), deck.pop()];
    dealerHand = [deck.pop(), deck.pop()];
    const playerTotal = handTotal(playerHand);
    return {
        playerHand: [...playerHand],
        dealerHand: [...dealerHand],
        playerTotal,
        isBlackjack: playerTotal === 21
    };
}

function hit() {
    playerHand.push(deck.pop());
    const total = handTotal(playerHand);
    const bust = total > 21;
    if (bust) {
        const user = state.users[state.currentUser];
        user.gamesPlayed += 1;
        user.losses += 1;
        user.balance -= currentBet;
        user.profit -= currentBet;
        logResult("Blackjack", -currentBet);
        saveState(state);
    }
    return {
        playerHand: [...playerHand],
        dealerHand: [...dealerHand],
        playerTotal: total,
        dealerTotal: handTotal(dealerHand),
        bust
    };
}

function stand() {
    while (handTotal(dealerHand) < 17) {
        dealerHand.push(deck.pop());
    }
    const playerTotal = handTotal(playerHand);
    const dealerTotal = handTotal(dealerHand);

    let outcome;
    let delta;
    if (playerTotal > dealerTotal || dealerTotal > 21) {
        outcome = "win";
        delta = currentBet;
    } else if (playerTotal === dealerTotal) {
        outcome = "push";
        delta = 0;
    } else {
        outcome = "loss";
        delta = -currentBet;
    }

    const user = state.users[state.currentUser];
    user.gamesPlayed += 1;
    if (outcome === "win") user.wins += 1;
    else if (outcome === "loss") user.losses += 1;
    user.balance += delta;
    user.profit += delta;
    logResult("Blackjack", delta);
    saveState(state);

    return {
        playerHand: [...playerHand],
        dealerHand: [...dealerHand],
        playerTotal,
        dealerTotal,
        outcome,
        delta
    };
}

function resolveBlackjack() {
    // Natural blackjack pays 3:2, rounded up to nearest dollar
    const payout = Math.ceil(currentBet * 1.5);
    const user = state.users[state.currentUser];
    user.gamesPlayed += 1;
    user.wins += 1;
    user.balance += payout;
    user.profit += payout;
    logResult("Blackjack", payout);
    saveState(state);
    return {
        dealerHand: [...dealerHand],
        dealerTotal: handTotal(dealerHand),
        payout
    };
}

export const blackjackApi = { deal, hit, stand, resolveBlackjack };

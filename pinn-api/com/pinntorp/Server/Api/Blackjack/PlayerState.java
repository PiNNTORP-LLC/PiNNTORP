package com.pinntorp.Server.Api.Blackjack;

public enum PlayerState {
    WAITING, // Sitting at the table, waiting for a hand
    BETTING, // Game triggered, waiting for user to place bet (15s timer)
    PLAYING, // In progress, waiting for Hit/Stand actions
    BUSTED,  // Over 21, turn ended abruptly
    STANDING // Turn finished naturally, waiting for Dealer
}

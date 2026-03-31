package com.pinntorp.Server.Api.Blackjack;

import com.pinntorp.WebSockets.WebSocket;

public class Player {
    public final String username;
    public final WebSocket ws;
    public Hand hand;
    public double bet;
    public PlayerState state;

    public Player(String username, WebSocket ws) {
        this.username = username;
        this.ws = ws;
        this.hand = new Hand();
        this.bet = 0;
        this.state = PlayerState.WAITING;
    }
}

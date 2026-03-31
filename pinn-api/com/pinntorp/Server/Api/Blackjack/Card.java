package com.pinntorp.Server.Api.Blackjack;

public class Card {
    public final String suit;
    public final String value;

    public Card(String suit, String value) {
        this.suit = suit;
        this.value = value;
    }

    public int getNumericValue() {
        if (value.equals("A")) return 11;
        if (value.equals("J") || value.equals("Q") || value.equals("K")) return 10;
        return Integer.parseInt(value);
    }
}

package com.pinntorp.Server.Api.Blackjack;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Deck {
    private final List<Card> cards = new ArrayList<>();
    private static final String[] SUITS = {"♠", "♣", "♥", "♦"};
    private static final String[] VALUES = {"A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"};

    public Deck() {
        buildAndShuffle();
    }

    public void buildAndShuffle() {
        cards.clear();
        for (String suit : SUITS) {
            for (String value : VALUES) {
                cards.add(new Card(suit, value));
            }
        }
        Collections.shuffle(cards);
    }

    public Card draw() {
        if (cards.isEmpty()) {
            buildAndShuffle(); // Reshuffle if deck is empty
        }
        return cards.remove(cards.size() - 1);
    }
}

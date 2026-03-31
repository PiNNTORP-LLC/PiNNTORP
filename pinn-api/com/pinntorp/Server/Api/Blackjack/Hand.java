package com.pinntorp.Server.Api.Blackjack;

import java.util.ArrayList;
import java.util.List;

public class Hand {
    public final List<Card> cards = new ArrayList<>();
    
    public void addCard(Card card) {
        cards.add(card);
    }

    public int getTotal() {
        int total = 0;
        int aces = 0;
        for (Card card : cards) {
            total += card.getNumericValue();
            if (card.value.equals("A")) {
                aces++;
            }
        }
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        return total;
    }
}

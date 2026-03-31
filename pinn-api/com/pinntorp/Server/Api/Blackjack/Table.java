package com.pinntorp.Server.Api.Blackjack;

import java.util.ArrayList;
import java.util.List;

import com.google.gson.JsonObject;

public class Table implements Runnable {
    public final String tableId;
    public final List<Player> players = new ArrayList<>();
    public final Hand dealerHand = new Hand();
    public final Deck deck = new Deck();

    public static final int MAX_PLAYERS = 4;
    private boolean active = true;

    public Table(String tableId) {
        this.tableId = tableId;
    }

    public synchronized boolean joinTable(Player player) {
        if (players.size() >= MAX_PLAYERS) return false;
        players.add(player);
        return true;
    }

    public synchronized void leaveTable(String username) {
        players.removeIf(p -> p.username.equals(username));
    }

    private void broadcast(String message) {
        for (Player p : players) {
            if (p.ws.isOpen()) {
                p.ws.send(message);
            }
        }
    }

    @Override
    public void run() {
        while (active) {
            try {
                // Stage 1: The 15-second Betting Timer Phase
                JsonObject msg = new JsonObject();
                msg.addProperty("type", "TIMER_UPDATE");
                msg.addProperty("message", "Place your bets! 15 seconds remaining.");
                broadcast(msg.toString());
                
                Thread.sleep(15000); // 15 Second Betting Window

                if (players.isEmpty()) continue; // Pause if table empty

                // Stage 2: Initial Deal
                msg.addProperty("type", "STATE_UPDATE");
                msg.addProperty("message", "Bets locked! Dealing cards...");
                broadcast(msg.toString());
                
                deck.buildAndShuffle();
                dealerHand.cards.clear();
                for (Player p : players) p.hand.cards.clear();

                for (int i=0; i<2; i++) {
                    for (Player p : players) p.hand.addCard(deck.draw());
                    dealerHand.addCard(deck.draw());
                }

                // Stage 3: Player Action Phase (Turn-based)
                for (Player p : players) {
                    if (p.hand.getTotal() == 21) {
                         p.state = PlayerState.STANDING;
                         continue; // Natural Blackjack!
                    }

                    p.state = PlayerState.PLAYING;
                    JsonObject turnMsg = new JsonObject();
                    turnMsg.addProperty("type", "TURN_UPDATE");
                    turnMsg.addProperty("currentPlayer", p.username);
                    broadcast(turnMsg.toString());

                    // Await player submitting HIT or STAND over WebSocket (updated in Lobby.java)
                    while (p.state == PlayerState.PLAYING && active) {
                        Thread.sleep(100);
                        if (!p.ws.isOpen()) p.state = PlayerState.BUSTED; // Auto-forfeit on disconnect
                    }
                }

                // Stage 4: Dealer Actions
                msg.addProperty("type", "STATE_UPDATE");
                msg.addProperty("message", "Dealer is acting...");
                broadcast(msg.toString());
                
                while (dealerHand.getTotal() < 17) {
                    Thread.sleep(1000); // 1 second dealer delay
                    dealerHand.addCard(deck.draw());
                }

                // Stage 5: Payout Resolution
                msg.addProperty("type", "ROUND_COMPLETE");
                msg.addProperty("message", "Resolving winners...");
                broadcast(msg.toString());
                // (Payout balance adjustments go here)

                Thread.sleep(5000); // Wait 5 seconds before next round
                
            } catch (InterruptedException e) {
                active = false;
            }
        }
    }
}

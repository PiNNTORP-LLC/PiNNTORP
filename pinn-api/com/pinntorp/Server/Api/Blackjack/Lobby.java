package com.pinntorp.Server.Api.Blackjack;

import com.pinntorp.WebSockets.WebSocket;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;

public class Lobby {
    public static final Map<String, Table> tables = new ConcurrentHashMap<>();
    public static final Map<WebSocket, Player> players = new ConcurrentHashMap<>();

    public static synchronized void handleMessage(WebSocket ws, String message) {
        try {
            JsonObject json = JsonParser.parseString(message).getAsJsonObject();
            if (!json.has("action")) return;
            String action = json.get("action").getAsString();

            if (action.equals("JOIN")) {
                String username = json.has("username") ? json.get("username").getAsString() : "Anonymous";
                Player newPlayer = new Player(username, ws);
                players.put(ws, newPlayer);

                // Find open table
                Table assignedTable = null;
                for (Table table : tables.values()) {
                    if (table.joinTable(newPlayer)) {
                        assignedTable = table;
                        break;
                    }
                }
                
                // If no table exists with space, spawn a new one!
                if (assignedTable == null) {
                    String newTableId = "TBL-" + (tables.size() + 1);
                    assignedTable = new Table(newTableId);
                    assignedTable.joinTable(newPlayer);
                    tables.put(newTableId, assignedTable);
                    new Thread(assignedTable).start(); // Start the game loop
                }

                // Acknowledge join
                JsonObject res = new JsonObject();
                res.addProperty("type", "JOINED_TABLE");
                res.addProperty("tableId", assignedTable.tableId);
                res.addProperty("message", "Welcome to " + assignedTable.tableId + ", waiting for round to start.");
                ws.send(res.toString());
            } 
            else if (action.equals("BET")) {
                Player p = players.get(ws);
                if (p != null) p.bet = json.get("amount").getAsDouble();
            }
            else if (action.equals("HIT")) {
                Player p = players.get(ws);
                if (p != null && p.state == PlayerState.PLAYING) {
                    for (Table t : tables.values()) {
                        if (t.players.contains(p)) {
                            p.hand.addCard(t.deck.draw());
                            if (p.hand.getTotal() > 21) p.state = PlayerState.BUSTED;
                            break;
                        }
                    }
                }
            }
            else if (action.equals("STAND")) {
                Player p = players.get(ws);
                if (p != null && p.state == PlayerState.PLAYING) {
                    p.state = PlayerState.STANDING;
                }
            }
        } catch (Exception e) {
            System.err.println("Bad JSON payload in Lobby");
        }
    }

    public static void handleDisconnect(WebSocket ws) {
        Player p = players.remove(ws);
        if (p != null) {
            for (Table t : tables.values()) {
                t.leaveTable(p.username);
            }
        }
    }
}

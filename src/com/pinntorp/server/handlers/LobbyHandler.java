package com.pinntorp.server.handlers;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.pinntorp.server.*;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.security.SecureRandom;
import java.util.List;

public class LobbyHandler implements HttpHandler
{
    private final UserStore userStore;
    private final LobbyManager lobbyManager;
    private final SecureRandom random;

    public LobbyHandler(UserStore userStore, LobbyManager lobbyManager)
    {
        this.userStore = userStore;
        this.lobbyManager = lobbyManager;
        this.random = new SecureRandom();
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException
    {
        // Check if the correct method was used
        if(!exchange.getRequestMethod().equalsIgnoreCase("POST"))
        {
            // Respond with HTTP error 405 Method Not Allowed if POST not used
            exchange.sendResponseHeaders(405, -1);
            Console.log("LobbyHandler", "There was an attempt to use \"" + exchange.getRequestMethod() + "\" on the \"/lobby\" endpoint.");
            return;
        }

        try
        {
            // Parse request JSON
            InputStreamReader reader = new InputStreamReader(exchange.getRequestBody());
            JsonObject request = JsonParser.parseReader(reader).getAsJsonObject();
            reader.close();

            // Get session ID and action
            String sessionID = request.get("sessionID").getAsString();
            String action = request.get("action").getAsString();

            // Verify session ID
            if(sender.verifySessionID(request.sessionID))
            {
                if(request.action.equals("create"))
                {
                    // Create lobby
                    Lobby newLobby = this.lobbyManager.createLobby(request.lobby);

                    // Respond with lobby ID
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, 0);
                    OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                    Json.GSON.toJson(new LobbyIDResponse(newLobby.getID()), writer);
                    writer.close();

                    // Log
                    Console.log("LobbyHandler", "Lobby ID " + newLobby.getID() + " created by player ID " + request.playerID + ".");
                }
                else if(request.action.equals("list"))
                {
                    // Get list of lobbies
                    List<JsonObject> lobbyList = this.lobbyManager.listLobbies();

                    // Respond with lobby list
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, 0);
                    OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                    Json.GSON.toJson(new LobbyListResponse(lobbyList), writer);
                    writer.close();
                }
                else if(request.action.equals("join"))
                {
                    // Add joining player to lobby
                    this.lobbyManager.joinLobby(sender.getPlayerID(), request.lobby);

                    // Respond with success
                    exchange.sendResponseHeaders(200, -1);
                    Console.log("LobbyHandler", "Player ID " + sender.getPlayerID() + " joined lobby ID " + joining.getID() + ".");
                }
                else if(request.action.equals("leave"))
                {
                    // Remove leaving player from lobby
                    this.lobbyManager.leaveLobby(request.playerID, request.lobby);

                    // Respond with success
                    exchange.sendResponseHeaders(200, -1);
                    Console.log("LobbyHandler", "Player ID " + sender.getPlayerID() + " left lobby ID " + leaving.getID() + ".");
                }
                else
                {
                    exchange.sendResponseHeaders(400, -1);
                    Console.log("LobbyHandler", "Unsupported action \"" + request.action + "\" requested.");
                }

                // Renew user's session expiry
                sender.extendSession();
            }
            else
            {
                exchange.sendResponseHeaders(401, -1);
                Console.log("LobbyHandler", "Received invalid session ID while attempting to " + request.action + " lobby.");
            }
        }
        catch (Exception e)
        {
            Console.log("LobbyHandler", "Encountered " + e.getClass().getName() + " while attempting to handle /lobby request.\n" + e);
        }
    }
}

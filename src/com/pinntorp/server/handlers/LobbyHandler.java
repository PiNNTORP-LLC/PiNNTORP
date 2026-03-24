package com.pinntorp.server.handlers;

import com.google.gson.JsonElement;
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
    private final SessionManager sessionManager;
    private final LobbyManager lobbyManager;

    public LobbyHandler(SessionManager sessionManager, LobbyManager lobbyManager)
    {
        this.sessionManager = sessionManager;
        this.lobbyManager = lobbyManager;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException
    {
        try
        {
            // Check if the correct method was used
            if(!exchange.getRequestMethod().equalsIgnoreCase("POST"))
            {
                // Respond with HTTP error 405 Method Not Allowed if POST not used
                exchange.sendResponseHeaders(405, -1);
                Console.log("LobbyHandler", "There was an attempt to use \"" + exchange.getRequestMethod() + "\" on the /lobby endpoint.");
                exchange.close();
                return;
            }

            // Parse request JSON
            InputStreamReader reader = new InputStreamReader(exchange.getRequestBody());
            JsonObject request = JsonParser.parseReader(reader).getAsJsonObject();
            reader.close();

            // Get the request parameters
            String sessionID = request.get("sessionID").getAsString();
            String action = request.get("action").getAsString();

            // Create the response
            JsonObject response = new JsonObject();

            // Verify and get current session
            Session session = this.sessionManager.verifySession(sessionID);
            if(session == null)
            {
                response.addProperty("error", "Invalid session ID");
                response.addProperty("success", false);
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(401, 0);
                OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                Json.GSON.toJson(response, writer);
                writer.close();
                exchange.close();
                return;
            }

            // Check and perform requested action
            if(action.equals("create"))
            {
                // Create lobby of specified name and return lobby ID
                String lobbyName = request.get("lobbyName").getAsString();
                String lobbyID = this.lobbyManager.createLobby(lobbyName);
                response.addProperty("lobbyID", lobbyID);
                response.addProperty("success", true);
            }
            else if(action.equals("list"))
            {
                // List all lobbies
                response.add("lobbyList", this.lobbyManager.listLobbies());
                response.addProperty("success", true);
            }
            else if(action.equals("join"))
            {
                // Join lobby by lobby ID
                String lobbyID = request.get("lobbyID").getAsString();
                response.addProperty("success", this.lobbyManager.joinLobby(session, lobbyID));
            }
            else if(action.equals("leave"))
            {
                // Leave currently joined lobby
                response.addProperty("success", this.lobbyManager.leaveLobby(session));
            }
            else
            {
                // Unsupported action, respond with failure
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(400, 0);
                response.addProperty("error", "Unsupported action requested.");
                response.addProperty("success", false);
                OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                Json.GSON.toJson(response, writer);
                writer.close();
                exchange.close();
                Console.log("LobbyHandler", "Unsupported action \"" + action + "\" requested.");
                return;
            }

            // Response
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, 0);
            OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
            Json.GSON.toJson(response, writer);
            writer.close();
            exchange.close();
        }
        catch(Exception e)
        {
            Console.log("LobbyHandler", "Encountered " + e.getClass().getName() + " while attempting to handle /lobby request.\n" + e);
        }
    }
}

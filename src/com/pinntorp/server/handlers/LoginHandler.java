package com.pinntorp.server.handlers;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.pinntorp.server.*;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;

/**
 * This class implements the "/login" HTTP API endpoint for authenticating users
 */
public class LoginHandler implements HttpHandler
{
    private final UserStore userStore;
    private final SessionManager sessionManager;

    public LoginHandler(UserStore userStore, SessionManager sessionManager)
    {
        this.userStore = userStore;
        this.sessionManager = sessionManager;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException
    {
        // CORS headers required when frontend is served from a different port (e.g. 8080 vs 5500)
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

        // Handle preflight
        if(exchange.getRequestMethod().equalsIgnoreCase("OPTIONS"))
        {
            exchange.sendResponseHeaders(204, -1);
            return;
        }

        try
        {
            // Check if the correct method was used
            if(!exchange.getRequestMethod().equalsIgnoreCase("POST"))
            {
                // Respond with HTTP error 405 Method Not Allowed if POST not used
                exchange.sendResponseHeaders(405, -1);
                Console.log("LoginHandler", "There was an attempt to use \"" + exchange.getRequestMethod() + "\" on the \"/login\" endpoint.");
                exchange.close();
                return;
            }

            // Parse request JSON
            InputStreamReader reader = new InputStreamReader(exchange.getRequestBody());
            JsonObject request = JsonParser.parseReader(reader).getAsJsonObject();
            reader.close();

            // Get the request parameters
            String action = request.get("action").getAsString();
            String username = request.has("username") ? request.get("username").getAsString() : "";
            String password = request.has("password") ? request.get("password").getAsString() : "";

            // Create the response
            JsonObject response = new JsonObject();

            // Check and perform requested action
            if(action.equals("register"))
            {
                // Create new user and start session
                int playerID = this.userStore.register(username, password);
                if(playerID != -1)
                {
                    this.userStore.saveUsers();
                    String sessionID = this.sessionManager.startSession(playerID);
                    response.addProperty("sessionID", sessionID);
                    response.addProperty("playerID", playerID);
                    response.addProperty("success", true);
                }
                else
                {
                    response.addProperty("success", false);
                }
            }
            else if(action.equals("login"))
            {
                // Get user and start session
                int playerID = this.userStore.login(username, password);
                if(playerID != -1)
                {
                    // User logged in successfully, start session and add session ID to response
                    String sessionID = this.sessionManager.startSession(playerID);
                    response.addProperty("sessionID", sessionID);
                    response.addProperty("playerID", playerID);
                }
                // Add success to response
                response.addProperty("success", playerID != -1);
            }
            else if(action.equals("logout"))
            {
                // Get and end session
                String sessionID = request.get("sessionID").getAsString();
                Session session = this.sessionManager.endSession(sessionID);
                response.addProperty("success", session != null);
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
                Console.log("LoginHandler", "Unsupported action \"" + action + "\" requested.");
                return;
            }

            // Respond
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, 0);
            OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
            Json.GSON.toJson(response, writer);
            writer.close();
            exchange.close();
        }
        catch(Exception e)
        {
            Console.log("LoginHandler", "Encountered " + e.getClass().getName() + " while attempting to handle /login request.\n" + e);
        }
    }
}

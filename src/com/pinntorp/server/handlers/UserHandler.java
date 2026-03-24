package com.pinntorp.server.handlers;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.pinntorp.server.*;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;

public class UserHandler implements HttpHandler
{
    private final UserStore userStore;
    private final SessionManager sessionManager;

    public UserHandler(UserStore userStore, SessionManager sessionManager)
    {
        this.userStore = userStore;
        this.sessionManager = sessionManager;
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
                Console.log("UserHandler", "There was an attempt to use \"" + exchange.getRequestMethod() + "\" on the /user endpoint.");
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
            if(action.equals("deposit"))
            {
                // Add specified amount of funds from user balance
                double amount = request.get("amount").getAsDouble();
                User user = this.userStore.getUser(session.getPlayerID());
                response.addProperty("success", user.withdraw(amount));
                response.addProperty("balance", user.getBalance());
            }
            else if(action.equals("withdraw"))
            {
                // Remove specified amount of funds from user balance
                double amount = request.get("amount").getAsDouble();
                User user = this.userStore.getUser(session.getPlayerID());
                user.deposit(amount);
                response.addProperty("balance", user.getBalance());
                response.addProperty("success", true);
            }
            else if(action.equals("getBalance"))
            {
                // Get user balance
                User user = this.userStore.getUser(session.getPlayerID());
                response.addProperty("balance", user.getBalance());
                response.addProperty("success", true);
            }
            else
            {
                // Unsupported action, respond wth failure
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(400, 0);
                response.addProperty("error", "Unsupported action requested");
                response.addProperty("success", false);
                OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                Json.GSON.toJson(response, writer);
                writer.close();
                exchange.close();
                Console.log("UserHandler", "Unsupported action \"" + action + "\" requested.");
                return;
            }

            // Send response
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, 0);
            OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
            Json.GSON.toJson(response, writer);
            writer.close();
            exchange.close();
        }
        catch(Exception e)
        {
            Console.log("UserHandler", "Encountered " + e.getClass().getName() + " while attempting to handle /user request.\n" + e);
        }
    }
}

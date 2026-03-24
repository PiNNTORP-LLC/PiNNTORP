package com.pinntorp.server.handlers;

import com.pinntorp.server.Console;
import com.pinntorp.server.Json;
import com.pinntorp.server.User;
import com.pinntorp.server.UserStore;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;

public class UserHandler implements HttpHandler
{
    private final UserStore userStore;

    public UserHandler(UserStore userStore)
    {
        this.userStore = userStore;
    }

    public class UserRequest
    {
        String action;
        String sessionID;
        int playerID;
        double amount;
    }

    public class UserBalanceResponse
    {
        UserBalanceResponse(double balance, boolean result)
        {
            this.balance = balance;
            this.result = result;
        }

        double balance;
        boolean result;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException
    {
        // Check if the correct method was used
        if(!exchange.getRequestMethod().equalsIgnoreCase("POST"))
        {
            // Respond with HTTP error 405 Method Not Allowed if POST not used
            exchange.sendResponseHeaders(405, -1);
            Console.log("LoginHandler", "There was an attempt to use \"" + exchange.getRequestMethod() + "\" on the \"/login\" endpoint.");
            return;
        }

        try
        {
            // Parse request JSON
            InputStreamReader reader = new InputStreamReader(exchange.getRequestBody());
            UserRequest request = Json.GSON.fromJson(reader, UserRequest.class);
            reader.close();

            // Get sender
            User sender = this.userStore.getUser(request.playerID);

            // Verify session ID
            if(!sender.verifySessionID(request.sessionID))
            {
                // Session IDs don't match, send error response and return
                exchange.sendResponseHeaders(401, -1);
                Console.log("UserHandler", "Received request with mismatching session ID from player ID " + request.playerID + ".");
                return;
            }

            // Check request action
            if(request.action.equals("deposit"))
            {
                // Deposit funds, get updated balance
                sender.deposit(request.amount);

                // Respond with balance
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, 0);
                OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                Json.GSON.toJson(new UserBalanceResponse(sender.getBalance(), true), writer);
                writer.close();
            }
            else if(request.action.equals("withdraw"))
            {
                // Withdraw funds, get updated balance
                boolean result = sender.withdraw(request.amount);

                // Respond with balance and result
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, 0);
                OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                Json.GSON.toJson(new UserBalanceResponse(sender.getBalance(), result), writer);
                writer.close();
            }
            else if(request.action.equals("balance"))
            {
                // Respond with balance
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, 0);
                OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                Json.GSON.toJson(new UserBalanceResponse(sender.getBalance(), true), writer);
                writer.close();
            }
            else
            {
                // Respond with unsupported action
                exchange.sendResponseHeaders(400, -1);
                Console.log("UserHandler", "Unsupported action \"" + request.action + "\" requested.");
            }

            // Renew user's session expiry
            sender.extendSession();
        }
        catch(Exception e)
        {
            Console.log("UserHandler", "Encountered " + e.getClass().getName() + " while attempting to handle /user request.\n" + e);
        }
    }
}

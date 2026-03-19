package com.pinntorp.server.handlers;

import com.pinntorp.server.Console;
import com.pinntorp.server.Json;
import com.pinntorp.server.User;
import com.pinntorp.server.UserStore;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.security.SecureRandom;

/**
 * This class implements the "/login" HTTP API endpoint for authenticating users
 */
public class LoginHandler implements HttpHandler
{
    private final UserStore userStore;
    private final SecureRandom random;

    public LoginHandler(UserStore userStore)
    {
        this.userStore = userStore;
        this.random = new SecureRandom();
    }

    /**
     * This class is the Java object blueprint for the JSON auth request objects
     */
    public class LoginRequest
    {
        String action;      // the requested action (login, register, or logout)
        String username;    // the username of the requested user
        String passwordHash;// the password hash of the requested user
    }

    public class LoginResponse
    {
        LoginResponse(int playerID, String sessionID)
        {
            this.playerID = playerID;
            this.sessionID = sessionID;
        }

        int playerID;
        String sessionID;
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
            LoginRequest request = Json.GSON.fromJson(reader, LoginRequest.class);
            reader.close();

            // Get requested user
            User requestedUser = this.userStore.getUser(request.username);

            // Check request action
            if(request.action.equals("login") && requestedUser != null)
            {
                // Check if password hash equals and user exists
                if(requestedUser.getPasswordHash().equals(request.passwordHash))
                {
                    // Generate session ID
                    String sessionID = requestedUser.generateSessionID(this.random);

                    // Set and send response headers
                    exchange.getResponseHeaders().set("Content-Type", "application/json");
                    exchange.sendResponseHeaders(200, 0);

                    // Write response
                    OutputStreamWriter responseWriter = new OutputStreamWriter(exchange.getResponseBody());
                    Json.GSON.toJson(new LoginResponse(requestedUser.getPlayerID(), sessionID), responseWriter);
                    responseWriter.close();
                }
            }
            else if(request.action.equals("register"))
            {
                // Create user and generate session ID
                requestedUser = this.userStore.newUser(request.username, request.passwordHash);
                String sessionID = requestedUser.generateSessionID(this.random);

                // Set and send response headers
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, 0);

                // Write response
                OutputStreamWriter responseWriter = new OutputStreamWriter(exchange.getResponseBody());
                Json.GSON.toJson(new LoginResponse(requestedUser.getPlayerID(), sessionID), responseWriter);
                responseWriter.close();
            }
            else if(request.action.equals("logout"))
            {
                // Invalidate user session and send response
                requestedUser.invalidateSessionID();
                exchange.sendResponseHeaders(200, -1);
            }
            else
            {
                // Unsupported action, send HTTP error code 400 Bas Request
                Console.log("LoginHandler", "Unsupported action \"" + request.action + "\" requested.");
                exchange.sendResponseHeaders(400, -1);
            }
        }
        catch(Exception e)
        {
            Console.log("LoginHandler", "Encountered " + e.getClass().getName() + " while attempting to handle /login request.\n" + e);
        }
    }
}

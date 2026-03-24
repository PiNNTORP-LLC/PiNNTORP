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

public class FriendsHandler implements HttpHandler
{
    private final UserStore userStore;
    private final SessionManager sessionManager;

    public FriendsHandler(UserStore userStore, SessionManager sessionManager)
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
                Console.log("FriendsHandler", "There was an attempt to use \"" + exchange.getRequestMethod() + "\" on the /friends endpoint.");
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
            if(action.equals("sendRequest"))
            {
                // Send friend request to specified user
                int friendID = request.get("friendID").getAsInt();
                response.addProperty("success", this.userStore.sendFriendRequest(session.getPlayerID(), friendID));
            }
            else if(action.equals("getRequests"))
            {
                // Get friend requests sent and received by specified user
                User user = this.userStore.getUser(session.getPlayerID());
                JsonElement sentRequests = Json.GSON.toJsonTree(user.getSentFriendRequests());
                JsonElement receivedRequests = Json.GSON.toJsonTree(user.getReceivedFriendRequests());
                response.add("sent", sentRequests);
                response.add("received", receivedRequests);
                response.addProperty("success", true);
            }
            else if(action.equals("acceptRequest"))
            {
                // Accept friend request received from specified user
                int friendID = request.get("friendID").getAsInt();
                response.addProperty("success", this.userStore.acceptFriendRequest(session.getPlayerID(), friendID));
            }
            else if(action.equals("declineRequest"))
            {
                // Decline friend request received from specified user
                int friendID = request.get("friendID").getAsInt();
                response.addProperty("success", this.userStore.declineFriendRequest(session.getPlayerID(), friendID));
            }
            else if(action.equals("cancelRequest"))
            {
                // Cancel friend request sent to specified user
                int friendID = request.get("friendID").getAsInt();
                response.addProperty("success", this.userStore.cancelFriendRequest(session.getPlayerID(), friendID));
            }
            else if(action.equals("getFriends"))
            {
                // Get friends of specified user
                User user = this.userStore.getUser(session.getPlayerID());
                JsonElement friendsList = Json.GSON.toJsonTree(user.getFriends());
                response.add("friends", friendsList);
                response.addProperty("success", true);
            }
            else if(action.equals("removeFriend"))
            {
                // Remove friend from specified user's friends list
                int friendID = request.get("friendID").getAsInt();
                request.addProperty("success", this.userStore.removeFriend(session.getPlayerID(), friendID));
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
                Console.log("FriendsHandler", "Unsupported action \"" + action + "\" requested.");
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
            Console.log("FriendsHandler", "Encountered " + e.getClass().getName() + " while attempting to handle /friends request.\n" + e);
        }
    }
}

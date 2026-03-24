package com.pinntorp.server.handlers;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.pinntorp.server.Console;
import com.pinntorp.server.Json;
import com.pinntorp.server.User;
import com.pinntorp.server.UserStore;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.LinkedList;
import java.util.List;

public class FriendsHandler implements HttpHandler
{
    private final UserStore userStore;

    public FriendsHandler(UserStore userStore)
    {
        this.userStore = userStore;
    }

    public class FriendsRequest
    {
        String action;      // the action to perform (add, remove, and list friends, and accept, decline, and view pending friend requests)
        String sessionID;   // the session ID of the sender
        int playerID;       // the player ID of the sender
        int friendID;       // the player ID of the received
    }

    public class FriendsListEntry
    {
        FriendsListEntry(int playerID, String username)
        {
            this.playerID = playerID;
            this.username = username;
        }

        int playerID;
        String username;
    }

    public class FriendsListResponse
    {
        FriendsListResponse()
        {
            this.friends = new LinkedList<>();
        }

        List<FriendsListEntry> friends;
    }

    public class RequestListResponse
    {
        RequestListResponse()
        {
            this.sent = new LinkedList<>();
            this.received = new LinkedList<>();
        }

        List<FriendsListEntry> sent;
        List<FriendsListEntry> received;
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
                Console.log("FriendsHandler", "There was an attempt to use \"" + exchange.getRequestMethod() + "\" on the \"/friends\" endpoint.");
                return;
            }

            // Parse request JSON
            InputStreamReader reader = new InputStreamReader(exchange.getRequestBody());
            JsonObject request = JsonParser.parseReader(reader).getAsJsonObject();
            reader.close();

            // Get the request parameters
            String sessionID = request.get("sessionID").getAsString();
            String action = request.get("action").getAsString();
        }
        catch(Exception e)
        {

        }

        // Check if the correct method was used
        if(!exchange.getRequestMethod().equalsIgnoreCase("POST"))
        {
            // Respond with HTTP error 405 Method Not Allowed if POST not used
            exchange.sendResponseHeaders(405, -1);
            Console.log("FriendsHandler", "There was an attempt to use \"" + exchange.getRequestMethod() + "\" on the \"/login\" endpoint.");
            return;
        }

        try
        {
            // Parse request JSON
            InputStreamReader reader = new InputStreamReader(exchange.getRequestBody());
            FriendsRequest request = Json.GSON.fromJson(reader, FriendsRequest.class);
            reader.close();

            // Get sender and receiver
            User sender = this.userStore.getUser(request.playerID);
            User receiver = this.userStore.getUser(request.friendID);

            // Verify user session ID
            if(!sender.verifySessionID(request.sessionID))
            {
                // Session IDs don't match, send error response and return
                exchange.sendResponseHeaders(401, -1);
                Console.log("FriendsHandler", "Received request with mismatching session ID from player ID " + request.playerID + ".");
                return;
            }

            // Check request action
            if(request.action.equals("add"))
            {
                // Add friend, send request
                sender.sendFriendRequest(receiver.getPlayerID());
                receiver.receiveFriendRequest(sender.getPlayerID());

                // Respond with success
                exchange.sendResponseHeaders(200, -1);
                Console.log("FriendsHandler", "Player ID " + sender.getPlayerID() + " sent friend request to player ID " + receiver.getPlayerID() + ".");
            }
            else if(request.action.equals("remove"))
            {
                // Remove friend, remove
                sender.removeFriend(receiver.getPlayerID());
                receiver.removeFriend(sender.getPlayerID());

                // Respond with success
                exchange.sendResponseHeaders(200, -1);
                Console.log("FriendsHandler", "Player ID " + sender.getPlayerID() + " removed player ID " + receiver.getPlayerID() + " from friends list.");
            }
            else if(request.action.equals("list-friends"))
            {
                // List friends, get all friends
                FriendsListResponse response = new FriendsListResponse();
                sender.getFriends().forEach((Integer friendID) -> {
                    response.friends.add(new FriendsListEntry(friendID, this.userStore.getUser(friendID).getUsername()));
                });

                // Respond with friends list
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, 0);
                OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                Json.GSON.toJson(response, writer);
                writer.close();
            }
            else if(request.action.equals("accept"))
            {
                // Accept request, add to list
                sender.acceptFriendRequest(receiver.getPlayerID()); // Remove request from received requests
                receiver.cancelFriendRequest(sender.getPlayerID()); // Remove request from sent requests
                receiver.addFriend(sender.getPlayerID());           // Add friend

                // Respond with success
                exchange.sendResponseHeaders(200, -1);
                Console.log("FriendsHandler", "Player ID " + sender.getPlayerID() + " accepted friend request from player ID " + receiver.getPlayerID());
            }
            else if(request.action.equals("decline"))
            {
                // Decline request, don't add friend
                sender.declineFriendRequest(receiver.getPlayerID());// Remove request from received requests
                receiver.cancelFriendRequest(sender.getPlayerID()); // Remove request from sent requests

                // Respond with success
                exchange.sendResponseHeaders(200, -1);
                Console.log("FriendsHandler", "Player ID " + sender.getPlayerID() + " declined friend request from player ID " + receiver.getPlayerID());
            }
            else if(request.action.equals("cancel"))
            {
                // Cancel request, don't add friend
                sender.cancelFriendRequest(receiver.getPlayerID()); // Remove request from sent requests
                receiver.declineFriendRequest(sender.getPlayerID());// Remove request from received requests

                // Respond with success
                exchange.sendResponseHeaders(200, -1);
                Console.log("FriendsHandler", "Player ID " + sender.getPlayerID() + " cancelled friend request sent to player ID " + receiver.getPlayerID());
            }
            else if(request.action.equals("list-requests"))
            {
                // List friend requests, get all friend requests
                RequestListResponse response = new RequestListResponse();
                sender.getSentFriendRequests().forEach((Integer friendID) -> {
                    response.sent.add(new FriendsListEntry(friendID, this.userStore.getUser(friendID).getUsername()));
                });
                sender.getReceivedFriendRequests().forEach((Integer friendID) -> {
                    response.received.add(new FriendsListEntry(friendID, this.userStore.getUser(friendID).getUsername()));
                });

                // Respond with friend request list
                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, 0);
                OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                Json.GSON.toJson(response, writer);
                writer.close();
            }
            else
            {
                // Respond with unsupported action
                exchange.sendResponseHeaders(400, -1);
                Console.log("FriendsHandler", "Unsupported action \"" + request.action + "\" requested.");
            }

            // Renew user's session expiry
            sender.extendSession();
        }
        catch(Exception e)
        {
            Console.log("FriendsHandler", "Encountered " + e.getClass().getName() + " while attempting to handle /friends request.\n" + e);
        }
    }
}

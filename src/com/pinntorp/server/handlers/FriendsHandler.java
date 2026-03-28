package com.pinntorp.server.handlers;

import com.google.gson.JsonObject;
import com.pinntorp.server.Console;
import com.pinntorp.server.Json;
import com.pinntorp.server.Session;
import com.pinntorp.server.SessionManager;
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
    private final SessionManager sessionManager;

    public FriendsHandler(UserStore userStore, SessionManager sessionManager)
    {
        this.userStore = userStore;
        this.sessionManager = sessionManager;
    }

    public class FriendsRequest
    {
        String action;          // the action to perform (add, remove, list, accept, decline, cancel, list-requests, find)
        String sessionID;       // the session ID of the sender
        int playerID;           // the player ID of the sender
        int friendID;           // the player ID of the receiver
        String targetUsername;  // username to search for (used by "find" action)
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

        if(!exchange.getRequestMethod().equalsIgnoreCase("POST"))
        {
            exchange.sendResponseHeaders(405, -1);
            Console.log("FriendsHandler", "There was an attempt to use \"" + exchange.getRequestMethod() + "\" on the \"/friends\" endpoint.");
            return;
        }

        try
        {
            // Parse request JSON (body can only be read once)
            InputStreamReader reader = new InputStreamReader(exchange.getRequestBody());
            FriendsRequest request = Json.GSON.fromJson(reader, FriendsRequest.class);
            reader.close();

            // Verify session (skip for "find" since it only looks up a username)
            if(!request.action.equals("find"))
            {
                Session session = this.sessionManager.verifySession(request.sessionID);
                if(session == null || session.getPlayerID() != request.playerID)
                {
                    exchange.sendResponseHeaders(401, -1);
                    Console.log("FriendsHandler", "Received request with invalid session from player ID " + request.playerID + ".");
                    return;
                }
            }

            // Get sender and receiver
            User sender = this.userStore.getUser(request.playerID);
            User receiver = this.userStore.getUser(request.friendID);

            // Check request action
            if(request.action.equals("add"))
            {
                // Add friend, send request
                sender.sendFriendRequest(request.friendID);
                receiver.receiveFriendRequest(request.playerID);
                this.userStore.saveUsers();

                // Respond with success
                exchange.sendResponseHeaders(200, -1);
                Console.log("FriendsHandler", "Player ID " + request.playerID + " sent friend request to player ID " + request.friendID + ".");
            }
            else if(request.action.equals("remove"))
            {
                // Remove friend, remove
                sender.removeFriend(request.friendID);
                receiver.removeFriend(request.playerID);
                this.userStore.saveUsers();

                // Respond with success
                exchange.sendResponseHeaders(200, -1);
                Console.log("FriendsHandler", "Player ID " + request.playerID + " removed player ID " + request.friendID + " from friends list.");
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
                sender.acceptFriendRequest(request.friendID);  // Remove from received, add friend
                receiver.cancelFriendRequest(request.playerID); // Remove from sent
                receiver.addFriend(request.playerID);           // Add friend back
                this.userStore.saveUsers();

                // Respond with success
                exchange.sendResponseHeaders(200, -1);
                Console.log("FriendsHandler", "Player ID " + request.playerID + " accepted friend request from player ID " + request.friendID);
            }
            else if(request.action.equals("decline"))
            {
                // Decline request, don't add friend
                sender.declineFriendRequest(request.friendID);  // Remove from received
                receiver.cancelFriendRequest(request.playerID); // Remove from sent
                this.userStore.saveUsers();

                // Respond with success
                exchange.sendResponseHeaders(200, -1);
                Console.log("FriendsHandler", "Player ID " + request.playerID + " declined friend request from player ID " + request.friendID);
            }
            else if(request.action.equals("cancel"))
            {
                // Cancel request, don't add friend
                sender.cancelFriendRequest(request.friendID);   // Remove from sent
                receiver.declineFriendRequest(request.playerID);// Remove from received
                this.userStore.saveUsers();

                // Respond with success
                exchange.sendResponseHeaders(200, -1);
                Console.log("FriendsHandler", "Player ID " + request.playerID + " cancelled friend request sent to player ID " + request.friendID);
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
            else if(request.action.equals("find"))
            {
                // Find a user by username — used by the frontend to resolve username → playerID
                int foundID = this.userStore.findByUsername(request.targetUsername != null ? request.targetUsername : "");
                JsonObject findResponse = new JsonObject();
                if(foundID != -1)
                {
                    findResponse.addProperty("found", true);
                    findResponse.addProperty("playerID", foundID);
                    findResponse.addProperty("username", request.targetUsername);
                }
                else
                {
                    findResponse.addProperty("found", false);
                }

                exchange.getResponseHeaders().set("Content-Type", "application/json");
                exchange.sendResponseHeaders(200, 0);
                OutputStreamWriter writer = new OutputStreamWriter(exchange.getResponseBody());
                Json.GSON.toJson(findResponse, writer);
                writer.close();
            }
            else
            {
                // Respond with unsupported action
                exchange.sendResponseHeaders(400, -1);
                Console.log("FriendsHandler", "Unsupported action \"" + request.action + "\" requested.");
            }

            // Session extension omitted (handled by session manager TTL)
        }
        catch(Exception e)
        {
            Console.log("FriendsHandler", "Encountered " + e.getClass().getName() + " while attempting to handle /friends request.\n" + e);
        }
    }
}

package com.pinntorp.server;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;

import java.security.SecureRandom;
import java.util.LinkedList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

public class LobbyManager
{
    private final ConcurrentHashMap<String, Lobby> lobbies;
    private final SecureRandom random;
    private final String CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    LobbyManager()
    {
        this.lobbies = new ConcurrentHashMap<>();
        this.random = new SecureRandom();
    }

    public String createLobby(String name)
    {
        StringBuilder lobbyID = new StringBuilder(8);
        for(int i = 0; i < 6; i++)
        {
            lobbyID.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        Lobby newLobby = new Lobby(lobbyID.toString(), name);
        this.lobbies.put(lobbyID.toString(), newLobby);
        return lobbyID.toString();
    }

    public boolean joinLobby(Session session, String lobbyID)
    {
        Lobby lobby = this.lobbies.get(lobbyID);
        if(lobby != null)
        {
            lobby.addPlayer(session.getPlayerID());
            session.setLobbyID(lobbyID);
            return true;
        }
        return false;
    }

    public boolean leaveLobby(Session session)
    {
        Lobby lobby = this.lobbies.get(session.getLobbyID());
        if(lobby != null)
        {
            lobby.removePlayer(session.getPlayerID());
            session.setLobbyID(null);
            return true;
        }
        return false;
    }

    public Lobby getLobby(String id)
    {
        return this.lobbies.get(id);
    }

    public void closeLobby(String id)
    {
        this.lobbies.remove(id);
    }

    public JsonArray listLobbies()
    {
        JsonArray array = new JsonArray();
        this.lobbies.forEach((String lobbyID, Lobby lobby) -> {
            JsonObject lobbyObject = new JsonObject();
            lobbyObject.add("lobbyID", new JsonPrimitive(lobbyID));
            lobbyObject.add("name", new JsonPrimitive(lobby.getName()));
            array.add(lobbyObject);
        });
        return array;
    }
}

package com.pinntorp.server;

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

    public Lobby createLobby(String name)
    {
        StringBuilder lobbyID = new StringBuilder(8);
        for(int i = 0; i < 6; i++)
        {
            lobbyID.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        Lobby newLobby = new Lobby(lobbyID.toString(), name);
        this.lobbies.put(lobbyID.toString(), newLobby);
        return newLobby;
    }

    public void joinLobby(int playerID, String lobbyID)
    {
        this.lobbies.get(lobbyID).addPlayer(playerID);
    }

    public void leaveLobby(int playerID, String lobbyID)
    {
        Lobby lobby = this.lobbies.get(lobbyID);
        lobby.removePlayer(playerID);
        if(lobby.isEmpty())
        {
            this.lobbies.remove(lobbyID);
        }
    }

    public Lobby getLobby(String id)
    {
        return this.lobbies.get(id);
    }

    public void closeLobby(String id)
    {
        this.lobbies.remove(id);
    }

    public List<JsonObject> listLobbies()
    {
        List<JsonObject> list = new LinkedList<>();
        this.lobbies.forEach((String lobbyID, Lobby lobby) -> {
            JsonObject lobbyObject = new JsonObject();
            lobbyObject.add("lobbyID", new JsonPrimitive(lobbyID));
            lobbyObject.add("name", new JsonPrimitive(lobby.getName()));
            list.add(lobbyObject);
        });
        return list;
    }
}

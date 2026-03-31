package com.pinntorp.server;

import com.pinntorp.games.Game;

import java.util.HashSet;
import java.util.Set;

public class Lobby
{
    private String lobbyID;
    private String name;
    private int owner;
    private Set<Integer> players;
    private Game game;

    Lobby(String id, String name)
    {
        this.lobbyID = id;
        this.name = name;
        this.owner = -1;
        this.players = new HashSet<>();
        this.game = null;
    }

    public String getID()
    {
        return this.lobbyID;
    }

    public String getName()
    {
        return this.name;
    }

    public void addPlayer(int playerID)
    {
        this.players.add(playerID);
        if(this.owner < 0)
        {
            this.owner = playerID;
        }
    }

    public void removePlayer(int playerID)
    {
        this.players.remove(playerID);
        if(this.owner == playerID)
        {
            this.owner = this.players.toArray(new Integer[0])[0];
        }
    }

    public boolean isEmpty()
    {
        return this.players.isEmpty();
    }
}

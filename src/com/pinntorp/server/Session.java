package com.pinntorp.server;

public class Session
{
    private long expiry;    // Session expiry timestamp
    private int playerID;   // Session owner ID
    private String lobbyID; // Session

    public Session(int playerID)
    {
        this.expiry = System.currentTimeMillis() + 30 * 60 * 1000;
        this.playerID = playerID;
    }

    // Check if session has expired, returning null if so.
    public Session verify()
    {
        if(System.currentTimeMillis() > this.expiry)
        {
            return null;
        }
        return this;
    }

    // Returns the ID of the player tied to this session
    public int getPlayerID()
    {
        return this.playerID;
    }

    // Sets the lobby ID this session is tied to
    public void setLobbyID(String lobbyID)
    {
        this.lobbyID = lobbyID;
    }

    // Returns the ID of the lobby currently tied to this session
    public String getLobbyID()
    {
        return this.lobbyID;
    }
}

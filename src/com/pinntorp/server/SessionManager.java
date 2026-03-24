package com.pinntorp.server;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

public class SessionManager
{
    private final ConcurrentHashMap<String, Session> sessions;
    private final SecureRandom random;

    public SessionManager()
    {
        this.sessions = new ConcurrentHashMap<>();
        this.random = new SecureRandom();
    }

    // Generates and returns a session ID
    private String generateSessionID()
    {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // Creates a new session tied to the requested player, and returns its ID
    public String startSession(int playerID)
    {
        String sessionID = this.generateSessionID();
        this.sessions.put(sessionID, new Session(playerID));
        return sessionID;
    }

    // Checks to see if a session with the provided ID exists, and if it's expired
    public Session verifySession(String sessionID)
    {
        Session session = this.sessions.get(sessionID);
        if(session == null) return null;
        return this.sessions.get(sessionID).verify();
    }

    // Ends the specified session
    public Session endSession(String sessionID)
    {
        return this.sessions.remove(sessionID);
    }
}

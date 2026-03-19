package com.pinntorp.server;

import java.security.SecureRandom;
import java.util.*;

public class User
{
    private int playerID;
    private String username;
    private String passwordHash;
    private String sessionID;
    private long sessionExpiry;
    private double balance;
    private Set<Integer> friends;
    private Set<Integer> receivedFriendRequests;
    private Set<Integer> sentFriendRequests;

    /**
     * Creates a new User with the provided username and password hash.
     * This constructor sets the rest of user values to defaults, so
     * it's intended for creating newly registered users.
     * @param id            the users' player ID
     * @param username      the users' username
     * @param passwordHash  the users' password hashed and encoded in base64
     */
    public User(int id, String username, String passwordHash)
    {
        // Set player ID
        this.playerID = id;

        // Set username and password, and initialize the rest to empty.
        this.username = username;
        this.passwordHash = passwordHash;
        this.sessionID = "";
        this.sessionExpiry = 0;
        this.balance = 0.0;
        this.friends = new HashSet<>();
        this.receivedFriendRequests = new HashSet<>();
        this.sentFriendRequests = new HashSet<>();
    }

    /**
     * Creates a new User with the provided parameters.
     * This constructor is intended for loading existing users at startup
     * @param playerID
     * @param username
     * @param passwordHash
     * @param balance
     * @param friends
     * @param receivedFriendRequests
     * @param sentFriendRequests
     */
    public User(int playerID, String username, String passwordHash, double balance, Set<Integer> friends, Set<Integer> receivedFriendRequests, Set<Integer> sentFriendRequests)
    {
        this.playerID = playerID;
        this.username = username;
        this.passwordHash = passwordHash;
        this.sessionID = "";
        this.sessionExpiry = 0;
        this.balance = balance;
        this.friends = friends;
        this.receivedFriendRequests = receivedFriendRequests;
        this.sentFriendRequests = sentFriendRequests;
    }

    /**
     * Returns the player ID.
     * @return the player's ID
     */
    public int getPlayerID()
    {
        return this.playerID;
    }

    /**
     * Set the balance.
     * @param newBalance the value to set the user's balance to
     */
    public void setBalance(double newBalance)
    {
        this.balance = newBalance;
    }

    /**
     * Returns the balance.
     * @return the user's balance
     */
    public double getBalance()
    {
        return this.balance;
    }

    /**
     * Returns the username.
     * @return the user's username
     */
    public String getUsername()
    {
        return this.username;
    }

    /**
     * Returns the password hash.
     * @return the user's password hash
     */
    public String getPasswordHash()
    {
        return this.passwordHash;
    }

    /**
     * Returns the friends list.
     * @return the user's friends list
     */
    public Set<Integer> getFriends()
    {
        return this.friends;
    }

    public void addFriend(int friendID)
    {
        this.friends.add(friendID);
    }

    public void removeFriend(int friendID)
    {
        this.friends.remove(friendID);
    }

    /**
     * Returns the list of pending received friend requests
     * @return the user's friends request list
     */
    public Set<Integer> getReceivedFriendRequests()
    {
        return this.receivedFriendRequests;
    }

    /**
     * Returns the list of pending sent friend requests
     * @return the user's friends request list
     */
    public Set<Integer> getSentFriendRequests()
    {
        return this.sentFriendRequests;
    }

    public void sendFriendRequest(int friendID)
    {
        if(!this.friends.contains(friendID))
        {
            this.sentFriendRequests.add(friendID);
        }
    }

    public void receiveFriendRequest(int friendID)
    {
        if(!this.friends.contains(friendID))
        {
            this.receivedFriendRequests.add(friendID);
        }
    }

    public void acceptFriendRequest(int friendID)
    {
        if(this.receivedFriendRequests.remove(friendID))
        {
            this.addFriend(friendID);
        }
    }

    public void declineFriendRequest(int friendID)
    {
        this.receivedFriendRequests.remove(friendID);
    }

    public void cancelFriendRequest(int friendID)
    {
        this.sentFriendRequests.remove(friendID);
    }

    /**
     * Returns the session ID.
     * @return the user's session ID
     */
    public String getSessionID()
    {
        return this.sessionID;
    }

    /**
     * Update session expiry to 30 minutes after current time.
     */
    public void extendSession()
    {
        this.sessionExpiry = System.currentTimeMillis() + 30 * 60 * 1000;
    }

    /**
     * Check whether the session has expired.
     * @return true if the session expired, false if not
     */
    public boolean isSessionExpired()
    {
        return System.currentTimeMillis() > this.sessionExpiry;
    }

    public boolean verifySessionID(String sessionID)
    {
        // Check to make sure the session is not expired and that its ID matches the request ID
        return !(isSessionExpired() || !this.sessionID.equals(sessionID));
    }

    public String generateSessionID(SecureRandom random)
    {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        this.sessionID = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        this.sessionExpiry = System.currentTimeMillis() + 30 * 60 * 1000;
        return this.sessionID;
    }

    public void invalidateSessionID()
    {
        this.sessionExpiry = 0;
    }
}

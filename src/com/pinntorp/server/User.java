package com.pinntorp.server;

import java.security.SecureRandom;
import java.util.*;

public class User
{
    private String username;
    private String password;
    private double balance;
    private Set<Integer> friends;
    private Set<Integer> receivedFriendRequests;
    private Set<Integer> sentFriendRequests;

    /**
     * Creates a new User with the provided username and password hash.
     * This constructor sets the rest of user values to defaults, so
     * it's intended for creating newly registered users.
     * @param username      the users' username
     * @param password      the users' password
     */
    public User(String username, String password)
    {
        // Set username and password, and initialize the rest to empty.
        this.username = username;
        this.password = password;
        this.balance = 0.0;
        this.friends = new HashSet<>();
        this.receivedFriendRequests = new HashSet<>();
        this.sentFriendRequests = new HashSet<>();
    }

    /**
     * Creates a new User with the provided parameters.
     * This constructor is intended for loading existing users at startup
     * @param username      the user's username
     * @param password      the user's password
     * @param balance
     * @param friends
     * @param receivedFriendRequests
     * @param sentFriendRequests
     */
    public User(String username, String password, double balance, Set<Integer> friends, Set<Integer> receivedFriendRequests, Set<Integer> sentFriendRequests)
    {
        this.username = username;
        this.password = password;
        this.balance = balance;
        this.friends = friends;
        this.receivedFriendRequests = receivedFriendRequests;
        this.sentFriendRequests = sentFriendRequests;
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
     * Adds the specified amount to the user's balance.
     * @param amount the amount to add
     */
    public void deposit(double amount)
    {
        this.balance += amount;
    }

    /**
     * Withdraws the specified amount from the user's balance, if there is sufficient funds.
     * @param amount the amount to withdraw
     * @return whether the transaction was successful
     */
    public boolean withdraw(double amount)
    {
        if(this.balance >= amount)
        {
            this.balance -= amount;
            return true;
        }
        return false;
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
    public String getPassword()
    {
        return this.password;
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

    public boolean acceptFriendRequest(int friendID)
    {
        if(this.receivedFriendRequests.remove(friendID))
        {
            this.addFriend(friendID);
            return true;
        }
        return false;
    }

    public boolean declineFriendRequest(int friendID)
    {
        return this.receivedFriendRequests.remove(friendID);
    }

    public void cancelFriendRequest(int friendID)
    {
        this.sentFriendRequests.remove(friendID);
    }
}

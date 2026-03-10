package com.pinntorp.Server;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;

public class User
{
    private String username;
    private byte[] passwordHash;
    private String sessionID;
    private long sessionExpiry;
    private double balance;
    private ArrayList<User> friends;

    public User(String username, byte[] passwordHash)
    {
        this.username = username;
        this.passwordHash = passwordHash;
        this.sessionID = "";
        this.sessionExpiry = 0;
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
     * Returns the session ID.
     * @return the user's session ID
     */
    public String getSessionID()
    {
        return this.sessionID;
    }

    /**
     * Check whether the session has expired.
     * @return true if the session expired, false if not
     */
    public boolean isSessionExpired()
    {
        return System.currentTimeMillis() > this.sessionExpiry;
    }

    /**
     * Log in the user, comparing the entered password's hash against the user's password hash.
     * @param enteredHash the hash of the password entered by the user
     * @return true if successful, false if not
     */
    public boolean logIn(byte[] enteredHash)
    {
        if(Arrays.equals(this.passwordHash, enteredHash))
        {
            byte[] sessionIDBytes = new byte[32];
            SecureRandom secureRandom = new SecureRandom();
            secureRandom.nextBytes(sessionIDBytes);
            this.sessionID = Base64.getEncoder().encodeToString(sessionIDBytes);
            this.sessionExpiry = System.currentTimeMillis() + (30 * 60 * 1000);
            return true;
        }

        return false;
    }
}

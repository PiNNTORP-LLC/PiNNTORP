package com.pinntorp.server;

import java.io.FileReader;
import java.io.FileWriter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

public class UserStore
{
    public class UserFile
    {
        int nextPlayerID;
        List<UserFileEntry> users;
    }

    public class UserFileEntry
    {
        UserFileEntry(User user)
        {
            this.playerID = user.getPlayerID();
            this.username = user.getUsername();
            this.passwordHash = user.getPasswordHash();
            this.balance = user.getBalance();
            this.friends = user.getFriends();
            this.receivedFriendRequests = user.getReceivedFriendRequests();
            this.sentFriendRequests = user.getSentFriendRequests();
        }

        int playerID;
        String username;
        String passwordHash;
        double balance;
        Set<Integer> friends;
        Set<Integer> receivedFriendRequests;
        Set<Integer> sentFriendRequests;
    }

    private ConcurrentHashMap<Integer, User> users;
    private AtomicInteger nextPlayerID;

    public UserStore()
    {
        // Initialize users and player id sequence generator
        this.users = new ConcurrentHashMap<>();
        this.nextPlayerID = new AtomicInteger(1);
    }

    /**
     * Loads users from the "users.dat" file into the users hashmap.
     */
    public synchronized void loadUsers()
    {
        try
        {
            FileReader reader = new FileReader("./users.json");
            UserFile data = Json.GSON.fromJson(reader, UserFile.class);

            nextPlayerID.set(data.nextPlayerID);
            users.clear();
            for(UserFileEntry u : data.users)
            {
                users.put(u.playerID, new User(u.playerID, u.username, u.passwordHash, u.balance, u.friends, u.sentFriendRequests, u.receivedFriendRequests));
            }
        }
        catch(Exception e)
        {
            Console.log("UserStore", "Encountered " + e.getClass().getName() + " while attempting to read users from user file.\n" + e);
        }
    }

    /**
     * Saves users hashmap to the "users.dat" file.
     */
    public synchronized void saveUsers()
    {
        try
        {
            FileWriter writer = new FileWriter("./users.json");
            UserFile data = new UserFile();
            data.nextPlayerID = this.nextPlayerID.get();
            for(User user : this.users.values())
            {
                data.users.add(new UserFileEntry(user));
            }
            Json.GSON.toJson(data, writer);
            writer.close();
        }
        catch(Exception e)
        {
            Console.log("UserStore", "Encountered " + e.getClass().getName() + " while attempting to save users to users file.\n" + e);
        }
    }

    public User getUser(int id)
    {
        return this.users.get(id);
    }

    public User getUser(String username)
    {
        for(User user : this.users.values())
        {
            if(user.getUsername().equals(username))
            {
                return user;
            }
        }
        return null;
    }

    public User newUser(String username, String passwordHash)
    {
        int id = this.nextPlayerID.getAndIncrement();
        User user = new User(id, username, passwordHash);
        this.users.put(id, user);
        return user;
    }

    public User removeUser(int id)
    {
        return this.users.remove(id);
    }
}

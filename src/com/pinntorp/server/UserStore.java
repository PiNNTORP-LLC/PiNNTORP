package com.pinntorp.server;

import java.io.FileReader;
import java.io.FileWriter;
import java.util.Enumeration;
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
        UserFileEntry(int playerID, User user)
        {
            this.playerID = playerID;
            this.username = user.getUsername();
            this.passwordHash = user.getPassword();
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

    private final ConcurrentHashMap<Integer, User> users;
    private final AtomicInteger nextPlayerID;
    private final String userFilePath;

    public UserStore(String userFilePath)
    {
        // Initialize users and player id sequence generator
        this.users = new ConcurrentHashMap<>();
        this.nextPlayerID = new AtomicInteger(1);
        this.userFilePath = userFilePath;
    }

    /**
     * Loads users from the "users.dat" file into the users hashmap.
     */
    public synchronized void loadUsers()
    {
        try
        {
            FileReader reader = new FileReader(this.userFilePath);
            UserFile data = Json.GSON.fromJson(reader, UserFile.class);

            nextPlayerID.set(data.nextPlayerID);
            users.clear();
            for(UserFileEntry u : data.users)
            {
                users.put(u.playerID, new User(u.username, u.passwordHash, u.balance, u.friends, u.sentFriendRequests, u.receivedFriendRequests));
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
            this.users.forEach((Integer playerID, User user) -> {
                data.users.add(new UserFileEntry(playerID, user));
            });
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

    public int register(String username, String password)
    {
        int id = this.nextPlayerID.getAndIncrement();
        this.users.put(id, new User(username, password));
        return id;
    }

    public int login(String username, String password)
    {
        Enumeration<Integer> IDlist = this.users.keys();
        while(IDlist.hasMoreElements())
        {
            int id = IDlist.nextElement();
            User user = this.users.get(id);
            if(user.getUsername().equals(username) && user.getPassword().equals(password))
            {
                return id;
            }
        }
        return -1;
    }

    public boolean sendFriendRequest(int playerID, int friendID)
    {
        User sender = this.users.get(playerID);
        User receiver = this.users.get(friendID);
        if(sender != null && receiver != null)
        {
            sender.sendFriendRequest(friendID);
            receiver.receiveFriendRequest(playerID);
            return true;
        }
        return false;
    }

    public boolean acceptFriendRequest(int playerID, int friendID)
    {
        User player = this.users.get(playerID);
        User newFriend = this.users.get(friendID);
        if(player.acceptFriendRequest(friendID))
        {
            newFriend.cancelFriendRequest(playerID);
            return true;
        }
        return false;
    }

    public boolean declineFriendRequest(int playerID, int friendID)
    {
        User player = this.users.get(playerID);
        User pendingFriend = this.users.get(friendID);
        if(player.declineFriendRequest(friendID))
        {
            pendingFriend.cancelFriendRequest(playerID);
            return true;
        }
        return false;
    }

    public boolean cancelFriendRequest(int playerID, int friendID)
    {
        User player = this.users.get(playerID);
        User pendingFriend = this.users.get(friendID);
        if(player.cancelFriendRequest(friendID))
        {
            pendingFriend.declineFriendRequest(playerID);
            return true;
        }
        return false;
    }

    public boolean removeFriend(int playerID, int friendID)
    {
        User player = this.users.get(playerID);
        User oldFriend = this.users.get(friendID);
        return player.removeFriend(friendID) && oldFriend.removeFriend(playerID);
    }
}

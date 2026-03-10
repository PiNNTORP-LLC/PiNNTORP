package com.pinntorp.Server;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.concurrent.ConcurrentHashMap;

public class UserStore
{
    public class UserEntry
    {
        String username;
        byte[] passwordHash;
        double balance;
        String[] friends;
    }

    private ConcurrentHashMap<String, User> users;

    public UserStore()
    {
        this.users = new ConcurrentHashMap<>();
    }

    public void loadUsers()
    {
        try
        {
            String line;
            BufferedReader reader = new BufferedReader(new FileReader("./users.dat"));
            while((line = reader.readLine()) != null)
            {
                users.put();
            }
        }
        catch(Exception e)
        {
            Console.log("UserStore", "");
        }
    }

    public void saveUsers()
    {

    }

    public void addUser(String id, User user)
    {
        this.users.put(id, user);
    }

    public User removeUser(String id)
    {
        return this.users.remove(id);
    }
}

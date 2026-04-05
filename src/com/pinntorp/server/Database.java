package com.pinntorp.Server;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.Reader;
import java.io.Writer;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Database {
    private static final String DB_FILE = Env.get("DB_PATH", "data/users.json");
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    public static Map<String, UserData> users = new HashMap<>();

    public static class GameLog {
        public String gameName;
        public int profit;
        public long timestamp;
        public String metadata;

        public GameLog() {
        }
    }

    public static class UserData {
        public String username;
        public String role;
        public String salt;
        public String hash;
        public int gamesPlayed;
        public int wins;
        public int losses;
        public int profit;
        public List<String> friends = new ArrayList<>();
        public List<String> receivedFriendRequests = new ArrayList<>();
        public List<String> sentFriendRequests = new ArrayList<>();
        public List<GameLog> gameLogs = new ArrayList<>();

        public UserData(String username, String role, String salt, String hash) {
            this(username, role, salt, hash, 0, 0, 0, 0);
        }

        public UserData(String username, String role, String salt, String hash, int gamesPlayed, int wins, int losses, int profit) {
            this.username = username;
            this.role = role;
            this.salt = salt;
            this.hash = hash;
            this.gamesPlayed = gamesPlayed;
            this.wins = wins;
            this.losses = losses;
            this.profit = profit;
            this.friends = new ArrayList<>();
            this.receivedFriendRequests = new ArrayList<>();
            this.sentFriendRequests = new ArrayList<>();
            this.gameLogs = new ArrayList<>();
        }
    }

    public static void load() {
        File f = new File(DB_FILE);
        File parent = f.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }

        if (!f.exists()) {
            System.out.println("DB File missing (" + DB_FILE + "), starting a fresh empty database.");
            return;
        }

        try (Reader reader = new FileReader(f)) {
            Type type = new TypeToken<Map<String, UserData>>() {}.getType();
            Map<String, UserData> loadedData = gson.fromJson(reader, type);
            if (loadedData != null) {
                users = loadedData;
            }
        } catch (Exception e) {
            System.out.println("Failed to load JSON DB: " + e.getMessage());
        }
    }

    public static void save() {
        File f = new File(DB_FILE);
        File parent = f.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }

        try (Writer writer = new FileWriter(f)) {
            gson.toJson(users, writer);
        } catch (Exception e) {
            System.out.println("Failed to save JSON DB: " + e.getMessage());
        }
    }
}

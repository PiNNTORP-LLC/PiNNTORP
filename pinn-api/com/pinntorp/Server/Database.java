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

/**
 * Super lightweight JSON Database manager for users, powered by Gson.
 */
public class Database {
    private static final String DB_FILE = "users.json";
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    // In-memory cache of users: Username -> UserData
    public static Map<String, UserData> users = new HashMap<>();

    public static class GameLog {
        public String gameName;
        public int profit;
        public long timestamp;
        public String metadata; // e.g. "Guessed 2, Rolled 4"

        public GameLog() {
        } // Empty constructor for Gson

        public GameLog(String gameName, int profit, long timestamp, String metadata) {
            this.gameName = gameName;
            this.profit = profit;
            this.timestamp = timestamp;
            this.metadata = metadata;
        }
    }

    public static class UserData {
        public String username;
        public String role; // "admin" or "user"
        public String salt; // Base64 Secure Random
        public String hash; // Base64 SHA-256 Hash

        // High-Level Statistics
        public int gamesPlayed;
        public int wins;
        public int losses;
        public int profit;

        // Social Features
        public List<String> friends = new ArrayList<>();

        // Game Logs
        public List<GameLog> gameLogs = new ArrayList<>();

        public UserData(String username, String role, String salt, String hash) {
            this(username, role, salt, hash, 0, 0, 0, 0);
        }

        public UserData(String username, String role, String salt, String hash, int gamesPlayed, int wins, int losses,
                int profit) {
            this.username = username;
            this.role = role;
            this.salt = salt;
            this.hash = hash;
            this.gamesPlayed = gamesPlayed;
            this.wins = wins;
            this.losses = losses;
            this.profit = profit;
            this.friends = new ArrayList<>();
            this.gameLogs = new ArrayList<>();
        }

        public String toJson() {
            // For endpoints that return UserData (though now we can just return the object
            // and let the router format it!)
            return gson.toJson(this);
        }
    }

    public static void load() {
        File f = new File(DB_FILE);
        if (!f.exists()) {
            System.out.println("DB File missing, starting a fresh empty database.");
            return;
        }

        try (Reader reader = new FileReader(f)) {
            Type type = new TypeToken<Map<String, UserData>>() {
            }.getType();
            Map<String, UserData> loadedData = gson.fromJson(reader, type);
            if (loadedData != null) {
                users = loadedData;
            }
            System.out.println("Database initialized. Loaded " + users.size() + " users.");
        } catch (Exception e) {
            System.out.println("Failed to load JSON DB: " + e.getMessage());
        }
    }

    public static void save() {
        try (Writer writer = new FileWriter(DB_FILE)) {
            gson.toJson(users, writer);
        } catch (Exception e) {
            System.out.println("Failed to save JSON DB: " + e.getMessage());
        }
    }
}

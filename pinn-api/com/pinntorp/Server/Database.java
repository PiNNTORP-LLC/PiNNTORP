package com.pinntorp.Server;

import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.HashMap;
import java.util.Map;
import java.io.BufferedReader;
import java.io.BufferedWriter;

/**
 * Super lightweight JSON Database manager for users & roles.
 */
public class Database {
    private static final String DB_FILE = "users.json";

    // In-memory cache of users: Username -> UserData
    public static Map<String, UserData> users = new HashMap<>();

    public static class UserData {
        public String username;
        public String role; // "admin" or "user"
        public String salt; // Base64 Secure Random
        public String hash; // Base64 SHA-256 Hash

        public UserData(String username, String role, String salt, String hash) {
            this.username = username;
            this.role = role;
            this.salt = salt;
            this.hash = hash;
        }

        public String toJson() {
            return String.format(
                    "{\"username\":\"%s\", \"role\":\"%s\", \"salt\":\"%s\", \"hash\":\"%s\"}",
                    username, role, salt, hash);
        }
    }

    public static void load() {
        File f = new File(DB_FILE);
        if (!f.exists()) {
            Console.log("DB File missing, starting a fresh empty database.");
            return;
        }

        try (BufferedReader reader = new BufferedReader(new FileReader(f))) {
            StringBuilder jsonStr = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null)
                jsonStr.append(line);

            String content = jsonStr.toString().trim();
            if (content.isEmpty() || content.equals("{}"))
                return;

            // Very rudimentary manual string-based JSON Parsing because we don't have
            // Jackson
            // Expected format: { "username": {"username": "str", "role": "str", "salt":
            // "str", "hash": "str"}, ... }
            content = content.substring(1, content.length() - 1); // remove outer keys
            String[] userBlocks = content.split("},");

            for (String block : userBlocks) {
                if (!block.endsWith("}"))
                    block += "}"; // Repair ending bracket from split

                String username = extractJsonVal(block, "username");
                String role = extractJsonVal(block, "role");
                String salt = extractJsonVal(block, "salt");
                String hash = extractJsonVal(block, "hash");

                if (username != null) {
                    users.put(username, new UserData(username, role, salt, hash));
                }
            }
            Console.log("Database initialized. Loaded " + users.size() + " users.");
        } catch (Exception e) {
            Console.log("Failed to load JSON DB: " + e.getMessage());
        }
    }

    public static void save() {
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(DB_FILE))) {
            StringBuilder sb = new StringBuilder();
            sb.append("{\n");

            int count = 0;
            for (UserData data : users.values()) {
                sb.append("  \"").append(data.username).append("\": ");
                sb.append(data.toJson());
                if (++count < users.size()) {
                    sb.append(",");
                }
                sb.append("\n");
            }

            sb.append("}");
            writer.write(sb.toString());
        } catch (Exception e) {
            Console.log("Failed to save JSON DB: " + e.getMessage());
        }
    }

    private static String extractJsonVal(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1)
            return null;
        start += search.length();
        int end = json.indexOf("\"", start);
        return json.substring(start, end);
    }
}

package com.pinntorp.server;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.HashMap;
import java.util.Map;

/**
 * A basic environment variable loader for .env files
 */
public class Env {
    private static final Map<String, String> vars = new HashMap<>();

    public static void load(String rootDir) {
        try {
            File envFile = new File(rootDir + "/.env");
            if (!envFile.exists()) {
                Console.log("Notice: No .env file found at " + envFile.getAbsolutePath());
                return;
            }

            try (BufferedReader br = new BufferedReader(new FileReader(envFile))) {
                String line;
                while ((line = br.readLine()) != null) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }

                    int equalsIdx = line.indexOf("=");
                    if (equalsIdx > 0) {
                        String key = line.substring(0, equalsIdx).trim();
                        String value = line.substring(equalsIdx + 1).trim();
                        // Remove surrounding quotes if they exist
                        if (value.startsWith("\"") && value.endsWith("\"") && value.length() > 1) {
                            value = value.substring(1, value.length() - 1);
                        } else if (value.startsWith("'") && value.endsWith("'") && value.length() > 1) {
                            value = value.substring(1, value.length() - 1);
                        }
                        vars.put(key, value);
                    }
                }
            }
            // Console.log("Loaded " + vars.size() + " environment variables from .env");

        } catch (Exception e) {
            Console.log("Failed to load .env file: " + e.getMessage());
        }
    }

    public static String get(String key) {
        // give precedence to system env vars
        String sysVar = System.getenv(key);
        if (sysVar != null && !sysVar.isEmpty()) {
            return sysVar;
        }
        return vars.get(key);
    }

    public static String get(String key, String defaultValue) {
        String val = get(key);
        return val != null ? val : defaultValue;
    }
}

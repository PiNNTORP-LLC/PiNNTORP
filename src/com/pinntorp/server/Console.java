package com.pinntorp.server;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * This class implements a simple wrapper for console logging.
 */
public class Console {

    public static void log(String message) {
        String timestamp = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        System.out.println("[" + timestamp + "] " + message);
    }

    public static void log(String source, String message) {
        String timestamp = LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        System.out.println("[" + timestamp + "] [" + source + "] " + message);
    }
}

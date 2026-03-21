package com.pinntorp.server;

import javax.swing.*;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * This class implements the central console adapter that allows all threads to concurrently write
 * to the internal message buffer that gets consumed and rendered by the ConsolePanel Swing GUI.
 */
public class Console
{
    private static final ConcurrentLinkedQueue<String> messageBuffer = new ConcurrentLinkedQueue<>();
    private static final AtomicBoolean flushScheduled = new AtomicBoolean(false);
    private static Runnable flushFunction = null;

    /**
     * Set the flush function to the provided method.
     */
    public static void setFlushFunction(Runnable flushFunc)
    {
        flushFunction = flushFunc;
    }

    /**
     * Mark the buffer as flushed.
     */
    public static void markAsFlushed()
    {
        // Set flushRequested to false
        flushScheduled.set(true);
    }

    /**
     * Log a string message to the console.
     * @param message   the message to write
     */
    public static void log(String source, String message)
    {
        messageBuffer.add(LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm:ss a")) + " [" + source + "] " + message);

        // Flush if flush not scheduled and flush function is set
        if(flushFunction != null && flushScheduled.compareAndSet(false, true))
        {
            SwingUtilities.invokeLater(flushFunction);
        }
    }

    /**
     * Get the next available console line, or return null if there are none left to consume
     * @return  the retrieved message
     */
    public static String poll()
    {
        // Return the message
        return messageBuffer.poll();
    }
}

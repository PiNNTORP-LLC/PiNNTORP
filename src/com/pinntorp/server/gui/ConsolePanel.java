package com.pinntorp.server.gui;

import com.pinntorp.server.Console;

import javax.swing.*;
import java.awt.*;

/**
 * This class implements the Console tab of the server management window.
 *
 * The console should act as the main server console.
 */
public class ConsolePanel extends JPanel
{
    private JTextArea consoleText;

    public ConsolePanel()
    {
        // Initialize the panel with BorderLayout
        super(new BorderLayout());

        // Create and configure GUI components
        this.consoleText = new JTextArea();
        this.consoleText.setEditable(false);
        JScrollPane consoleScroll = new JScrollPane(this.consoleText);
        consoleScroll.setAutoscrolls(true);

        // Add GUI components
        this.add(consoleScroll, BorderLayout.CENTER);

        // Hook up flush function to the console
        Console.setFlushFunction(this::updateConsole);
    }

    /**
     * Append all new output to the console text area
     */
    public void updateConsole()
    {
        // Read through console message by message and flush to the console text area
        String message;
        while((message = Console.poll()) != null)
        {
            this.consoleText.append(message + "\n");
        }
        Console.markAsFlushed();
    }
}

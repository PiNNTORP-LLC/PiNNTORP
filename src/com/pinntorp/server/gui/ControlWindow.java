package com.pinntorp.server.gui;

import com.pinntorp.server.Main;
import com.pinntorp.server.ServerController;

import javax.swing.*;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

/**
 * This class implements the Swing GUI window for managing and monitoring the server.
 */
public class ControlWindow extends JFrame
{
    private final ServerController serverController;

    public ControlWindow(ServerController serverController)
    {
        // Configure frame
        super("PiNNTORP Server");
        this.setMinimumSize(new Dimension(400, 300));

        // Set server controller
        this.serverController = serverController;

        // Clean up on close
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        this.addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                // Close the frame, shutdown the server
                super.windowClosing(e);
                serverController.shutdown();
            }
        });

        // Create GUI components
        JTabbedPane tabbedPane = new JTabbedPane();
        ConsolePanel consolePanel = new ConsolePanel();
        BrowserPanel browserPanel = new BrowserPanel();
        InspectorPanel inspectorPanel = new InspectorPanel();

        // Add and configure GUI components
        tabbedPane.addTab("Console", consolePanel);
        tabbedPane.addTab("Browser", browserPanel);
        tabbedPane.addTab("Inspector", inspectorPanel);
        this.add(tabbedPane);
    }
}

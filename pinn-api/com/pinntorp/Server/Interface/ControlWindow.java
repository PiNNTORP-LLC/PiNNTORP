package com.pinntorp.Server.Interface;

import com.pinntorp.Server.Main;

import javax.swing.*;
import java.awt.*;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;

/**
 * This class implements the Swing GUI window for managing and monitoring the server.
 */
public class ControlWindow extends JFrame
{
    public ControlWindow()
    {
        // Configure frame
        super("PiNNTORP Server");
        this.setMinimumSize(new Dimension(400, 300));

        // Clean up on close
        this.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        this.addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                // Perform clean-up
                Main.clean();

                // Close the frame, exit the application
                super.windowClosing(e);
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

        // Show frame
        this.setVisible(true);
    }
}

package com.pinntorp.Server;

import com.pinntorp.Server.Interface.ControlWindow;

/**
 * This class serves as an entrypoint
 */
public class Main
{
    // Entrypoint
    public static void main(String[] args)
    {
        // Create the server management window
        ControlWindow controller = new ControlWindow();

    }

    /**
     * Cleans up resources that need it.
     * Called by ControlWindow when it's closing to clean up on exit.
     */
    public static void clean()
    {

    }
}

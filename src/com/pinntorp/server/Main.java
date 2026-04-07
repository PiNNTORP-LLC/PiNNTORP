package com.pinntorp.server;

import com.pinntorp.server.websockets.CustomWsServer;

/**
 * This class serves as an entrypoint
 */
public class Main
{
    private static CustomWsServer server;

    // Entrypoint
    public static void main(String[] args)
    {
        String webRoot = System.getProperty("user.dir");
        int port = 8080;

        Env.load(webRoot);

        try {
            String portEnv = Env.get("PORT", "8080");
            port = Integer.parseInt(portEnv);
        } catch (NumberFormatException e) {
            Console.log("Main", "Notice: Invalid PORT in .env, defaulting to 8080");
        }

        try {
            Console.log("Main", "Starting unified HTTP & WebSocket server on port ~" + port + "~...");
            Database.load();

            server = new CustomWsServer(port, webRoot);
            server.start();

            Console.log("Main", "Server is running at http://localhost:" + port + "/");
        } catch (Exception e) {
            Console.log("Main", "Failed to start server: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public static void clean()
    {
        if (server != null) {
            server.requestStop();
        }
    }
}

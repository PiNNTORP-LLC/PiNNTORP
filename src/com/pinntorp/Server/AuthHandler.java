package com.pinntorp.Server;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class AuthHandler implements HttpHandler
{
    public class AuthRequest
    {
        String username;
        String password;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException
    {
        // Consume request body
        String bodyText = "";
        String line;
        BufferedReader bodyReader = new BufferedReader(new InputStreamReader(exchange.getRequestBody()));
        while((line = bodyReader.readLine()) != null)
        {
            bodyText += line;
        }

        // Check if it's the right method for the endpoint
        if(exchange.getRequestMethod().equals("POST"))
        {
            try
            {
                AuthRequest request = Json.GSON.fromJson(bodyText, AuthRequest.class);
            }
            catch(Exception e)
            {
                Console.log("AuthHandler", "");
            }
        }
    }
}

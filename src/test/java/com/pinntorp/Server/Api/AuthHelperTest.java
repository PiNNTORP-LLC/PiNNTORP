package com.pinntorp.server.Api;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class AuthHelperTest {

    @Test
    public void testSaltGeneration() {
        String salt = AuthHelper.generateSalt();
        assertNotNull(salt, "Salt should not be null");
        assertTrue(salt.length() > 0, "Salt should not be empty");
    }

    @Test
    public void testPasswordHashing() {
        String password = "mySecretPassword123";
        String salt = AuthHelper.generateSalt();
        String hash = AuthHelper.hashPassword(password, salt);
        
        assertNotNull(hash, "Hash should not be null");
        
        // Verify with correct password
        assertTrue(AuthHelper.verifyPassword(password, salt, hash), "Password should verify correctly");
        
        // Verify with incorrect password
        assertFalse(AuthHelper.verifyPassword("wrongPassword", salt, hash), "Incorrect password should fail verification");
    }

    @Test
    public void testJWTGenerationAndValidation() {
        String username = "testUser";
        String role = "admin";
        
        String jwt = AuthHelper.generateJWT(username, role);
        assertNotNull(jwt, "JWT should not be null");
        
        String extractedUsername = AuthHelper.validateJWTAndGetUsername(jwt);
        assertEquals(username, extractedUsername, "Extracted username should match the original");
        
        // Test invalid token
        assertNull(AuthHelper.validateJWTAndGetUsername(jwt + "invalidSign"), "Invalid token should return null");
    }
}

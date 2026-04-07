package com.pinntorp.server.Api;

import com.pinntorp.server.Env;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class AuthHelper {

    // JWT Secret Key (In production, this should not be hardcoded!)
    private static String getSecret() {
        return Env.get("JWT_SECRET", "fallback_secret_pinntorp_key_xyz");
    }

    /**
     * Generates a 16-byte cryptographically secure random salt and returns as
     * Base64.
     */
    public static String generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[16];
        random.nextBytes(salt);
        return Base64.getEncoder().encodeToString(salt);
    }

    /**
     * Hashes a password + salt using SHA-256 and returns as Base64.
     */
    public static String hashPassword(String password, String base64Salt) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(Base64.getDecoder().decode(base64Salt));
            byte[] hashedPassword = md.digest(password.getBytes("UTF-8"));
            return Base64.getEncoder().encodeToString(hashedPassword);
        } catch (Exception e) {
            throw new RuntimeException("Error hashing password", e);
        }
    }

    /**
     * Validates if a raw password matches the stored hash+salt.
     */
    public static boolean verifyPassword(String rawPassword, String base64Salt, String base64Hash) {
        return hashPassword(rawPassword, base64Salt).equals(base64Hash);
    }

    /**
     * Generates a simple Signed JWT-like token.
     * Format: Base64Url(Header).Base64Url(Payload).Signature
     */
    public static String generateJWT(String username, String role) {
        try {
            // 1. Header {"alg":"HS256","typ":"JWT"}
            String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
            String headerB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(headerJson.getBytes("UTF-8"));

            // 2. Payload {"sub":"username", "role":"role"}
            String payloadJson = "{\"sub\":\"" + username + "\", \"role\":\"" + role + "\"}";
            String payloadB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(payloadJson.getBytes("UTF-8"));

            // 3. Signature
            String toSign = headerB64 + "." + payloadB64;
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(getSecret().getBytes("UTF-8"), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] signatureBytes = mac.doFinal(toSign.getBytes("UTF-8"));
            String signatureB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(signatureBytes);

            return toSign + "." + signatureB64;

        } catch (Exception e) {
            throw new RuntimeException("Error generating JWT", e);
        }
    }

    /**
     * Validates JWT token and returns username if valid, otherwise null.
     */
    public static String validateJWTAndGetUsername(String token) {
        if (token == null) return null;

        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) return null;

            // Recreate signature
            String toSign = parts[0] + "." + parts[1];
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(getSecret().getBytes("UTF-8"), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] expectedSignatureBytes = mac.doFinal(toSign.getBytes("UTF-8"));
            String expectedSignatureB64 = Base64.getUrlEncoder().withoutPadding().encodeToString(expectedSignatureBytes);
            if (!parts[2].equals(expectedSignatureB64)) return null;

            // Decode payload to extract subject (username)
            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), "UTF-8");

            // Extract the username out of JSON natively
            String searchStr = "\"sub\":\"";
            int startIdx = payloadJson.indexOf(searchStr);
            if (startIdx == -1) return null;
            startIdx += searchStr.length();
            int endIdx = payloadJson.indexOf("\"", startIdx);
            return payloadJson.substring(startIdx, endIdx);

        } catch (Exception e) {
            return null;
        }
    }
}

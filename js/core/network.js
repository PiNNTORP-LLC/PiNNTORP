const API_BASE_URL = globalThis.localStorage?.getItem("pinntorp_api_base") || "http://localhost:8080";

/**
* MODULE: Core System (network.js)
*-------------------------------------------------------
* Purpose: Helper functions for making backend API requests (HTTP and WebSocket)
*/

// Check whether the browser has a backend session token
export function hasBackendSession() {
    return !!globalThis.localStorage?.getItem("jwt");
}

// Attach the JWT when one is available
export function getAuthHeaders(extraHeaders = {}) {
    const token = globalThis.localStorage?.getItem("jwt");
    if (!token) {
        return { ...extraHeaders };
    }
    return { ...extraHeaders, Authorization: `Bearer ${token}` };
}

// Send a JSON request to the backend and return the parsed response
export async function requestJson(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || `Request failed: ${response.status}`);
    }

    return data;
}

// Initialize WebSocket connection
export function initNetwork() {
    const token = localStorage.getItem("jwt");
    // Connect WebSocket securely by passing the JWT as a query parameter
    const url = token ? `ws://localhost:8080?token=${token}` : "ws://localhost:8080";
    const ws = new WebSocket(url);

    ws.onopen = () => {
        console.log("Connected to PiNNTORP WebSocket Server!");
        ws.send("Hello from frontend!");
    };

    ws.onmessage = (event) => {
        console.log("Message received from server:", event.data);
    };

    ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };

    ws.onclose = (event) => {
        console.log("WebSocket connection closed.", event);
    };

    return ws;
}

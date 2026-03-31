const API_BASE_URL = globalThis.localStorage?.getItem("pinntorp_api_base") || "http://localhost:8080";

/**
* MODULE: Core System (network.js)
*-------------------------------------------------------
* Purpose: Helper functions for making backend API requests
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

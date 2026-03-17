export function initNetwork() {
    const token = localStorage.getItem("jwt");
    // Connect WebSocket securely by passing the JWT as a query parameter or similar approach
    const url = token ? `ws://localhost:8080?token=${token}` : "ws://localhost:8080";
    const ws = new WebSocket(url);

    ws.onopen = () => {
        console.log("Connected to PiNNTORP WebSocket Server!");
        // Example: send a simple string message to test
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

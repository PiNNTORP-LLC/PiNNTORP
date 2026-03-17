export function initNetwork() {
    const ws = new WebSocket("ws://localhost:8080");

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

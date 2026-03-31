import { state } from "../../core/state.js";

let ws = null;
export let onMessageCb = null;

export function setMessageHandler(cb) {
    onMessageCb = cb;
}

export function connectMultiplayer() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(`${protocol}//${window.location.host}/`);
    
    ws.onopen = () => {
        const username = state.currentUser || "Guest";
        ws.send(JSON.stringify({ action: "JOIN", username }));
    };

    ws.onmessage = (e) => {
        try {
            const payload = JSON.parse(e.data);
            if (onMessageCb) onMessageCb(payload);
        } catch(err) {}
    };
}

export function sendBet(amount) {
    if (ws) ws.send(JSON.stringify({ action: "BET", amount }));
}

export function sendHit() {
    if (ws) ws.send(JSON.stringify({ action: "HIT" }));
}

export function sendStand() {
    if (ws) ws.send(JSON.stringify({ action: "STAND" }));
}

export const blackjackApi = { connectMultiplayer, setMessageHandler, sendBet, sendHit, sendStand };

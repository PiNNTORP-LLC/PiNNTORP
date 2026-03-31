const SESSION_API = "http://localhost:5500";
const SESSION_TIMEOUT_MS = 3000;

/**
* MODULE: Core System (auth.js)
*-------------------------------------------------------
* Purpose: Handles Login, logout, and session tokens
*/

function makeAbortSignal(timeoutMs) {
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
        return AbortSignal.timeout(timeoutMs);
    }

    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
}

async function sessionPost(path, body) {
    try {
        const res = await fetch(`${SESSION_API}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: makeAbortSignal(SESSION_TIMEOUT_MS)
        });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}

export function isLoggedIn() {
    return !!localStorage.getItem("pinnSessionId");
}

export function getSession() {
    return {
        sessionId: localStorage.getItem("pinnSessionId") || "",
        playerId:  Number(localStorage.getItem("pinnPlayerId") || 0),
        username:  localStorage.getItem("pinnUsername") || ""
    };
}

function storeSession(data, username) {
    localStorage.setItem("pinnSessionId", data.sessionID);
    localStorage.setItem("pinnPlayerId",  String(data.playerID));
    localStorage.setItem("pinnUsername",   username);
}

function clearSession() {
    ["pinnSessionId", "pinnPlayerId", "pinnUsername"].forEach(k => localStorage.removeItem(k));
}

export async function loginUser(username, password) {
    const data = await sessionPost("/login", { action: "login", username, password });
    if (data?.success) storeSession(data, username);
    return data;
}

export async function registerUser(username, password) {
    const data = await sessionPost("/login", { action: "register", username, password });
    if (data?.success) storeSession(data, username);
    return data;
}

export async function logoutUser() {
    const { sessionId } = getSession();
    if (sessionId) {
        await sessionPost("/login", { action: "logout", sessionID: sessionId });
    }
    clearSession();
}

export function initAuthUI() {
    _renderHeaderChip();
    _applyAuthPanelState();
    _initAuthForms();
}

function _renderHeaderChip() {
    const headerMeta = document.querySelector(".header-meta");
    if (!headerMeta) return;

    const existing = headerMeta.querySelector(".auth-chip");
    if (existing) existing.remove();

    const balanceChip = headerMeta.querySelector(".balance-chip");
    if (balanceChip) {
        balanceChip.classList.toggle("hidden", !isLoggedIn());
    }

    const chip = document.createElement("div");
    chip.className = "auth-chip";

    if (isLoggedIn()) {
        const { username } = getSession();
        const nameEl = document.createElement("span");
        nameEl.className = "auth-username";
        nameEl.textContent = username;

        const logoutBtn = document.createElement("button");
        logoutBtn.type = "button";
        logoutBtn.className = "auth-logout-btn";
        logoutBtn.textContent = "Logout";
        logoutBtn.addEventListener("click", async () => {
            logoutBtn.disabled = true;
            await logoutUser();
            window.location.reload();
        });

        chip.appendChild(nameEl);
        chip.appendChild(logoutBtn);
    } else {
        const loginLink = document.createElement("a");
        loginLink.href = "index.html";
        loginLink.className = "auth-login-link";
        loginLink.textContent = "Log In";
        chip.appendChild(loginLink);
    }

    if (balanceChip) {
        balanceChip.insertAdjacentElement("afterend", chip);
    } else {
        headerMeta.prepend(chip);
    }
}

function _applyAuthPanelState() {
    const panel = document.getElementById("auth-panel");
    if (!panel) return;
    panel.classList.toggle("hidden", isLoggedIn());
}

function _initAuthForms() {
    const loginForm      = document.getElementById("login-form");
    const registerForm   = document.getElementById("register-form");
    const authMessage    = document.getElementById("auth-message");
    const loginContainer = document.getElementById("login-container");
    const regContainer   = document.getElementById("register-container");
    const goToSignup     = document.getElementById("go-to-signup");
    const goToLogin      = document.getElementById("go-to-login");

    if (!loginForm) return;

    goToSignup?.addEventListener("click", () => {
        loginContainer.classList.add("auth-panel-hidden");
        regContainer.classList.remove("auth-panel-hidden");
        if (authMessage) authMessage.textContent = "";
    });

    goToLogin?.addEventListener("click", () => {
        regContainer.classList.add("auth-panel-hidden");
        loginContainer.classList.remove("auth-panel-hidden");
        if (authMessage) authMessage.textContent = "";
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (authMessage) authMessage.textContent = "Logging in...";
        const data = await loginUser(
            loginForm.username.value.trim(),
            loginForm.password.value
        );
        if (data?.success) {
            window.location.reload();
        } else {
            if (authMessage) {
                authMessage.textContent = data
                    ? "Invalid username or password."
                    : "Could not connect to server.";
            }
        }
    });

    registerForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (authMessage) authMessage.textContent = "Creating account...";
        const data = await registerUser(
            registerForm.username.value.trim(),
            registerForm.password.value
        );
        if (data?.success) {
            window.location.reload();
        } else {
            if (authMessage) {
                authMessage.textContent = data
                    ? "Username already taken."
                    : "Could not connect to server.";
            }
        }
    });
}

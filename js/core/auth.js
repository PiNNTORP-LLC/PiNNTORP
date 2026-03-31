const API_BASE_URL = "http://localhost:8080";

/**
* MODULE: Core System (auth.js)
*-------------------------------------------------------
* Purpose: Handles Login, logout, and JWT session tokens
*/

export function isLoggedIn() {
    return !!localStorage.getItem("jwt");
}

export function getSession() {
    const token = localStorage.getItem("jwt");
    if (!token) return { username: "" };

    try {
        const payloadStr = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadStr);
        return {
            username: payload.sub || "",
            role: payload.role || "user"
        };
    } catch (e) {
        return { username: "" };
    }
}

export async function loginUser(username, password) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.status === "success") {
            localStorage.setItem("jwt", data.token);
            return { success: true };
        }
        return { success: false, message: data.message };
    } catch (err) {
        return { success: false, message: "Connection error." };
    }
}

export async function registerUser(username, password) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role: "user" })
        });
        const data = await res.json();
        return { success: data.status === "success", message: data.message };
    } catch (err) {
        return { success: false, message: "Connection error." };
    }
}

export function logoutUser() {
    localStorage.removeItem("jwt");
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
        logoutBtn.addEventListener("click", () => {
            logoutUser();
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
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const authMessage = document.getElementById("auth-message");
    const loginContainer = document.getElementById("login-container");
    const regContainer = document.getElementById("register-container");
    const goToSignup = document.getElementById("go-to-signup");
    const goToLogin = document.getElementById("go-to-login");

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
        if (data.success) {
            window.location.reload();
        } else {
            if (authMessage) {
                authMessage.textContent = data.message || "Invalid username or password.";
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
        if (data.success) {
            authMessage.textContent = "Registered! Please log in.";
            // Switch to login view
            regContainer.classList.add("auth-panel-hidden");
            loginContainer.classList.remove("auth-panel-hidden");
        } else {
            if (authMessage) {
                authMessage.textContent = data.message || "Username already taken.";
            }
        }
    });
}

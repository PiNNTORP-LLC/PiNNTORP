const API_BASE_URL = "http://localhost:8080";
const FRIENDS_API_BASE_URL = "http://localhost:5500";
const FRIENDS_SESSION_KEY = "friendsSession";

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
    const friendsSession = readFriendsSession();
    if (!token) {
        return {
            username: "",
            sessionId: friendsSession?.sessionID || "",
            playerId: friendsSession?.playerID || 0
        };
    }

    try {
        const payloadStr = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadStr);
        return {
            username: payload.sub || "",
            role: payload.role || "user",
            sessionId: friendsSession?.sessionID || "",
            playerId: friendsSession?.playerID || 0
        };
    } catch (e) {
        return {
            username: "",
            sessionId: friendsSession?.sessionID || "",
            playerId: friendsSession?.playerID || 0
        };
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
            await ensureFriendsAccountSession(username, password);
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
        if (data.status === "success") {
            await ensureFriendsAccountSession(username, password);
        }
        return { success: data.status === "success", message: data.message };
    } catch (err) {
        return { success: false, message: "Connection error." };
    }
}

export function logoutUser() {
    localStorage.removeItem("jwt");
    localStorage.removeItem(FRIENDS_SESSION_KEY);
}

export function initAuthUI() {
    _renderHeaderChip();
    _applyAuthPanelState();
    _initAuthForms();
}

const _ICON_USER = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const _ICON_LOGOUT = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;

function _renderHeaderChip() {
    const headerMeta = document.querySelector(".header-meta");
    if (!headerMeta) {
        return;
    }

    const existing = headerMeta.querySelector(".auth-chip");
    if (existing) {
        existing.remove();
    }

    const balanceChip = headerMeta.querySelector(".balance-chip");
    if (balanceChip) {
        balanceChip.classList.toggle("hidden", !isLoggedIn());
    }

    const chip = document.createElement("div");
    chip.className = "auth-chip";

    if (isLoggedIn()) {
        const { username } = getSession();
        const initial = (username[0] || "?").toUpperCase();

        chip.innerHTML = `
            <div class="hu-wrap">
                <button type="button" class="hu-btn" aria-label="User menu" aria-expanded="false">
                    <span class="hu-initial">${initial}</span>
                </button>
                <div class="hu-dropdown">
                    <div class="hu-dropdown-header">
                        <span class="hu-dropdown-name">${username}</span>
                    </div>
                    <a href="profile.html" class="hu-dropdown-item">
                        ${_ICON_USER}<span>Profile</span>
                    </a>
                    <button type="button" class="hu-dropdown-item hu-dropdown-item--danger" id="hu-logout-btn">
                        ${_ICON_LOGOUT}<span>Log Out</span>
                    </button>
                </div>
            </div>`;

        const wrap = chip.querySelector(".hu-wrap");
        const btn = chip.querySelector(".hu-btn");
        const logout = chip.querySelector("#hu-logout-btn");

        btn.addEventListener("click", e => {
            e.stopPropagation();
            const open = wrap.classList.toggle("is-open");
            btn.setAttribute("aria-expanded", open);
        });

        document.addEventListener("click", () => {
            wrap.classList.remove("is-open");
            btn.setAttribute("aria-expanded", false);
        });

        document.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                wrap.classList.remove("is-open");
                btn.setAttribute("aria-expanded", false);
            }
        });

        logout.addEventListener("click", () => { logoutUser(); window.location.reload(); });

    } else {
        chip.innerHTML = `
            <a href="login.html" class="hu-btn hu-btn--guest" aria-label="Log in">
                ${_ICON_USER}
            </a>`;
    }

    if (balanceChip) {
        balanceChip.insertAdjacentElement("afterend", chip);
    } else {
        headerMeta.prepend(chip);
    }
}

function _applyAuthPanelState() {
    const panel = document.getElementById("auth-panel");
    if (!panel) {
        return;
    }

    // On the dedicated login page, redirect to home if already authenticated
    const _isLoginPage = window.location.pathname.split('/').pop() === 'login.html';
    if (isLoggedIn() && _isLoginPage) {
        window.location.replace('index.html');
        return;
    }

    panel.classList.toggle("hidden", isLoggedIn());

    // If arriving via #signup link, skip straight to the register form
    if (!isLoggedIn() && window.location.hash === "#signup") {
        const loginContainer = document.getElementById("login-container");
        const regContainer = document.getElementById("register-container");
        loginContainer?.classList.add("auth-panel-hidden");
        regContainer?.classList.remove("auth-panel-hidden");
    }
}

function _initAuthForms() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const authMessage = document.getElementById("auth-message");
    const loginContainer = document.getElementById("login-container");
    const regContainer = document.getElementById("register-container");
    const goToSignup = document.getElementById("go-to-signup");
    const goToLogin = document.getElementById("go-to-login");

    if (!loginForm) {
        return;
    }

    goToSignup?.addEventListener("click", () => {
        loginContainer.classList.add("auth-panel-hidden");
        regContainer.classList.remove("auth-panel-hidden");
        if (authMessage) {
            authMessage.textContent = "";
        }
    });

    goToLogin?.addEventListener("click", () => {
        regContainer.classList.add("auth-panel-hidden");
        loginContainer.classList.remove("auth-panel-hidden");
        if (authMessage) {
            authMessage.textContent = "";
        }
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (authMessage) {
            authMessage.textContent = "Logging in...";
        }
        const data = await loginUser(
            loginForm.username.value.trim(),
            loginForm.password.value
        );
        if (data.success) {
            const _page = window.location.pathname.split('/').pop();
            if (_page === 'login.html') {
                window.location.replace('index.html');
            } else {
                window.location.reload();
            }
        } else {
            if (authMessage) {
                authMessage.textContent = data.message || "Invalid username or password.";
            }
        }
    });

    const regUsernameInput = document.getElementById("reg-username-input");
    const regUsernameError = document.getElementById("reg-username-error");

    // Clear the inline error as soon as the user edits the username field
    regUsernameInput?.addEventListener("input", () => {
        regUsernameInput.classList.remove("auth-input--error");
        regUsernameError?.classList.remove("is-visible");
    });

    registerForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (authMessage) {
            authMessage.textContent = "";
        }
        const submitBtn = registerForm.querySelector(".auth-submit-btn");
        if (submitBtn) {
            submitBtn.disabled = true;
        }

        const data = await registerUser(
            registerForm.username.value.trim(),
            registerForm.password.value
        );

        if (submitBtn) {
            submitBtn.disabled = false;
        }

        if (data.success) {
            if (authMessage) {
                authMessage.textContent = "Account created! Please log in.";
            }
            regContainer.classList.add("auth-panel-hidden");
            loginContainer.classList.remove("auth-panel-hidden");
        } else {
            // Show inline error on the username field
            regUsernameInput?.classList.add("auth-input--error");
            if (regUsernameError) {
                regUsernameError.textContent = data.message === "User already exists."
                    ? "Username already taken!"
                    : (data.message || "Registration failed.");
                regUsernameError.classList.add("is-visible");
            }
            regUsernameInput?.focus();
        }
    });
}

function readFriendsSession() {
    try {
        const raw = localStorage.getItem(FRIENDS_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        return null;
    }
}

function writeFriendsSession(session) {
    if (!session?.sessionID || !session?.playerID) {
        return;
    }
    localStorage.setItem(FRIENDS_SESSION_KEY, JSON.stringify({
        sessionID: session.sessionID,
        playerID: session.playerID
    }));
}

async function friendsAuth(action, username, password) {
    try {
        const res = await fetch(`${FRIENDS_API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, username, password })
        });
        if (!res.ok) {
            return null;
        }
        return await res.json();
    } catch (error) {
        return null;
    }
}

async function ensureFriendsAccountSession(username, password) {
    const trimmedUsername = username?.trim();
    if (!trimmedUsername || !password) {
        return false;
    }

    const loginData = await friendsAuth("login", trimmedUsername, password);
    if (loginData?.success && loginData.sessionID && loginData.playerID) {
        writeFriendsSession(loginData);
        return true;
    }

    const registerData = await friendsAuth("register", trimmedUsername, password);
    if (registerData?.success && registerData.sessionID && registerData.playerID) {
        writeFriendsSession(registerData);
        return true;
    }

    const retryLoginData = await friendsAuth("login", trimmedUsername, password);
    if (retryLoginData?.success && retryLoginData.sessionID && retryLoginData.playerID) {
        writeFriendsSession(retryLoginData);
        return true;
    }

    return false;
}

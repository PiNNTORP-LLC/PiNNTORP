export function initAuth() {
    const authSection = document.getElementById("auth-section");
    const appSection = document.getElementById("app-section");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");
    const logoutBtn = document.getElementById("logout-btn");
    const authMessage = document.getElementById("auth-message");

    function renderView() {
        const token = localStorage.getItem("jwt");
        const authView = document.getElementById("auth-view");

        if (token) {
            if (authView) authView.classList.add("hidden");
            appSection.classList.remove("hidden");

            try {
                // Decode JWT to extract "sub" (username)
                const payloadStr = atob(token.split('.')[1]);
                const payload = JSON.parse(payloadStr);
                document.getElementById("logged-in-user").textContent = payload.sub;
            } catch (e) { }
        } else {
            if (authView) authView.classList.remove("hidden");
            appSection.classList.add("hidden");
        }
    }

    const loginContainer = document.getElementById("login-container");
    const registerContainer = document.getElementById("register-container");
    const goToSignupBtn = document.getElementById("go-to-signup");
    const goToLoginBtn = document.getElementById("go-to-login");

    if (goToSignupBtn && goToLoginBtn) {
        goToSignupBtn.addEventListener("click", () => {
            loginContainer.classList.add("auth-panel-hidden");
            registerContainer.classList.remove("auth-panel-hidden");
            authMessage.textContent = "";
        });

        goToLoginBtn.addEventListener("click", () => {
            registerContainer.classList.add("auth-panel-hidden");
            loginContainer.classList.remove("auth-panel-hidden");
            authMessage.textContent = "";
        });
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = loginForm.username.value;
        const password = loginForm.password.value;
        authMessage.textContent = "Logging in...";

        try {
            const res = await fetch("http://localhost:8080/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok && data.status === "success") {
                localStorage.setItem("jwt", data.token);
                authMessage.textContent = "";
                renderView();
                // Optionally reload the page to initialize the network with the new token
                window.location.reload();
            } else {
                authMessage.textContent = data.message || "Login failed.";
            }
        } catch (err) {
            authMessage.textContent = "Error connecting to backend.";
        }
    });

    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = registerForm.username.value;
        const password = registerForm.password.value;
        authMessage.textContent = "Registering...";

        try {
            const res = await fetch("http://localhost:8080/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role: "user" })
            });
            const data = await res.json();
            if (res.ok && data.status === "success") {
                authMessage.textContent = "Registration successful! Logging in...";
                const loginRes = await fetch("http://localhost:8080/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });
                const loginData = await loginRes.json();
                if (loginRes.ok && loginData.status === "success") {
                    localStorage.setItem("jwt", loginData.token);
                    authMessage.textContent = "";
                    renderView();
                    window.location.reload();
                } else {
                    authMessage.textContent = "Auto-login failed. Please log in manually.";
                    registerForm.reset();
                }
            } else {
                authMessage.textContent = data.message || "Registration failed.";
            }
        } catch (err) {
            authMessage.textContent = "Error connecting to backend.";
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("jwt");
            renderView();
            // Optionally reload to tear down websocket immediately
            window.location.reload();
        });
    }

    renderView();
}

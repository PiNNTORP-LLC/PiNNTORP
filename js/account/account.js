/**
* MODULE: Account Managment (account.js)
*-------------------------------------------------------
* Purpose: Handles the account deletion
* Initializes comfirmation prompts
*/

import { logoutUser } from "../core/auth.js";
import { getAuthHeaders, hasBackendSession, requestJson } from "../core/network.js";
import { saveState } from "../core/storage.js";
import { state } from "../core/state.js";

export async function deleteCurrentAccount() {
    const username = state.currentUser;
    if (!username) throw new Error("No user logged in.");

    if (hasBackendSession()) {
        await requestJson("/api/user/delete", {
            method: "POST",
            headers: getAuthHeaders({"Content-Type": "application/json"})
        });
    }

    // remove user from local state
    delete state.users[username];

    // remove the users friends
    for (const userKey in state.users) {
        const user = state.users[userKey];
        if (user && user.friends) {
            user.friends = user.friends.filter(f => f !== username);
        }
    }

    // clear current session
    state.currentUser = null;
    saveState(state);
    logoutUser();

    return username;
    // throw new Error("Account deletion is not implemented yet.");
}

export function initAccountView() {
    const deleteButton = document.getElementById("delete-account-btn");
    const message = document.getElementById("delete-account-message");

    if (!deleteButton) return;

    deleteButton.addEventListener("click", async () => {
        if (message) message.textContent = "";

        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );

        if (!confirmed) {
            if (message) message.textContent = "Account deletion cancelled.";
            return;
        }

        try {
            await deleteCurrentAccount();
            window.location.replace("index.html");
        } catch (error) {
            if (message) {
                message.textContent = error?.message || "Account deletion failed.";
            }
        }
    });
}

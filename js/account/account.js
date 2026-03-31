/**
* MODULE: Account Managment (account.js)
*-------------------------------------------------------
* Purpose: Handles the account deletion
* Initializes comfirmation prompts
*/

export function deleteCurrentAccount() {
    throw new Error("Account deletion is not implemented yet.");
}

export function initAccountView() {
    const deleteButton = document.getElementById("delete-account-btn");
    const message = document.getElementById("delete-account-message");

    if (!deleteButton) return;

    deleteButton.addEventListener("click", () => {
        if (message) message.textContent = "";

        const confirmed = window.confirm(
            "Are you sure you want to delete your account? This action cannot be undone."
        );

        if (!confirmed) {
            if (message) message.textContent = "Account deletion cancelled.";
            return;
        }

        try {
            deleteCurrentAccount();
        } catch (error) {
            if (message) {
                message.textContent = error?.message || "Account deletion failed.";
            }
        }
    });
}

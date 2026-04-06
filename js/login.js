import { isLoggedIn, initAuthUI } from './core/auth.js';

/**
* MODULE: Login Page (login.js)
*-------------------------------------------------------
* Purpose: Handles the dedicated login/sign-up page.
* Redirects to home if the user is already authenticated.
*/

if (isLoggedIn()) {
    window.location.replace('index.html');
} else {
    initAuthUI();
}

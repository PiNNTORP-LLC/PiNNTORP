import { initGameStage, initGameView, initSlotView, initCoinFlipView, initBlackjackView } from "./game/gameView.js";
import { initClickerView } from "./clicker/clickerView.js";
import { initAuthUI, isLoggedIn, getSession, logoutUser } from "./core/auth.js";
import { initAccountView } from "./account/account.js";
import { initFriendsView } from "./friends/friendsView.js";
import { initStatsView, renderLeaderboard, renderQuickStats } from "./stats/statsView.js";
import { initRecView } from "./recommendation/recView.js";
import { ensureUserState, fetchRemoteState, replaceState, state } from "./core/state.js";
import { loadState, saveState } from "./core/storage.js";

/**
* MODULE: Entry (app.js)
*-------------------------------------------------------
* Purpose: Initializes the application
* Checks login status
* Initilizes all the UIs
*/

// SVG icon strings used in the nav panel
const NAV_ICONS = {
    home:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    games:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="9" height="9" rx="1"/><rect x="13" y="2" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/></svg>`,
    friends: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    profile: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    clicker: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 6v1.5M12 16.5V18M7.76 9l1.3.75M14.94 14.25l1.3.75M7.76 15l1.3-.75M14.94 9.75l1.3-.75"/><circle cx="12" cy="12" r="3"/></svg>`,
    logout:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
    login:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>`,
    close:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
};

const QUICK_GAME_ICONS = {
    slots: `<svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="8" y="7" width="32" height="34" rx="9" fill="rgba(11,15,14,0.85)" stroke="currentColor" stroke-width="1.8"/>
        <rect x="14" y="14" width="20" height="14" rx="4" fill="rgba(212,175,55,0.08)" stroke="currentColor" stroke-width="1.4"/>
        <circle cx="24" cy="21" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/>
        <path d="M24 17.2v7.6M20.2 21h7.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M40 16v12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
        <circle cx="40" cy="13" r="3.6" fill="currentColor"/>
    </svg>`,
    dice: `<svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="11" y="11" width="26" height="26" rx="8" fill="rgba(11,15,14,0.85)" stroke="currentColor" stroke-width="1.8" transform="rotate(-8 24 24)"/>
        <circle cx="18" cy="18" r="2.1" fill="currentColor"/>
        <circle cx="24" cy="24" r="2.1" fill="currentColor"/>
        <circle cx="30" cy="30" r="2.1" fill="currentColor"/>
        <circle cx="30" cy="18" r="2.1" fill="currentColor"/>
        <circle cx="18" cy="30" r="2.1" fill="currentColor"/>
    </svg>`,
    coin: `<svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="14" fill="rgba(11,15,14,0.7)" stroke="currentColor" stroke-width="2"/>
        <circle cx="24" cy="24" r="9.5" fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.8"/>
        <path d="M21 17.8h5.2a4.4 4.4 0 0 1 0 8.8H22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M24 15.5v17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`,
    blackjack: `<svg viewBox="0 0 48 48" aria-hidden="true">
        <rect x="10" y="12" width="16" height="22" rx="4" fill="rgba(11,15,14,0.85)" stroke="currentColor" stroke-width="1.6" transform="rotate(-8 18 23)"/>
        <rect x="22" y="14" width="16" height="22" rx="4" fill="rgba(11,15,14,0.92)" stroke="currentColor" stroke-width="1.6" transform="rotate(8 30 25)"/>
        <path d="M16 20c1.2-2 3.8-2 5 0c-1.2 1.6-2.5 3-2.5 3S17.2 21.6 16 20Z" fill="currentColor"/>
        <path d="M28 22h5M30.5 19.5v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
};

function initNavPanel() {
const PAGE_LINKS = [
        { label: 'Home', href: 'index.html', icon: NAV_ICONS.home, page: 'index.html' },
        { label: 'Games', href: 'games.html', icon: NAV_ICONS.games, page: 'games.html' },
        { label: 'Earn',    href: 'coin.html',    icon: NAV_ICONS.clicker, page: 'coin.html' },
        { label: 'Friends', href: 'friends.html', icon: NAV_ICONS.friends, page: 'friends.html' },
        { label: 'Profile', href: 'profile.html', icon: NAV_ICONS.profile, page: 'profile.html' },
    ];

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    const linksHtml = PAGE_LINKS.map(l => {
        const active = currentPage === l.page ? ' is-active' : '';
        return `<a class="nav-link${active}" href="${l.href}">${l.icon}<span>${l.label}</span></a>`;
    }).join('');

    const CHEVRON = `<svg class="nav-user-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

    let footerHtml;
    if (isLoggedIn()) {
        const { username } = getSession();
        const initial = (username[0] || '?').toUpperCase();
        footerHtml = `
            <div class="nav-profile-card" id="nav-profile-card">
                <button type="button" class="nav-profile-trigger" id="nav-profile-trigger" aria-expanded="false">
                    <div class="nav-user-avatar">${initial}</div>
                    <span class="nav-username">${username}</span>
                    ${CHEVRON}
                </button>
                <div class="nav-profile-dropdown" id="nav-profile-dropdown">
                    <a class="nav-dropdown-item" href="profile.html">
                        ${NAV_ICONS.profile}<span>Profile</span>
                    </a>
                    <button type="button" class="nav-dropdown-item nav-dropdown-item--danger" id="nav-logout-btn">
                        ${NAV_ICONS.logout}<span>Log Out</span>
                    </button>
                </div>
            </div>`;
    } else {
        footerHtml = `
            <div class="nav-guest-card">
                <p class="nav-guest-label">Not signed in</p>
                <div class="nav-guest-actions">
                    <a class="nav-guest-btn nav-guest-btn--primary" href="index.html">${NAV_ICONS.login}<span>Log In</span></a>
                    <a class="nav-guest-btn nav-guest-signup" href="index.html#signup">${NAV_ICONS.profile}<span>Sign Up</span></a>
                </div>
            </div>`;
    }

    const overlay = document.createElement('div');
    overlay.id = 'nav-overlay';
    overlay.className = 'nav-overlay';

    const panel = document.createElement('nav');
    panel.id = 'nav-panel';
    panel.className = 'nav-panel';
    panel.setAttribute('aria-label', 'Site navigation');
    panel.innerHTML = `
        <div class="nav-panel-head">
            <span class="nav-panel-logo">PiNNTORP</span>
        </div>
        <div class="nav-links">${linksHtml}</div>
        <div class="nav-panel-footer">${footerHtml}</div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    const openBtn = document.getElementById('nav-open');
    const profileCard = document.getElementById('nav-profile-card');
    const trigger = document.getElementById('nav-profile-trigger');
    const dropdown = document.getElementById('nav-profile-dropdown');
    const logoutBtn = document.getElementById('nav-logout-btn');

    const open = () => {
        panel.classList.add('is-open');
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    };
    const close = () => {
        panel.classList.remove('is-open');
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
        profileCard?.classList.remove('is-expanded');
        trigger?.setAttribute('aria-expanded', false);
    };

    openBtn?.addEventListener('click', open);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            close();
        }
    });

    // Profile card dropdown toggle
    trigger?.addEventListener('click', () => {
        const isExpanded = profileCard.classList.toggle('is-expanded');
        trigger.setAttribute('aria-expanded', isExpanded);
    });

    logoutBtn?.addEventListener('click', () => { logoutUser(); window.location.reload(); });

    const signupLink = panel.querySelector('.nav-guest-signup');
    signupLink?.addEventListener('click', e => {
        const loginContainer = document.getElementById('login-container');
        const regContainer = document.getElementById('register-container');
        if (regContainer) {
            e.preventDefault();
            loginContainer?.classList.add('auth-panel-hidden');
            regContainer?.classList.remove('auth-panel-hidden');
            close();
        }
    });
}

// Inject the persistent 3-column sidebar layout around each page's content.
// Runs before any render calls so that #leaderboard-list and #quick-stats exist.
function initLayout() {
    const body = document.body;
    const header = body.querySelector('.site-header');
    const navPanel = document.getElementById('nav-panel');

    // Gather all non-header, non-script direct children
    const contentChildren = Array.from(body.children).filter(
        el => el !== header && el !== navPanel && el.tagName !== 'SCRIPT'
    );

    // Wrap them in the center column
    const pageContent = document.createElement('div');
    pageContent.className = 'page-content';
    contentChildren.forEach(child => pageContent.appendChild(child));

    // Determine current hash so the active game link can be highlighted
    const currentHash = window.location.hash.slice(1);
    const GAME_LINKS = [
        { label: 'Slots', hash: 'slots-game', icon: QUICK_GAME_ICONS.slots, blurb: 'Spin the reels' },
        { label: 'Dice Roll', hash: 'dice-game', icon: QUICK_GAME_ICONS.dice, blurb: 'Call the lucky face' },
        { label: 'Coin Flip', hash: 'coin-flip-game', icon: QUICK_GAME_ICONS.coin, blurb: 'Heads or tails' },
        { label: 'Blackjack', hash: 'blackjack-game', icon: QUICK_GAME_ICONS.blackjack, blurb: 'Beat the dealer' },
    ];
    const gameLinksHtml = GAME_LINKS.map(g => {
        const active = currentHash === g.hash ? ' qg-link--active' : '';
        return `<a class="qg-link${active}" href="games.html#${g.hash}">
            <span class="qg-icon">${g.icon}</span>
            <span class="qg-copy">
                <span class="qg-title">${g.label}</span>
                <span class="qg-subtitle">${g.blurb}</span>
            </span>
        </a>`;
    }).join('');

    // Left sidebar - Quick Stats + Quick Games
    const leftSidebar = document.createElement('aside');
    leftSidebar.id = 'left-sidebar';
    leftSidebar.className = 'sidebar sidebar-left';
    leftSidebar.innerHTML = `
        <section class="dashboard-panel">
            <h2>Quick Stats</h2>
            <div id="quick-stats" class="quick-stats"></div>
        </section>
        <section class="dashboard-panel">
            <h2>Quick Games</h2>
            <nav class="quick-games">${gameLinksHtml}</nav>
        </section>
    `;

    // Right sidebar - Global Leaderboard
    const rightSidebar = document.createElement('aside');
    rightSidebar.id = 'right-sidebar';
    rightSidebar.className = 'sidebar sidebar-right';
    rightSidebar.innerHTML = `
        <section class="dashboard-panel">
            <h2>Global Leaderboard</h2>
            <p class="leaderboard-sub">Top profit earners</p>
            <div id="leaderboard-list" class="leaderboard-list" aria-live="polite"></div>
        </section>
    `;

    const siteLayout = document.createElement('div');
    siteLayout.className = 'site-layout';
    if (navPanel) {
        navPanel.classList.add('nav-panel--docked');
        siteLayout.appendChild(navPanel);
    }
    siteLayout.appendChild(leftSidebar);
    siteLayout.appendChild(pageContent);
    siteLayout.appendChild(rightSidebar);

    body.appendChild(siteLayout);
}

// Initialize auth UI on every page (header chip + form handlers)
initAuthUI();
initNavPanel();

// Protect game and profile pages - redirect to home if not logged in
const _page = window.location.pathname.split("/").pop() || "index.html";
if ((_page === "games.html" || _page === "profile.html" || _page === "coin.html") && !isLoggedIn()) {
    window.location.replace("index.html");
}

// Restore the last local snapshot first
const saved = loadState();
replaceState(saved);

if (isLoggedIn()) {
    const { username } = getSession();
    if (username) {
        state.currentUser = username;
        ensureUserState(username);
        saveState(state);
    }
}

// Refresh state from the backend when a session is available
if (isLoggedIn()) {
    await fetchRemoteState();
}

// Build the 3-column layout shell before rendering anything
initLayout();

// Initialize the current page features
initGameStage();
initSlotView();
initGameView();
initCoinFlipView();
initBlackjackView();
initClickerView();
initFriendsView();
initStatsView();
initRecView();
initAccountView();
renderLeaderboard();
renderQuickStats();

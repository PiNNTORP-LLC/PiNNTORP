import { state } from '../core/state.js';
import { saveState } from '../core/storage.js';
import { renderBalance, renderQuickStats } from '../stats/statsView.js';

/**
 * MODULE: Clicker (clickerView.js)
 * -------------------------------------------------------
 * Single click gold coin mini game. No passive income.
 *
 * Persistence strategy:
 *   - Local state updates immediately (responsive UI).
 *   - Earnings are aggregated and sent to /api/earn every FLUSH_INTERVAL_MS,
 *     as well as upon unloading the page through fetch keepalive.
 *   - Upgrades are synced immediately with the server (negative earn).
 *   - Clicker upgrade ownership is maintained using a separate localStorage entry
 *     so as not to get cleared out by server re-sync.
 *
 * Game balance:
 *   - Cooldown enforced at COOLDOWN_MS after each click (no spam).
 *   - Start with $1/click; upgrades are expensive enough to necessitate investment.
 *   - Cap at $46/click with all four upgrades at ~1.25 clicks/sec = ~3,450/min.
 *     (It would take investing about $12,575 in upgrades for you to attain this rate.)
*/
// ── Upgrade definitions (click power only, no per-second income) ─────────────

const UPGRADES = [
    {
        id: 'grip',
        name: 'Lucky Grip',
        desc: '+$1 per click',
        cost: 75,
        cpc: 1,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                 <path d="M18 11V6a2 2 0 0 0-4 0v5"/>
                 <path d="M14 10V4a2 2 0 0 0-4 0v6"/>
                 <path d="M10 10.5V6a2 2 0 0 0-4 0v8"/>
                 <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34
                          l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
               </svg>`,
    },
    {
        id: 'fingers',
        name: 'Gold Fingers',
        desc: '+$4 per click',
        cost: 400,
        cpc: 4,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                 <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12
                          l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21
                          l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12
                          l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                 <path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>
               </svg>`,
    },
    {
        id: 'midas',
        name: 'Midas Method',
        desc: '+$16 per click',
        cost: 2500,
        cpc: 16,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                 <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87
                          a1 1 0 0 0 1.516.294L21.183 6.5a.5.5 0 0 1 .798.519
                          l-2.834 10.246a1 1 0 0 1-.956.735H5.81a1 1 0 0 1-.957-.735
                          L2.02 7.019a.5.5 0 0 1 .798-.519l4.276 2.664
                          a1 1 0 0 0 1.516-.294z"/>
               </svg>`,
    },
    {
        id: 'legend',
        name: 'Casino Legend',
        desc: '+$25 per click',
        cost: 10000,
        cpc: 25,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                 <path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59
                          a2.41 2.41 0 0 0 3.41 0l7.59-7.59
                          a2.41 2.41 0 0 0 0-3.41L13.7 2.71
                          a2.41 2.41 0 0 0-3.41 0Z"/>
               </svg>`,
    },
];

// ── Config ────────────────────────────────────────────────────────────────────

const COOLDOWN_MS = 800; // minimum ms between clicks
const FLUSH_INTERVAL_MS = 4000; // how often to sync earnings to server
const API_BASE = ''; // same-origin
const CLICKER_BALANCE_CAP = 500;

// ── Clicker upgrade state (separate localStorage key) ─────────────────────────

function _csKey() {
    return `clicker_${state.currentUser}`;
}

function loadCS() {
    try {
        return JSON.parse(localStorage.getItem(_csKey())) || { upgrades: [] };
    } catch {
        return { upgrades: [] };
    }
}

function saveCS(cs) {
    localStorage.setItem(_csKey(), JSON.stringify(cs));
}

// ── Server sync ───────────────────────────────────────────────────────────────

let pendingEarn = 0; // accumulated click earnings not yet on server

async function syncToServer(delta) {
    const token = localStorage.getItem('jwt');
    if (!token || delta === 0) {
        return;
    }
    try {
        await fetch(`${API_BASE}/api/earn`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ amount: delta }),
        });
    } catch {
        /* network error - will retry next flush */
    }
}

function flushEarnings() {
    if (pendingEarn <= 0) {
        return;
    }
    const toSync = pendingEarn;
    pendingEarn = 0;
    syncToServer(toSync);
}

// keepalive flush on unload so earnings survive navigation
function installUnloadFlush() {
    window.addEventListener('beforeunload', () => {
        if (pendingEarn <= 0) {
            return;
        }
        const token = localStorage.getItem('jwt');
        if (!token) {
            return;
        }
        fetch(`${API_BASE}/api/earn`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ amount: pendingEarn }),
            keepalive: true,
        });
        pendingEarn = 0;
    }, { once: true });
}

function addLocal(amount) {
    const user = state.users[state.currentUser];
    if (!user) {
        return;
    }
    user.balance += amount;
    user.profit += amount;
    saveState(state);
    renderBalance();
}

function spawnFloat(x, y, amount) {
    const el = document.createElement('span');
    el.className = 'clicker-float';
    el.textContent = `+$${amount}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
}

export function initClickerView() {
    const coinEl = document.getElementById('clicker-coin');
    if (!coinEl) {
        return; // not on coin.html
    }

    const cpcEl = document.getElementById('clicker-cpc');
    const totalEl = document.getElementById('clicker-total');
    const upgradesEl = document.getElementById('clicker-upgrades');
    const coolEl = document.getElementById('clicker-cooldown');
    const hintEl = document.getElementById('clicker-hint');

    let cs = loadCS();
    let sessionEarned = 0;
    let lastClick = 0; // timestamp of last accepted click

    const getCPC = () =>
        1 + UPGRADES.filter(u => cs.upgrades.includes(u.id))
            .reduce((s, u) => s + u.cpc, 0);

    const getBalance = () => state.users[state.currentUser]?.balance ?? 0;

    const isClickBlockedByCap = () => {
        const balance = getBalance();
        return balance >= CLICKER_BALANCE_CAP || (balance + getCPC()) > CLICKER_BALANCE_CAP;
    };

    function updateStats() {
        if (cpcEl) {
            cpcEl.textContent = `$${getCPC()}`;
        }
        if (totalEl) {
            totalEl.textContent = `$${sessionEarned}`;
        }
        updateClickerAvailability();
    }

    function updateClickerAvailability() {
        const blocked = isClickBlockedByCap();
        coinEl.disabled = blocked;
        coinEl.setAttribute('aria-disabled', String(blocked));
        coinEl.classList.toggle('clicker-coin--disabled', blocked);

        if (!hintEl) {
            return;
        }
        hintEl.textContent = blocked
            ? `You have reached the $${CLICKER_BALANCE_CAP} balance cap! Please spend some balance to click again.`
            : 'Click the coin to earn money!';
    }

    function renderUpgrades() {
        if (!upgradesEl) {
            return;
        }
        const balance = state.users[state.currentUser]?.balance ?? 0;

        upgradesEl.innerHTML = UPGRADES.map(u => {
            const owned = cs.upgrades.includes(u.id);
            const affordable = !owned && balance >= u.cost;
            const cls = owned
                ? ' clicker-upgrade--owned'
                : affordable
                ? ''
                : ' clicker-upgrade--locked';
            return `
                <div class="clicker-upgrade${cls}">
                    <span class="clicker-upgrade-icon">${u.icon}</span>
                    <div class="clicker-upgrade-info">
                        <span class="clicker-upgrade-name">${u.name}</span>
                        <span class="clicker-upgrade-desc">${u.desc}</span>
                    </div>
                    ${owned
                        ? `<span class="clicker-upgrade-badge">Owned</span>`
                        : `<button class="clicker-upgrade-btn" data-id="${u.id}"
                               ${affordable ? '' : 'disabled'}>
                               $${u.cost.toLocaleString()}
                           </button>`}
                </div>`;
        }).join('');

        upgradesEl.querySelectorAll('.clicker-upgrade-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => buyUpgrade(btn.dataset.id));
        });
    }

    // Upgrade purchase
    async function buyUpgrade(id) {
        const u = UPGRADES.find(x => x.id === id);
        if (!u || cs.upgrades.includes(id)) {
            return;
        }
        const user = state.users[state.currentUser];
        if (!user || user.balance < u.cost) {
            return;
        }

        // Flush any pending earnings first so balance on server is accurate
        flushEarnings();

        // Deduct locally immediately
        addLocal(-u.cost);
        cs.upgrades.push(id);
        saveCS(cs);
        renderUpgrades();
        updateStats();
        renderQuickStats();

        // Sync deduction to server (negative amount)
        await syncToServer(-u.cost);
    }

    // Handle clicks on the coin
    coinEl.addEventListener('click', e => {
        if (isClickBlockedByCap()) {
            updateClickerAvailability();
            return;
        }

        const now = Date.now();
        if (now - lastClick < COOLDOWN_MS) {
            // Still on cooldown - shake the coin as feedback
            coinEl.classList.remove('clicker-coin--shake');
            void coinEl.offsetWidth;
            coinEl.classList.add('clicker-coin--shake');
            return;
        }
        lastClick = now;

        const amount = getCPC();
        addLocal(amount);
        pendingEarn += amount;
        sessionEarned += amount;

        updateStats();
        renderUpgrades();
        renderQuickStats();
        spawnFloat(e.clientX, e.clientY, amount);

        // Pop animation
        coinEl.classList.remove('clicker-coin--pop');
        void coinEl.offsetWidth;
        coinEl.classList.add('clicker-coin--pop');

        // Cooldown arc on the coin overlay
        if (coolEl) {
            coolEl.classList.remove('clicker-cooldown--active');
            void coolEl.offsetWidth;
            coolEl.style.animationDuration = `${COOLDOWN_MS}ms`;
            coolEl.classList.add('clicker-cooldown--active');
        }
    });

    // Initial cooldown state (in case user reloads during cooldown)
    const flushId = setInterval(flushEarnings, FLUSH_INTERVAL_MS);
    window.addEventListener('beforeunload', () => clearInterval(flushId), { once: true });
    installUnloadFlush();

    // Initial render
    updateStats();
    renderUpgrades();
    updateClickerAvailability();
}

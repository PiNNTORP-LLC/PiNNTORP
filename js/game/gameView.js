import { getGameApi } from "./game.js";
import { renderStats, renderHistory } from "../stats/statsView.js";
import { renderRec } from "../recommendation/recView.js";
import { getStats } from "../stats/stats.js";

/**
* MODULE: Games (gameView.js)
*-------------------------------------------------------
* Purpose: Initializes the UI for each game
* Handles animations for each game
*/

const diceGameApi = getGameApi("dice");
const slotGameApi = getGameApi("slots");
const coinFlipApi = getGameApi("coinFlip");
const blackjackApi = getGameApi("blackjack");

export function initGameStage() {
    const links = [...document.querySelectorAll(".game-tab-link")];
    const panels = [...document.querySelectorAll(".game-panel")];

    if (links.length === 0 || panels.length === 0) {
        return;
    }

    function activateGame(targetId) {
        let foundPanel = null;
        for (const panel of panels) {
            if (panel.id === targetId) {
                panel.classList.remove("hidden");
                foundPanel = panel;
            } else {
                panel.classList.add("hidden");
            }
        }

        for (const link of links) {
            if (link.dataset.gameTarget === targetId) {
                link.classList.add("is-active");
            } else {
                link.classList.remove("is-active");
            }
        }

        if (foundPanel) {
            const url = new URL(window.location.href);
            url.hash = targetId;
            history.replaceState(null, "", url);
        }
    }

    links.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            activateGame(link.dataset.gameTarget);
        });
    });

    const initialTarget = window.location.hash ? window.location.hash.slice(1) : "slots-game";
    activateGame(initialTarget);

    window.addEventListener("hashchange", () => {
        const target = window.location.hash ? window.location.hash.slice(1) : "slots-game";
        activateGame(target);
    });
}

export function initGameView() {
    const controls = document.getElementById("game-controls");
    const result = document.getElementById("game-result");
    const gsap = globalThis.gsap || null;
    const dice = document.getElementById("dice");

    const diceRotations = {
        1: { x: 0, y: 0 },
        2: { x: 0, y: 180 },
        3: { x: 0, y: -90 },
        4: { x: 0, y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90, y: 0 }
    };

    if (!controls || !result) {
        return;
    }

    [1, 2, 3, 4, 5, 6].forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(value);
        button.addEventListener("click", async () => {
            if (button.disabled) {
                return;
            }
            const buttons = controls.querySelectorAll("button");
            buttons.forEach(btn => btn.disabled = true);
            result.textContent = "Rolling...";

            let tossPromise = Promise.resolve();
            if (gsap && dice) {
                gsap.set(dice, { rotationX: 0, rotationY: 0, rotationZ: 0 });
                const arcTl = gsap.timeline();
                arcTl.to(dice, { duration: 0.6, y: -150, scale: 1.2, ease: "power2.out" })
                    .to(dice, { duration: 0.6, y: 0, scale: 1, ease: "power2.in" });

                gsap.to(dice, {
                    duration: 1.2,
                    rotationX: 1440,
                    rotationY: 2160,
                    rotationZ: 720,
                    ease: "none"
                });

                tossPromise = new Promise(resolve => setTimeout(resolve, 1200));
            }

            const round = await diceGameApi.play(value);
            await tossPromise;

            if (gsap && dice) {
                const final = diceRotations[round.roll];
                await gsap.to(dice, {
                    duration: 0.8,
                    rotationX: 1440 + final.x,
                    rotationY: 2160 + final.y,
                    rotationZ: 720,
                    ease: "elastic.out(1, 0.75)"
                });
            }

            result.textContent = round.won
                ? `Win: guessed ${round.guess}, rolled ${round.roll}`
                : `Loss: guessed ${round.guess}, rolled ${round.roll}`;

            buttons.forEach(btn => btn.disabled = false);
            renderStats();
            renderHistory();
            renderRec();
        });
        controls.appendChild(button);
    });
}

export function initSlotView() {
    const button = document.getElementById("slot-roll");
    if (!button) {
        return;
    }

    const modBtn = document.getElementById("slot-mode-btn");
    const leverHandle = document.getElementById("lever-handle");
    const reels = [
        document.getElementById("reel-1"),
        document.getElementById("reel-2"),
        document.getElementById("reel-3")
    ].filter(Boolean);

    const gsap = globalThis.gsap || null;
    const symbolHeight = 140;
    const FRUITS = ["🍒", "🍋", "🍊", "🍇", "🍉", "🎰", "⭐"];
    let fruitMode = false;

    function getSymbol(n) {
        return fruitMode ? FRUITS[n - 1] : String(n);
    }

    function resetSlots() {
        reels.forEach((reel) => {
            if (gsap) {
                gsap.set(reel, { y: 0 });
            }
            reel.innerHTML = `<div class="slot-symbol">?</div>`;
        });
        const windowEls = [...document.querySelectorAll(".slot-window")];
        windowEls.forEach(w => w.classList.remove("glow-win", "glow-jackpot", "glow-dim"));
        const slotMachineEl = document.querySelector(".slot-machine");
        if (slotMachineEl) {
            slotMachineEl.classList.remove("jackpot-flash");
        }
    }

    resetSlots();

    if (modBtn) {
        modBtn.addEventListener("click", () => {
            fruitMode = !fruitMode;
            modBtn.textContent = fruitMode ? "# Numbers" : "🍒 Fruits";
            modBtn.classList.toggle("active", fruitMode);
            resetSlots();
        });
    }

    button.addEventListener("click", async () => {
        if (button.disabled) {
            return;
        }
        button.disabled = true;

        const windowEls = [...document.querySelectorAll(".slot-window")];
        const slotMachineEl = document.querySelector(".slot-machine");
        windowEls.forEach(w => w.classList.remove("glow-win", "glow-jackpot", "glow-dim"));
        if (slotMachineEl) {
            slotMachineEl.classList.remove("jackpot-flash");
        }

        if (gsap && leverHandle) {
            const tl = gsap.timeline();
            tl.to(leverHandle, { rotation: 34, duration: 0.18, ease: "power3.in" });
            if (slotMachineEl) {
                tl.to(slotMachineEl, { x: -5, duration: 0.06, ease: "none" }, 0.13)
                    .to(slotMachineEl, { x: 5, duration: 0.07, ease: "none" })
                    .to(slotMachineEl, { x: -3, duration: 0.06, ease: "none" })
                    .to(slotMachineEl, { x: 0, duration: 0.08, ease: "power2.out" });
            }
            tl.to(leverHandle, { rotation: 0, duration: 1.0, ease: "elastic.out(1.3, 0.35)" }, 0.18);
        }

        reels.forEach((reel) => {
            const dir = Math.random() > 0.5 ? 1 : -1;
            reel.dataset.dir = String(dir);
            let html = "";
            for (let i = 0; i < 60; i++) {
                const r = Math.floor(Math.random() * 7) + 1;
                html += `<div class="slot-symbol">${getSymbol(r)}</div>`;
            }
            reel.innerHTML = html;

            if (gsap) {
                if (dir === 1) {
                    gsap.set(reel, { y: 0 });
                    gsap.to(reel, { y: -(50 * symbolHeight), duration: 3, ease: "power2.inOut" });
                } else {
                    gsap.set(reel, { y: -(50 * symbolHeight) });
                    gsap.to(reel, { y: 0, duration: 3, ease: "power2.inOut" });
                }
            }
        });

        const slotNums = await slotGameApi.play();

        reels.forEach((reel, index) => {
            if (gsap) {
                gsap.killTweensOf(reel);
            }
            const dir = Number.parseInt(reel.dataset.dir || "1", 10);
            let html = "";
            if (dir === 1) {
                for (let i = 0; i < 15; i++) {
                    const r = Math.floor(Math.random() * 7) + 1;
                    html += `<div class="slot-symbol">${getSymbol(r)}</div>`;
                }
                html += `<div class="slot-symbol winner">${getSymbol(slotNums[index])}</div>`;
                reel.innerHTML = html;
                if (gsap) {
                    gsap.set(reel, { y: 0 });
                    gsap.to(reel, { y: -(15 * symbolHeight), duration: 1.5 + (index * 0.5), ease: "back.out(1.2)" });
                }
            } else {
                html += `<div class="slot-symbol winner">${getSymbol(slotNums[index])}</div>`;
                for (let i = 0; i < 15; i++) {
                    const r = Math.floor(Math.random() * 7) + 1;
                    html += `<div class="slot-symbol">${getSymbol(r)}</div>`;
                }
                reel.innerHTML = html;
                if (gsap) {
                    gsap.set(reel, { y: -(15 * symbolHeight) });
                    gsap.to(reel, { y: 0, duration: 1.5 + (index * 0.5), ease: "back.out(1.2)" });
                }
            }
        });

        await new Promise(resolve => setTimeout(resolve, 2600));

        const [n1, n2, n3] = slotNums;
        const allMatch = n1 === n2 && n2 === n3;
        const matchIndices = allMatch ? [0, 1, 2] : n1 === n2 ? [0, 1] : n1 === n3 ? [0, 2] : n2 === n3 ? [1, 2] : [];

        if (allMatch) {
            windowEls.forEach(w => w.classList.add("glow-jackpot"));
            if (slotMachineEl) {
                slotMachineEl.classList.add("jackpot-flash");
            }
        } else if (matchIndices.length === 2) {
            const dimIndex = [0, 1, 2].find(i => !matchIndices.includes(i));
            matchIndices.forEach(i => windowEls[i].classList.add("glow-win"));
            if (dimIndex !== undefined) {
                windowEls[dimIndex].classList.add("glow-dim");
            }
        }

        button.disabled = false;
        renderStats();
        renderRec();
    });
}

export function initCoinFlipView() {
    const headsButton = document.getElementById("heads");
    const tailsButton = document.getElementById("tails");
    const resultText = document.getElementById("coinResult");
    const choiceText = document.getElementById("choice");
    const coin = document.getElementById("coin");
    const gsap = globalThis.gsap || null;

    if (!headsButton) {
        return;
    }

    let totalRotation = 0;

    async function doFlip(guess) {
        headsButton.disabled = true;
        tailsButton.disabled = true;
        resultText.textContent = "Flipping...";
        choiceText.textContent = "";

        const result = await coinFlipApi.play(guess);

        if (gsap && coin) {
            const targetAngle = result === "Heads" ? 0 : 180;
            const currentMod = totalRotation % 360;
            let adjustment = targetAngle - currentMod;
            if (adjustment < 0) {
                adjustment += 360;
            }
            totalRotation += 8 * 360 + adjustment;

            await gsap.to(coin, {
                duration: 1.6,
                rotateY: totalRotation,
                ease: "power2.inOut"
            });
        }

        const won = guess === result;
        resultText.textContent = won ? `You win! It was ${result}` : `You lose. It was ${result}`;
        choiceText.textContent = `You chose: ${guess}`;

        headsButton.disabled = false;
        tailsButton.disabled = false;
        renderStats();
        renderRec();
    }

    headsButton.addEventListener("click", () => doFlip("Heads"));
    tailsButton.addEventListener("click", () => doFlip("Tails"));
}

export function initBlackjackView() {
    const dealBtn = document.getElementById("bj-deal");
    const hitBtn = document.getElementById("bj-hit");
    const standBtn = document.getElementById("bj-stand");
    const betMinusBtn = document.getElementById("bj-bet-minus");
    const betPlusBtn = document.getElementById("bj-bet-plus");
    const betValueEl = document.getElementById("bj-bet-value");
    const playerHandEl = document.getElementById("bj-player-hand");
    const dealerHandEl = document.getElementById("bj-dealer-hand");
    const playerTotalEl = document.getElementById("bj-player-total");
    const dealerTotalEl = document.getElementById("bj-dealer-total");
    const resultEl = document.getElementById("bj-result");

    if (!dealBtn) {
        return;
    }

    const MIN_BET = 5;
    const STEP = 5;
    let bet = MIN_BET;

    const updateBetUI = () => {
        const balance = getStats().balance;
        // Clamp: never exceed balance, never go below minimum
        bet = Math.min(bet, Math.max(MIN_BET, Math.floor(balance / STEP) * STEP));
        if (bet < MIN_BET) {
            bet = MIN_BET;
        }
        betValueEl.textContent = `$${bet}`;
        betMinusBtn.disabled = bet <= MIN_BET;
        betPlusBtn.disabled = (bet + STEP) > balance;
    };

    betMinusBtn.addEventListener("click", () => {
        bet = Math.max(MIN_BET, bet - STEP);
        updateBetUI();
    });

    betPlusBtn.addEventListener("click", () => {
        const balance = getStats().balance;
        if ((bet + STEP) <= balance) {
            bet += STEP;
        }
        updateBetUI();
    });

    updateBetUI();

    function makeCard(card, faceDown = false, delay = 0) {
        const el = document.createElement("div");
        const isRed = !faceDown && (card.suit === "♥" || card.suit === "♦");
        el.className = faceDown ? "card face-down" : `card${isRed ? " red" : ""}`;
        el.style.animationDelay = `${delay}s`;
        if (!faceDown) {
            el.innerHTML = `<span class="card-corner">${card.value}<br>${card.suit}</span>` +
                `<span class="card-suit-center">${card.suit}</span>` +
                `<span class="card-corner card-br">${card.value}<br>${card.suit}</span>`;
        }
        return el;
    }

    function renderHand(el, cards, hideSecond = false) {
        el.innerHTML = "";
        cards.forEach((card, i) => el.appendChild(makeCard(card, hideSecond && i === 1, i * 0.1)));
    }

    function setPhase(phase) {
        const playing = phase === "playing";
        dealBtn.style.display = playing ? "none" : "";
        hitBtn.style.display = playing ? "" : "none";
        standBtn.style.display = playing ? "" : "none";
        if (playing) {
            betMinusBtn.disabled = true;
            betPlusBtn.disabled = true;
        } else {
            updateBetUI(); // re-clamp and refresh both buttons
        }
    }

    setPhase("idle");

    dealBtn.addEventListener("click", async () => {
        if (bet > getStats().balance) {
            resultEl.textContent = "Insufficient funds!";
            return;
        }
        resultEl.textContent = "";
        const round = await blackjackApi.deal(bet);
        renderHand(playerHandEl, round.playerHand);
        renderHand(dealerHandEl, round.dealerHand, true);
        playerTotalEl.textContent = round.playerTotal;
        dealerTotalEl.textContent = "?";

        if (round.isBlackjack) {
            const final = await blackjackApi.resolveBlackjack();
            renderHand(dealerHandEl, final.dealerHand);
            dealerTotalEl.textContent = final.dealerTotal;
            resultEl.textContent = `♠ Blackjack! You win $${final.payout}!`;
            setPhase("idle");
            renderStats();
            renderHistory();
            renderRec();
        } else {
            setPhase("playing");
        }
    });

    hitBtn.addEventListener("click", async () => {
        const round = await blackjackApi.hit();
        renderHand(playerHandEl, round.playerHand);
        playerTotalEl.textContent = round.playerTotal;
        if (round.bust) {
            renderHand(dealerHandEl, round.dealerHand);
            dealerTotalEl.textContent = round.dealerTotal;
            resultEl.textContent = `Bust! You had ${round.playerTotal}.`;
            setPhase("idle");
            renderStats();
            renderHistory();
            renderRec();
        }
    });

    standBtn.addEventListener("click", async () => {
        const final = await blackjackApi.stand();
        renderHand(playerHandEl, final.playerHand);
        renderHand(dealerHandEl, final.dealerHand);
        playerTotalEl.textContent = final.playerTotal;
        dealerTotalEl.textContent = final.dealerTotal;
        const msg = {
            win: `You win! +$${final.delta}`,
            loss: `Dealer wins. -$${Math.abs(final.delta)}`,
            push: "Push - it's a tie."
        };
        resultEl.textContent = msg[final.outcome];
        setPhase("idle");
        renderStats();
        renderRec();
    });
}

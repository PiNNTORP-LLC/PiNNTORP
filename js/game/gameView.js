import { getGameApi } from "./game.js";
import { renderStats } from "../stats/statsView.js";
import { renderRec } from "../recommendation/recView.js";

const diceGameApi = getGameApi("dice");
const slotGameApi = getGameApi("slots");
const coinFlipApi = getGameApi("coinFlip");

export function initGameStage() {
    // Read the game switcher links and playable panels on the page
    const links = [...document.querySelectorAll(".game-tab-link")];
    const panels = [...document.querySelectorAll(".game-panel")];

    if (links.length === 0 || panels.length === 0) return;

    function activateGame(targetId) {
        // Show only the requested game panel
        let foundPanel = null;
        for (const panel of panels) {
            if (panel.id === targetId) {
                panel.classList.remove("hidden");
                foundPanel = panel;
            } else {
                panel.classList.add("hidden");
            }
        }

        // Keep the switcher state in sync with the active panel
        for (const link of links) {
            if (link.dataset.gameTarget === targetId) {
                link.classList.add("is-active");
            } else {
                link.classList.remove("is-active");
            }
        }

        if (foundPanel) {
            // Update the URL hash without forcing a page jump
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

    // Open the game from the current hash or default to slots
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

    if (!controls || !result) return;

    [1, 2, 3, 4, 5, 6].forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(value);
        button.addEventListener("click", async () => {
            if (button.disabled) { return; }
            const buttons = controls.querySelectorAll("button");
            buttons.forEach((btn) => {
                btn.disabled = true;
            });
            result.textContent = "Rolling...";

            // Run the toss animation before the die settles on the result
            let tossPromise = Promise.resolve();
            if (gsap && dice) {
                gsap.set(dice, { rotationX: 0, rotationY: 0, rotationZ: 0 });
                let tossTl = gsap.timeline();

                tossTl.to(dice, {
                    duration: 0.6,
                    y: -150,
                    scale: 1.2,
                    rotationX: 720,
                    rotationY: 1080,
                    rotationZ: 360,
                    ease: "power2.out"
                }).to(dice, {
                    duration: 0.6,
                    y: 0,
                    scale: 1,
                    rotationX: 1440,
                    rotationY: 2160,
                    rotationZ: 720,
                    ease: "power2.in"
                });

                tossPromise = tossTl.then ? tossTl.then(() => {}) : new Promise((resolve) => setTimeout(resolve, 1200));
            }

            // Play the round and wait for the toss to finish
            const round = await diceGameApi.play(value);
            await tossPromise;

            // Land the die on the returned face
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

            buttons.forEach((btn) => {
                btn.disabled = false;
            });
            renderStats();
            renderRec();
        });
        controls.appendChild(button);
    });
}

export function initSlotView() {
    const button = document.getElementById("slot-roll");
    const modBtn = document.getElementById("slot-mode-btn");
    const leverHandle = document.getElementById("lever-handle");
    const reels = [];
    reels.push(document.getElementById("reel-1"));
    reels.push(document.getElementById("reel-2"));
    reels.push(document.getElementById("reel-3"));
    const gsap = globalThis.gsap || null;
    const symbolHeight = 140;

    const FRUITS = ["🍒", "🍋", "🍊", "🍇", "🍉", "🎰", "⭐"];
    let fruitMode = false;

    function getSymbol(n) {
        return fruitMode ? FRUITS[n - 1] : String(n);
    }

    if (!button) return;

    function resetSlots() {
        reels.forEach((reel) => {
            if (!reel) return;
            if (gsap) gsap.set(reel, { y: 0 });
            reel.innerHTML = `<div class="slot-symbol">?</div>`;
        });
        const windowEls = [...document.querySelectorAll(".slot-window")];
        windowEls.forEach(w => w.classList.remove("glow-win", "glow-jackpot", "glow-dim"));
        const slotMachineEl = document.querySelector(".slot-machine");
        if (slotMachineEl) slotMachineEl.classList.remove("jackpot-flash");
    }

    // Reset whenever the slots panel becomes visible (tab switch back)
    const slotsPanel = document.getElementById("slots-game");
    if (slotsPanel) {
        new MutationObserver(() => {
            if (!slotsPanel.classList.contains("hidden")) resetSlots();
        }).observe(slotsPanel, { attributes: true, attributeFilter: ["class"] });
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
        if (button.disabled) { return; }
        button.disabled = true;

        // Clear any glow from the previous spin
        const windowEls = [...document.querySelectorAll(".slot-window")];
        const slotMachineEl = document.querySelector(".slot-machine");
        windowEls.forEach(w => w.classList.remove("glow-win", "glow-jackpot", "glow-dim"));
        if (slotMachineEl) slotMachineEl.classList.remove("jackpot-flash");

        // Pull the lever
        if (gsap && leverHandle) {
            const slotMachineEl = document.querySelector(".slot-machine");
            const tl = gsap.timeline();

            // Snap the lever down (pivot at bottom of stick)
            tl.to(leverHandle, { rotation: 34, duration: 0.18, ease: "power3.in" });

            // Machine shudder on impact
            if (slotMachineEl) {
                tl.to(slotMachineEl, { x: -5, duration: 0.06, ease: "none" }, 0.13)
                  .to(slotMachineEl, { x: 5, duration: 0.07, ease: "none" })
                  .to(slotMachineEl, { x: -3, duration: 0.06, ease: "none" })
                  .to(slotMachineEl, { x: 0,  duration: 0.08, ease: "power2.out" });
            }

            // Spring lever back with elastic bounce
            tl.to(leverHandle, { rotation: 0, duration: 1.0, ease: "elastic.out(1.3, 0.35)" }, 0.18);
        }

        // Fill the reels with temporary symbols while they spin
        reels.forEach((reel) => {
            if (!reel) return;

            const dir = Math.random() > 0.5 ? 1 : -1;
            reel.dataset.dir = String(dir);

            let html = "";
            for (let i = 0; i < 60; i += 1) {
                const r = Math.floor(Math.random() * 7) + 1;
                html += `<div class="slot-symbol">${getSymbol(r)}</div>`;
            }
            reel.innerHTML = html;

            if (gsap) {
                if (dir === 1) {
                    gsap.set(reel, { y: 0 });
                    gsap.to(reel, {
                        y: -(50 * symbolHeight),
                        duration: 3,
                        ease: "power2.inOut"
                    });
                } else {
                    gsap.set(reel, { y: -(50 * symbolHeight) });
                    gsap.to(reel, {
                        y: 0,
                        duration: 3,
                        ease: "power2.inOut"
                    });
                }
            }
        });

        // Fetch the final slot values
        const slotNums = await slotGameApi.play();

        // Stop each reel on the returned value
        reels.forEach((reel, index) => {
            if (!reel) return;

            if (gsap) {
                gsap.killTweensOf(reel);
            }

            const dir = Number.parseInt(reel.dataset.dir || "1", 10);
            let html = "";

            if (dir === 1) {
                for (let i = 0; i < 15; i += 1) {
                    const r = Math.floor(Math.random() * 7) + 1;
                    html += `<div class="slot-symbol">${getSymbol(r)}</div>`;
                }
                html += `<div class="slot-symbol winner">${getSymbol(slotNums[index])}</div>`;
                reel.innerHTML = html;

                if (gsap) {
                    gsap.set(reel, { y: 0 });
                    gsap.to(reel, {
                        y: -(15 * symbolHeight),
                        duration: 1.5 + (index * 0.5),
                        ease: "back.out(1.2)"
                    });
                }
            } else {
                html += `<div class="slot-symbol winner">${getSymbol(slotNums[index])}</div>`;
                for (let i = 0; i < 15; i += 1) {
                    const r = Math.floor(Math.random() * 7) + 1;
                    html += `<div class="slot-symbol">${getSymbol(r)}</div>`;
                }
                reel.innerHTML = html;

                if (gsap) {
                    gsap.set(reel, { y: -(15 * symbolHeight) });
                    gsap.to(reel, {
                        y: 0,
                        duration: 1.5 + (index * 0.5),
                        ease: "back.out(1.2)"
                    });
                }
            }
        });

        // Wait for the longest reel to finish
        await new Promise((resolve) => setTimeout(resolve, 2600));

        // Detect matches and light up the correct windows
        const [n1, n2, n3] = slotNums;
        const allMatch = n1 === n2 && n2 === n3;
        const matchIndices = allMatch
            ? [0, 1, 2]
            : n1 === n2 ? [0, 1]
            : n1 === n3 ? [0, 2]
            : n2 === n3 ? [1, 2]
            : [];

        if (allMatch) {
            // Jackpot — all 3 glow and machine flashes
            windowEls.forEach(w => w.classList.add("glow-jackpot"));
            if (slotMachineEl) slotMachineEl.classList.add("jackpot-flash");
            if (gsap) {
                gsap.fromTo(windowEls,
                    { scale: 1 },
                    { scale: 1.06, duration: 0.2, stagger: 0.07, ease: "back.out(2)", yoyo: true, repeat: 1 }
                );
            }
        } else if (matchIndices.length === 2) {
            // Two match — glow the pair, dim the odd one out
            const dimIndex = [0, 1, 2].find(i => !matchIndices.includes(i));
            matchIndices.forEach(i => windowEls[i].classList.add("glow-win"));
            if (dimIndex !== undefined) windowEls[dimIndex].classList.add("glow-dim");
            if (gsap) {
                const matchWins = matchIndices.map(i => windowEls[i]);
                gsap.fromTo(matchWins,
                    { scale: 1 },
                    { scale: 1.04, duration: 0.2, ease: "back.out(2)", yoyo: true, repeat: 1, stagger: 0.06 }
                );
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

    if (!headsButton) return;

    // Track accumulated rotation so GSAP always animates forward
    let totalRotation = 0;

    async function doFlip(guess) {
        headsButton.disabled = true;
        tailsButton.disabled = true;
        resultText.textContent = "Flipping...";
        choiceText.textContent = "";

        const result = coinFlipApi.play(guess);

        if (gsap && coin) {
            // Spin 8 full rotations, then land on the correct face
            const targetAngle = result === "Heads" ? 0 : 180;
            const currentMod = totalRotation % 360;
            let adjustment = targetAngle - currentMod;
            if (adjustment < 0) adjustment += 360;
            totalRotation += 8 * 360 + adjustment;

            await gsap.to(coin, {
                duration: 1.6,
                rotateY: totalRotation,
                ease: "power2.inOut"
            });
        }

        const won = guess === result;
        resultText.textContent = won
            ? `You win! It was ${result}`
            : `You lose. It was ${result}`;
        choiceText.textContent = `You chose: ${guess}`;

        headsButton.disabled = false;
        tailsButton.disabled = false;
        renderStats();
        renderRec();
    }

    headsButton.addEventListener("click", () => doFlip("Heads"));
    tailsButton.addEventListener("click", () => doFlip("Tails"));
}
import { getGameApi } from "./game.js";
import { renderStats } from "../stats/statsView.js";

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
        });
        controls.appendChild(button);
    });
}

export function initSlotView() {
    const button = document.getElementById("slot-roll");
    const reels = [];
    reels.push(document.getElementById("reel-1"));
    reels.push(document.getElementById("reel-2"));
    reels.push(document.getElementById("reel-3"));
    const gsap = globalThis.gsap || null;
    const symbolHeight = 140;

    if (!button) return;

    // Start with a neutral slot face
    reels.forEach((reel, index) => {
        if (reel) {
            reel.innerHTML = `<div class="slot-symbol">?</div>`;
        }
    });

    button.addEventListener("click", async () => {
        if (button.disabled) { return; }
        button.disabled = true;

        // Fill the reels with temporary symbols while they spin
        reels.forEach((reel) => {
            if (!reel) return;

            const dir = Math.random() > 0.5 ? 1 : -1;
            reel.dataset.dir = String(dir);

            let html = "";
            for (let i = 0; i < 60; i += 1) {
                const r = Math.floor(Math.random() * 7) + 1;
                html += `<div class="slot-symbol">${r}</div>`;
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
                    html += `<div class="slot-symbol">${r}</div>`;
                }
                html += `<div class="slot-symbol winner">${slotNums[index]}</div>`;
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
                html += `<div class="slot-symbol winner">${slotNums[index]}</div>`;
                for (let i = 0; i < 15; i += 1) {
                    const r = Math.floor(Math.random() * 7) + 1;
                    html += `<div class="slot-symbol">${r}</div>`;
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

        button.disabled = false;
        renderStats();
    });
}

export function initCoinFlipView() {
   const headsButton = document.getElementById("heads");
   const tailsButton = document.getElementById("tails");
   const resultText = document.getElementById("coinResult");
   const choiceText = document.getElementById("choice");

   if (!headsButton) return;

   headsButton.addEventListener("click", () => {
        const result = coinFlipApi.play("Heads");
        resultText.textContent = `Flipped: ${result}`;
        choiceText.textContent = "Choose: Heads";
        renderStats();
   });

   tailsButton.addEventListener("click", () => {
        const result = coinFlipApi.play("Tails");
        resultText.textContent = `Flipped: ${result}`;
        choiceText.textContent = "Choose: Tails";
        renderStats();
   });
}
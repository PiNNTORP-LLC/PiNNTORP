import { getGameApi } from "./game.js";
import { renderStats } from "../stats/statsView.js";

const diceGameApi = getGameApi("dice");
const slotGameApi = getGameApi("slots");

export function initGameView() {
    const controls = document.getElementById("game-controls");
    const result = document.getElementById("game-result");
    const dice = document.getElementById("dice");

    const diceRotations = {
        1: { x: 0, y: 0 },
        2: { x: 0, y: 180 },
        3: { x: 0, y: -90 },
        4: { x: 0, y: 90 },
        5: { x: -90, y: 0 },
        6: { x: 90, y: 0 }
    };

    [1, 2, 3, 4, 5, 6].forEach((value) => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = String(value);
        button.addEventListener("click", async () => {
            if (button.disabled) return;

            const buttons = controls.querySelectorAll("button");
            buttons.forEach(btn => btn.disabled = true);
            result.textContent = "Rolling...";

            // 1. Physics-based toss animation
            // Reset rotation to simple range to prevent massive numbers hanging
            gsap.set(dice, { rotationX: 0, rotationY: 0, rotationZ: 0 });

            const tossTl = gsap.timeline();

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
                scale: 1.0,
                rotationX: 1440,
                rotationY: 2160,
                rotationZ: 720,
                ease: "power2.in"
            });

            // 2. Fetch the result in parallel
            const round = await diceGameApi.play(value);

            // 3. Wait for toss to finish
            await tossTl;

            // 4. Final crisp landing
            const final = diceRotations[round.roll];

            gsap.to(dice, {
                duration: 0.8,
                rotationX: 1440 + final.x,
                rotationY: 2160 + final.y,
                rotationZ: 720,
                ease: "elastic.out(1, 0.75)",
                onComplete: () => {
                    result.textContent = round.won
                        ? `🎉 Win! Guessed ${round.guess}, rolled ${round.roll}`
                        : `❌ Loss. Guessed ${round.guess}, rolled ${round.roll}`;
                    renderStats();
                    buttons.forEach(btn => btn.disabled = false);
                }
            });
        });
        controls.appendChild(button);
    });
}

export function initSlotView() {
    const button = document.getElementById("slot-roll");
    const reels = [
        document.getElementById("reel-1"),
        document.getElementById("reel-2"),
        document.getElementById("reel-3")
    ];

    const symbolHeight = 140; // Matches CSS

    // Initial state setup
    reels.forEach(reel => {
        reel.innerHTML = `<div class="slot-symbol">?</div>`;
    });

    button.addEventListener("click", async () => {
        if (button.disabled) return;
        button.disabled = true;

        // 1. Setup the fake scrolling reels
        reels.forEach((reel) => {
            const dir = Math.random() > 0.5 ? 1 : -1;
            reel.dataset.dir = dir;

            let html = '';
            for (let i = 0; i < 60; i++) {
                const r = Math.floor(Math.random() * 7) + 1;
                html += `<div class="slot-symbol">${r}</div>`;
            }
            reel.innerHTML = html;

            // Loop scroll using GSAP while waiting
            if (dir === 1) {
                gsap.set(reel, { y: 0 });
                gsap.to(reel, {
                    y: -(50 * symbolHeight),
                    duration: 3,
                    ease: "power2.inOut",
                });
            } else {
                gsap.set(reel, { y: -(50 * symbolHeight) });
                gsap.to(reel, {
                    y: 0,
                    duration: 3,
                    ease: "power2.inOut",
                });
            }
        });

        // Await the actual game numbers from the server
        const slotNums = await slotGameApi.play();

        // 3. Lock them into their final destination staggering the finish
        reels.forEach((reel, index) => {
            gsap.killTweensOf(reel);
            const dir = parseInt(reel.dataset.dir || 1);

            let html = '';
            if (dir === 1) {
                for (let i = 0; i < 15; i++) {
                    const r = Math.floor(Math.random() * 7) + 1;
                    html += `<div class="slot-symbol">${r}</div>`;
                }
                // Add the real returned number as the final destination
                html += `<div class="slot-symbol winner">${slotNums[index]}</div>`;
                reel.innerHTML = html;

                gsap.set(reel, { y: 0 });
                gsap.to(reel, {
                    y: -(15 * symbolHeight),
                    duration: 1.5 + (index * 0.5), // Stagger stop times like real slots
                    ease: "back.out(1.2)"
                });
            } else {
                html += `<div class="slot-symbol winner">${slotNums[index]}</div>`;
                for (let i = 0; i < 15; i++) {
                    const r = Math.floor(Math.random() * 7) + 1;
                    html += `<div class="slot-symbol">${r}</div>`;
                }
                reel.innerHTML = html;

                gsap.set(reel, { y: -(15 * symbolHeight) });
                gsap.to(reel, {
                    y: 0,
                    duration: 1.5 + (index * 0.5),
                    ease: "back.out(1.2)"
                });
            }
        });

        // Promise to wait for the longest reel to complete
        await new Promise(r => setTimeout(r, 2600));

        renderStats();
        button.disabled = false;
    });
}

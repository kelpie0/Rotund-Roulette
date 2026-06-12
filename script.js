// 1. Data Store / Config Matrix Definition
const ROTUNDS = [
    // COMMON
    { id: "r1", name: "Rotund", file: "rotund.png", rarity: "COMMON", weight: 70, value: 10 },
    { id: "r2", name: "Silly Rotund", file: "sillyrotund.png", rarity: "COMMON", weight: 70, value: 10 },
    
    // UNCOMMON
    { id: "r3", name: "Blue Rotund", file: "bluerotund.png", rarity: "UNCOMMON", weight: 50, value: 25 },
    { id: "r4", name: "Pink Rotund", file: "pinkrotund.png", rarity: "UNCOMMON", weight: 50, value: 25 },
    { id: "r5", name: "Green Rotund", file: "greenrotund.png", rarity: "UNCOMMON", weight: 50, value: 25 },
    { id: "r6", name: "Yellow Rotund", file: "yellowrotund.png", rarity: "UNCOMMON", weight: 50, value: 25 },
    { id: "r8", name: "Red Rotund", file: "redrotund.png", rarity: "UNCOMMON", weight: 50, value: 25 },
    
    // RARE
    { id: "r7", name: "Gold Rotund", file: "goldrotund.png", rarity: "RARE", weight: 25, value: 75 },
    { id: "r18", name: "Italian Rotund", file: "italianrotund.png", rarity: "RARE", weight: 25, value: 75 },
    { id: "r19", name: "Nerd Rotund", file: "nerdrotund.png", rarity: "RARE", weight: 25, value: 75 },
    
    // EPIC
    { id: "r9", name: "Rainbow Rotund", file: "rainbowrotund.png", rarity: "EPIC", weight: 10, value: 200 },
    { id: "r10", name: "Minecraft Rotund", file: "minecraftrotund.png", rarity: "EPIC", weight: 10, value: 200 },
    
    // LEGENDARY
    { id: "r16", name: "Devil Rotund", file: "devilrotund.png", rarity: "LEGENDARY", weight: 0.5, value: 1500 },
    { id: "r13", name: "Vulkan Rotund", file: "vulkanrotund.png", rarity: "LEGENDARY", weight: 1, value: 1000 },
    { id: "r12", name: "Matrix Rotund", file: "matrixrotund.png", rarity: "LEGENDARY", weight: 2, value: 750 },
    { id: "r17", name: "Cool Rotund", file: "coolrotund.png", rarity: "LEGENDARY", weight: 3, value: 600 },
    
    // MYTHIC
    { id: "r14", name: "Galaxy Rotund", file: "galaxyrotund.png", rarity: "MYTHIC", weight: 0.25, value: 5000 },
    
    // SECRET
    { id: "r15", name: "Dapper Rotund", file: "dapperrotund.png", rarity: "SECRET", weight: 0.01, value: 75000 },
    { id: "r11", name: "32 Bit Rotund", file: "32bitrotund.png", rarity: "SECRET", weight: 0.05, value: 25000 }
];

// Progressive Purchase Configurations 
const UPGRADE_DATA = {
    quickRoll: { max: 4, baseCost: 300, multiplier: 2.5 },
    doubleRoll: { max: 3, baseCost: 1000, multiplier: 3.5 },
    luck: { max: 5, baseCost: 500, multiplier: 3.0 },
    autoRoll: { max: 1, baseCost: 800, multiplier: 1 }
};

let Player = {
    coins: 0,
    inventory: {},
    upgrades: { quickRoll: 0, doubleRoll: 0, luck: 0, autoRoll: 0 },
    autoRollActive: false
};

let isSpinning = false; // Core system intercept lock to completely prevent layout freeze states

// LocalStorage Engine Wrapper
const Storage = {
    saveKey: "RotundRoulette_SaveState_v2",
    save() {
        const payload = {
            coins: Player.coins,
            inventory: Player.inventory,
            upgrades: Player.upgrades
        };
        localStorage.setItem(this.saveKey, JSON.stringify(payload));
    },
    load() {
        const raw = localStorage.getItem(this.saveKey);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (typeof parsed.coins === "number") Player.coins = parsed.coins;
            if (parsed.inventory) Player.inventory = parsed.inventory;
            if (parsed.upgrades) Player.upgrades = { ...Player.upgrades, ...parsed.upgrades };
        } catch (e) {
            console.error("Failed to parse saved session data:", e);
        }
    }
};

// Procedural Non-Asset Synthesizer Audio Engine
const AudioFX = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    tick() {
        this.init();
        let osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(520, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + 0.03);
        osc.start(); osc.stop(this.ctx.currentTime + 0.03);
    },
    win(rarity) {
        this.init();
        let now = this.ctx.currentTime;
        if (rarity === "SECRET") {
            let osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = "sawtooth"; osc.connect(gain); gain.connect(this.ctx.destination);
            osc.frequency.setValueAtTime(55, now);
            osc.frequency.linearRampToValueAtTime(110, now + 2.5);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.00001, now + 3);
            osc.start(); osc.stop(now + 3);
            return;
        }
        let notes = ["LEGENDARY", "MYTHIC"].includes(rarity) 
            ? [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50] 
            : [392.00, 523.25];
        notes.forEach((freq, idx) => {
            let osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            if (rarity === "MYTHIC") osc.type = "triangle";
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.frequency.setValueAtTime(freq, now + (idx * 0.06));
            gain.gain.setValueAtTime(0.05, now + (idx * 0.06));
            gain.gain.exponentialRampToValueAtTime(0.00001, now + (idx * 0.06) + 0.4);
            osc.start(now + (idx * 0.06)); osc.stop(now + (idx * 0.06) + 0.4);
        });
    }
};

// 2. Core Dynamic Luck-Assisted Roulette Drop Calculations
function getRandomRotund() {
    let dynamicTotalWeight = 0;
    
    const activeWeights = ROTUNDS.map(item => {
        let currentWeight = item.weight;
        if (item.rarity !== "COMMON") {
            currentWeight = item.weight * (1 + (Player.upgrades.luck * 0.10));
        }
        dynamicTotalWeight += currentWeight;
        return { item, adjustedWeight: currentWeight };
    });

    let rand = Math.random() * dynamicTotalWeight;
    for (const entry of activeWeights) {
        if (rand < entry.adjustedWeight) return entry.item;
        rand -= entry.adjustedWeight;
    }
    return ROTUNDS[0];
}

// 3. Main Rolling UI Generator Matrix
const stackContainer = document.getElementById("roulette-stack-container");
const rollBtn = document.getElementById("roll-button");
const autoBtn = document.getElementById("auto-roll-btn");
const resultDisplay = document.getElementById("result-display");
const resultsWrapper = document.getElementById("results-wrapper");

const ITEM_WIDTH = 111; 
const TARGET_INDEX = 35;

function syncRouletteViewports() {
    stackContainer.innerHTML = "";
    const totalTracks = 1 + Player.upgrades.doubleRoll;
    for (let i = 0; i < totalTracks; i++) {
        const viewport = document.createElement("div");
        viewport.className = "roulette-viewport";
        viewport.innerHTML = `
            <div class="marker"></div>
            <div class="placeholder-card">READY TO ROLL</div>
            <div class="track hidden"></div>
        `;
        stackContainer.appendChild(viewport);
    }
}

function buildIndividualTrack(trackNode, winningItem) {
    trackNode.innerHTML = "";
    const sequence = [];
    for (let i = 0; i < 42; i++) {
        sequence.push(i === TARGET_INDEX ? winningItem : ROTUNDS[Math.floor(Math.random() * ROTUNDS.length)]);
    }
    sequence.forEach(item => {
        const node = document.createElement("div");
        node.className = `ticker-item glow-${item.rarity.toLowerCase()}`;
        node.innerHTML = `
            <img src="images/${item.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
            <span style="color: var(--${item.rarity.toLowerCase()})">${item.name}</span>
        `;
        trackNode.appendChild(node);
    });
}

function spin() {
    if (isSpinning) return;
    isSpinning = true;
    rollBtn.disabled = true;
    resultDisplay.classList.add("hidden");

    const totalTracks = 1 + Player.upgrades.doubleRoll;
    const winners = [];
    const trackElements = [];
    const targetTranslations = [];

    const viewports = stackContainer.querySelectorAll(".roulette-viewport");
    const viewportWidth = stackContainer.clientWidth;

    for (let i = 0; i < totalTracks; i++) {
        const winner = getRandomRotund();
        winners.push(winner);

        const placeholder = viewports[i].querySelector(".placeholder-card");
        const trackEl = viewports[i].querySelector(".track");

        placeholder.classList.add("hidden");
        trackEl.classList.remove("hidden");

        buildIndividualTrack(trackEl, winner);
        trackElements.push(trackEl);

        const targetOffset = (TARGET_INDEX * ITEM_WIDTH) - (viewportWidth / 2) + (ITEM_WIDTH / 2);
        const staggerVariance = (Math.floor(Math.random() * 30) - 15);
        targetTranslations.push(targetOffset + staggerVariance);
    }

    let startTime = null;
    let duration = 4200;
    if (Player.upgrades.quickRoll > 0) {
        const intervals = [4200, 2200, 1000, 500, 250];
        duration = intervals[Player.upgrades.quickRoll];
    }

    let lastTickIndex = 0;

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 5);
        
        for (let i = 0; i < totalTracks; i++) {
            const currentX = -(targetTranslations[i] * easeOut);
            trackElements[i].style.transform = `translateX(${currentX}px)`;
        }

        const primaryX = -(targetTranslations[0] * easeOut);
        const currentTickIndex = Math.floor(Math.abs(primaryX - (viewportWidth / 2)) / ITEM_WIDTH);
        if (currentTickIndex !== lastTickIndex) {
            AudioFX.tick();
            lastTickIndex = currentTickIndex;
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            processSpinResults(winners);
        }
    }
    requestAnimationFrame(animate);
}

function processSpinResults(winners) {
    let secretItem = winners.find(w => w.rarity === "SECRET");
    if (secretItem) {
        Cinematics.triggerSecret(secretItem, winners);
    } else {
        finalizeSpin(winners);
    }
}

function finalizeSpin(winners) {
    resultsWrapper.innerHTML = "";
    let highestRarity = "COMMON";

    winners.forEach(winner => {
        Player.inventory[winner.id] = (Player.inventory[winner.id] || 0) + 1;
        Player.coins += winner.value;

        const card = document.createElement("div");
        card.className = `result-card glow-${winner.rarity.toLowerCase()}`;
        card.innerHTML = `
            <img src="images/${winner.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'64\' height=\'64\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'1.5\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
            <span class="badge" style="background-color: var(--${winner.rarity.toLowerCase()})">${winner.rarity}</span>
            <h2>${winner.name}</h2>
            <div class="result-coin-row">
                <span>+${winner.value}</span>
                <img src="images/rotundcoin.png" class="coin-icon" onerror="this.style.display='none'">
            </div>
        `;
        resultsWrapper.appendChild(card);
        highestRarity = winner.rarity;
    });

    document.getElementById("coin-balance").innerText = Player.coins.toLocaleString();
    resultDisplay.classList.remove("hidden");
    
    if (highestRarity === "LEGENDARY") document.body.classList.add("flash-yellow");
    if (highestRarity === "MYTHIC") document.body.classList.add("flash-purple");
    setTimeout(() => { document.body.className = ""; }, 500);

    AudioFX.win(highestRarity);
    Menu.updateInventory();
    
    Storage.save(); // Save engine step

    isSpinning = false; 

    if (Player.autoRollActive) {
        setTimeout(() => { if (Player.autoRollActive) spin(); }, 1000);
    } else {
        rollBtn.disabled = false;
    }
}

// 4. Secret Cinematic Modal Takeover Interceptor
const Cinematics = {
    cachedWinners: null,
    triggerSecret(secretItem, fullWinnersList) {
        this.cachedWinners = fullWinnersList;
        document.body.classList.add("shake-matrix");
        AudioFX.win("SECRET");

        setTimeout(() => {
            document.body.classList.remove("shake-matrix");
            const stage = document.getElementById("secret-stage");
            document.getElementById("secret-epicenter-img").src = `images/${secretItem.file}`;
            document.getElementById("secret-epicenter-name").innerText = secretItem.name;
            document.getElementById("secret-epicenter-name").style.color = "var(--secret)";
            stage.classList.remove("hidden-stage");
        }, 600);
    },
    dismissSecret() {
        document.getElementById("secret-stage").classList.add("hidden-stage");
        finalizeSpin(this.cachedWinners);
    }
};

// 5. Responsive Floating Drawer Sub-Navigation Layout Managers
const Menu = {
    toggle() {
        document.getElementById("menu-drawer").classList.toggle("hidden-drawer");
        this.updateInventory();
        this.updateIndex();
        Shop.renderTrackers();
    },
    switchTab(tabName) {
        document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden-tab"));
        document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));
        document.getElementById(`tab-${tabName}`).classList.remove("hidden-tab");
        if(window.event && window.event.target) window.event.target.classList.add("active");
    },
    updateInventory() {
        const grid = document.getElementById("inventory-grid"); grid.innerHTML = "";
        let empty = true;
        ROTUNDS.forEach(item => {
            const count = Player.inventory[item.id] || 0;
            if (count > 0) {
                empty = false;
                const card = document.createElement("div");
                card.className = `inv-card glow-${item.rarity.toLowerCase()}`;
                card.innerHTML = `
                    <span class="inv-qty">x${count}</span>
                    <img src="images/${item.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
                    <div class="inv-name" style="color: var(--${item.rarity.toLowerCase()})">${item.name}</div>
                `;
                grid.appendChild(card);
            }
        });
        if (empty) grid.innerHTML = `<p class="placeholder-card" style="grid-column: span 3; padding: 2rem 0; font-size:0.7rem;">Empty</p>`;
    },
    updateIndex() {
        const list = document.getElementById("index-list"); list.innerHTML = "";
        
        let totalWeight = 0;
        const adjustedTable = ROTUNDS.map(item => {
            let w = item.weight;
            if(item.rarity !== "COMMON") w = item.weight * (1 + (Player.upgrades.luck * 0.10));
            totalWeight += w;
            return { ...item, calcWeight: w };
        });

        [...adjustedTable].sort((a,b) => b.calcWeight - a.calcWeight).forEach(item => {
            const row = document.createElement("div");
            row.className = `index-row glow-${item.rarity.toLowerCase()}`;
            
            const isLuckBoosted = Player.upgrades.luck > 0 && item.rarity !== "COMMON";
            const percentText = ((item.calcWeight / totalWeight) * 100).toFixed(3);

            row.innerHTML = `
                <div class="index-left">
                    <img src="images/${item.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
                    <div>
                        <div class="index-title">${item.name}</div>
                        <span style="font-size:0.55rem; font-weight:800; color: var(--${item.rarity.toLowerCase()})">${item.rarity}</span>
                    </div>
                </div>
                <div class="index-pct ${isLuckBoosted ? 'boosteded' : ''}">${percentText}%</div>
            `;
            list.appendChild(row);
        });
    }
};

// 6. Stage Progression Multi-Tier Shop Purchase Handler
const Shop = {
    getCost(type, currentTier) {
        const cfg = UPGRADE_DATA[type];
        return Math.floor(cfg.baseCost * Math.pow(cfg.multiplier, currentTier));
    },
    renderTrackers() {
        Object.keys(UPGRADE_DATA).forEach(type => {
            const current = Player.upgrades[type];
            const max = UPGRADE_DATA[type].max;
            
            const container = document.getElementById(`track-${type}`);
            container.innerHTML = "";
            for (let i = 1; i <= max; i++) {
                const capsule = document.createElement("div");
                capsule.className = `tier-capsule ${i <= current ? 'active' : ''}`;
                container.appendChild(capsule);
            }

            const btn = document.getElementById(`buy-${type}`);
            if (current >= max) {
                btn.innerText = "MAXED";
                btn.classList.add("unlocked");
                btn.disabled = true;
            } else {
                const cost = this.getCost(type, current);
                btn.innerHTML = `${cost.toLocaleString()} <img src="images/rotundcoin.png" class="coin-icon" onerror="this.style.display='none'">`;
                btn.classList.remove("unlocked");
                btn.disabled = false;
            }
        });
    },
    buy(type) {
        const current = Player.upgrades[type];
        const max = UPGRADE_DATA[type].max;
        if (current >= max) return;

        const cost = this.getCost(type, current);
        if (Player.coins >= cost) {
            Player.coins -= cost;
            Player.upgrades[type]++;
            
            document.getElementById("coin-balance").innerText = Player.coins.toLocaleString();
            this.renderTrackers();

            if (type === "doubleRoll") {
                syncRouletteViewports();
            }
            if (type === "luck") {
                Menu.updateIndex();
            }
            if (type === "autoRoll" && Player.upgrades.autoRoll > 0) {
                autoBtn.classList.remove("hidden-upgrade");
            }
            
            Storage.save(); // Save engine step
        } else {
            alert("Insufficient RotundCoins!");
        }
    }
};

// 7. Core Native Global Event Hook Wireframes
autoBtn.addEventListener("click", () => {
    Player.autoRollActive = !Player.autoRollActive;
    if (Player.autoRollActive) {
        autoBtn.innerText = "AUTO: ON";
        autoBtn.classList.add("active-mode");
        if (!isSpinning) spin();
    } else {
        autoBtn.innerText = "AUTO: OFF";
        autoBtn.classList.remove("active-mode");
        if (!isSpinning) {
            rollBtn.disabled = false;
        }
    }
});

rollBtn.addEventListener("click", spin);

// Boot Setup Initialization
Storage.load(); // Process file read before rendering view states
document.getElementById("coin-balance").innerText = Player.coins.toLocaleString();

if (Player.upgrades.autoRoll > 0) {
    autoBtn.classList.remove("hidden-upgrade");
}

syncRouletteViewports();
Shop.renderTrackers();
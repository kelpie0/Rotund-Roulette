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
    { id: "r11", name: "32 Bit Rotund", file: "32bitrotund.png", rarity: "SECRET", weight: 0.05, value: 25000 },

    // ANGELIC
    { id: "r20", name: "Rebirth Rotund", file: "rebirthrotund.png", rarity: "ANGELIC", weight: 0.0005, value: 5000000 }
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
    rebirths: 0,
    inventory: {},
    upgrades: { quickRoll: 0, doubleRoll: 0, luck: 0, autoRoll: 0 },
    autoRollActive: false
};

let isSpinning = false; // Core system intercept lock to completely prevent layout freeze states
let animationFrameId = null; // Background loop crash protector pointer
let awayStartTime = null; // Millisecond marker timestamp for tab out calculations

// LocalStorage Engine Wrapper
const Storage = {
    saveKey: "RotundRoulette_SaveState_v3",
    save() {
        const payload = {
            coins: Player.coins,
            rebirths: Player.rebirths,
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
            if (typeof parsed.rebirths === "number") Player.rebirths = parsed.rebirths;
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
        if (rarity === "SECRET" || rarity === "ANGELIC") {
            let osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = rarity === "ANGELIC" ? "sine" : "sawtooth"; 
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.frequency.setValueAtTime(rarity === "ANGELIC" ? 440 : 55, now);
            osc.frequency.linearRampToValueAtTime(rarity === "ANGELIC" ? 880 : 110, now + 2.5);
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
    },
    rebirthBoom() {
        this.init();
        let now = this.ctx.currentTime;
        let osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = "triangle"; osc.connect(gain); gain.connect(this.ctx.destination);
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 1.5);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 2.0);
        osc.start(); osc.stop(now + 2.0);
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

function syncHUD() {
    document.getElementById("coin-balance").innerText = Player.coins.toLocaleString();
    document.getElementById("rebirth-balance").innerText = Player.rebirths.toLocaleString();
    document.getElementById("multiplier-value").innerText = `${(1 + Player.rebirths)}x`;
}

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
            if (trackElements[i]) trackElements[i].style.transform = `translateX(${currentX}px)`;
        }

        const primaryX = -(targetTranslations[0] * easeOut);
        const currentTickIndex = Math.floor(Math.abs(primaryX - (viewportWidth / 2)) / ITEM_WIDTH);
        if (currentTickIndex !== lastTickIndex) {
            AudioFX.tick();
            lastTickIndex = currentTickIndex;
        }

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            processSpinResults(winners);
        }
    }
    animationFrameId = requestAnimationFrame(animate);
}

function processSpinResults(winners) {
    let specialItem = winners.find(w => ["SECRET", "ANGELIC"].includes(w.rarity));
    if (specialItem) {
        Cinematics.triggerSecret(specialItem, winners);
    } else {
        finalizeSpin(winners);
    }
}

function finalizeSpin(winners) {
    resultsWrapper.innerHTML = "";
    let highestRarity = "COMMON";
    const multiplier = 1 + Player.rebirths;

    winners.forEach(winner => {
        Player.inventory[winner.id] = (Player.inventory[winner.id] || 0) + 1;
        const scaledValue = winner.value * multiplier;
        Player.coins += scaledValue;

        const card = document.createElement("div");
        card.className = `result-card glow-${winner.rarity.toLowerCase()}`;
        card.innerHTML = `
            <img src="images/${winner.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'64\' height=\'64\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'1.5\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
            <span class="badge" style="background-color: var(--${winner.rarity.toLowerCase()})">${winner.rarity}</span>
            <h2>${winner.name}</h2>
            <div class="result-coin-row">
                <span>+${scaledValue.toLocaleString()}</span>
                <img src="images/rotundcoin.png" class="coin-icon" onerror="this.style.display='none'">
            </div>
        `;
        resultsWrapper.appendChild(card);
        highestRarity = winner.rarity;
    });

    syncHUD();
    resultDisplay.classList.remove("hidden");
    
    if (highestRarity === "LEGENDARY") document.body.classList.add("flash-yellow");
    if (highestRarity === "MYTHIC") document.body.classList.add("flash-purple");
    if (highestRarity === "ANGELIC") document.body.classList.add("flash-blue");
    setTimeout(() => { document.body.className = ""; }, 500);

    AudioFX.win(highestRarity);
    Menu.updateInventory();
    Shop.checkRebirthAvailability();
    
    Storage.save(); 

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
        AudioFX.win(secretItem.rarity);

        setTimeout(() => {
            document.body.classList.remove("shake-matrix");
            const stage = document.getElementById("secret-stage");
            const alertText = secretItem.rarity === "ANGELIC" ? "👼 ANGELIC ACQUISITION 👼" : "🚨 SECRET ACQUISITION 🚨";
            document.querySelector(".secret-alert").innerText = alertText;
            document.getElementById("secret-epicenter-img").src = `images/${secretItem.file}`;
            document.getElementById("secret-epicenter-name").innerText = secretItem.name;
            document.getElementById("secret-epicenter-name").style.color = `var(--${secretItem.rarity.toLowerCase()})`;
            stage.classList.remove("hidden-stage");
        }, 600);
    },
    dismissSecret() {
        document.getElementById("secret-stage").classList.add("hidden-stage");
        finalizeSpin(this.cachedWinners);
    },
    executeRebirthSequence() {
        const stage = document.getElementById("rebirth-cinematic-stage");
        const counter = document.getElementById("rebirth-odometer-counter");
        
        // Setup initial view context
        counter.innerText = Player.rebirths;
        stage.classList.remove("hidden-stage");
        document.body.classList.add("shake-matrix");
        AudioFX.rebirthBoom();

        // Roll odometer upward state changes
        setTimeout(() => {
            let startVal = Player.rebirths;
            Player.rebirths++;
            
            // Hard Wipe Progress States
            Player.coins = 0;
            Player.inventory = {};
            Object.keys(Player.upgrades).forEach(key => Player.upgrades[key] = 0);
            
            // Handle graphical ticks
            counter.classList.add("odometer-tick");
            setTimeout(() => {
                counter.innerText = Player.rebirths;
                counter.classList.remove("odometer-tick");
                document.body.classList.remove("shake-matrix");
            }, 300);

        }, 1500);

        // Soft Outro Fading Systems
        setTimeout(() => {
            stage.style.opacity = "0";
            setTimeout(() => {
                stage.classList.add("hidden-stage");
                stage.style.opacity = "1";
                
                // Reboot Graphics Matrix Layout Modules
                syncHUD();
                syncRouletteViewports();
                Shop.renderTrackers();
                Menu.updateInventory();
                Menu.updateIndex();
                
                if(document.getElementById("menu-drawer").classList.contains("hidden-drawer") === false) {
                    Menu.toggle(); // Clean close drawer context
                }
                
                Storage.save();
                
                if (Player.autoRollActive) {
                    isSpinning = false;
                    spin();
                }
            }, 500);
        }, 4000);
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
            const percentText = ((item.calcWeight / totalWeight) * 100).toFixed(4);

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
    checkRebirthAvailability() {
        let allMaxed = true;
        Object.keys(UPGRADE_DATA).forEach(type => {
            if (Player.upgrades[type] < UPGRADE_DATA[type].max) allMaxed = false;
        });

        const section = document.getElementById("rebirth-shop-section");
        const btn = document.getElementById("execute-rebirth-btn");

        if (allMaxed) {
            section.classList.remove("rebirth-locked");
            section.classList.add("rebirth-available-pulse");
            btn.disabled = false;
            btn.innerText = "ASCEND NOW";
        } else {
            section.classList.add("rebirth-locked");
            section.classList.remove("rebirth-available-pulse");
            btn.disabled = true;
            btn.innerText = "REQUIRES ALL MAX UPGRADES";
        }
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
        this.checkRebirthAvailability();
    },
    buy(type) {
        const current = Player.upgrades[type];
        const max = UPGRADE_DATA[type].max;
        if (current >= max) return;

        const cost = this.getCost(type, current);
        if (Player.coins >= cost) {
            Player.coins -= cost;
            Player.upgrades[type]++;
            
            syncHUD();
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
            
            Storage.save(); 
        } else {
            alert("Insufficient RotundCoins!");
        }
    }
};

// 7. Dynamic UI Modal Manager (New Logic Block)
const UIManager = {
    modal: document.getElementById("offline-modal"),
    grid: document.getElementById("offline-item-grid"),
    summary: document.getElementById("offline-summary-text"),
    coins: document.getElementById("offline-coins-gained"),

    showOfflineModal(rollsMissed, gains) {
        // Clear previous data
        this.grid.innerHTML = "";
        
        // Update labels
        this.summary.innerText = `Your Auto-Roller completed ${rollsMissed.toLocaleString()} sets while you were away.`;
        this.coins.innerText = `+${gains.coins.toLocaleString()}`;

        // Populate Grid (Formatted like Inventory)
        Object.keys(gains.items).forEach(itemId => {
            const rotundDef = ROTUNDS.find(r => r.id === itemId);
            const quantity = gains.items[itemId];

            if (rotundDef) {
                const card = document.createElement("div");
                // Reuse existing inventory classes for consistency
                card.className = `inv-card glow-${rotundDef.rarity.toLowerCase()}`;
                card.innerHTML = `
                    <span class="inv-qty">x${quantity.toLocaleString()}</span>
                    <img src="images/${rotundDef.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
                    <div class="inv-name" style="color: var(--${rotundDef.rarity.toLowerCase()})">${rotundDef.name}</div>
                `;
                this.grid.appendChild(card);
            }
        });

        // Unhide Modal
        this.modal.classList.remove("hidden-modal");
    },

    claimOfflineRewards() {
        this.modal.classList.add("hidden-modal");
        
        // Resume Auto-Rolling Loop if still active
        if (Player.autoRollActive && !isSpinning) {
            spin();
        }
    }
};

// 8. Core Native Global Event Hook Wireframes & Page Visibility Interceptor
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

// Page Visibility API - Simulates background rolls dynamically
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        if (Player.autoRollActive) {
            awayStartTime = Date.now();
        }
    } else {
        // Tab became active again
        if (awayStartTime && Player.autoRollActive) {
            const elapsed = Date.now() - awayStartTime;
            awayStartTime = null;

            // Gather roll processing speed context
            const intervals = [4200, 2200, 1000, 500, 250];
            const baseDuration = intervals[Player.upgrades.quickRoll];
            const fullCycleTime = baseDuration + 1000; // spin run + auto cooldown gap

            const calculatedRolls = Math.floor(elapsed / fullCycleTime);

            if (calculatedRolls > 0) {
                // Instantly snap and wipe active frozen visual loops
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                isSpinning = false;
                rollBtn.disabled = false;

                // Data tracking object
                let gains = { coins: 0, items: {} };
                const safeMaxLimit = Math.min(calculatedRolls, 50000); // Safety buffer block
                const multiplier = 1 + Player.rebirths;

                // Run fast-forward matrix calculations
                for (let i = 0; i < safeMaxLimit; i++) {
                    const totalTracks = 1 + Player.upgrades.doubleRoll;
                    for (let t = 0; t < totalTracks; t++) {
                        const winner = getRandomRotund();
                        const scaledValue = winner.value * multiplier;
                        
                        // Apply to live state
                        Player.inventory[winner.id] = (Player.inventory[winner.id] || 0) + 1;
                        Player.coins += scaledValue;
                        
                        // Track for modal display
                        gains.coins += scaledValue;
                        gains.items[winner.id] = (gains.items[winner.id] || 0) + 1;
                    }
                }

                // Update HUD and Save
                syncHUD();
                Menu.updateInventory();
                Shop.checkRebirthAvailability();
                Storage.save();

                // Trigger New Missed Rewards Modal
                UIManager.showOfflineModal(calculatedRolls, gains);
                
                // Reset visual tracks state
                syncRouletteViewports();
            } else {
                // If they tabbed back in before a full cycle completed, just resume
                if (Player.autoRollActive && !isSpinning) {
                    spin();
                }
            }
        }
    }
});

// Boot Setup Initialization
Storage.load(); 
syncHUD();

if (Player.upgrades.autoRoll > 0) {
    autoBtn.classList.remove("hidden-upgrade");
}

syncRouletteViewports();
Shop.renderTrackers();
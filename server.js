// 1. Data Store / Config Matrix Definition
const MUTATIONS = {
    // Exact probabilities calculated to sum to 100%. (0.749499 represents ~74.95%)
    NONE: { id: "none", chance: 0.749499, name: "", multiplier: 1, color: "transparent" },
    GOLD: { id: "gold", chance: 0.20, name: "Gold", multiplier: 2, color: "gold" },
    DIAMOND: { id: "diamond", chance: 0.05, name: "Diamond", multiplier: 5, color: "cyan" },
    RAINBOW: { id: "rainbow", chance: 0.0005, name: "Rainbow", multiplier: 20, color: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)" },
    VOID: { id: "void", chance: 0.000001, name: "Void", multiplier: 100, color: "black" }
};

const Game = {
    rebirth() {
        if (!confirm("Are you sure you want to Rebirth? This will reset your coins, inventory, and upgrades!")) return;
        Player.coins = 0;
        Player.inventory = {};
        Player.upgrades = { quickRoll: 0, doubleRoll: 0, luck: 0, autoRoll: 0 };
        Player.autoRollActive = false;
        autoBtn.innerText = "AUTO: OFF";
        autoBtn.classList.remove("active-mode");
        document.getElementById("coin-balance").innerText = "0";
        document.getElementById("auto-roll-btn").classList.add("hidden-upgrade");
        syncRouletteViewports();
        Menu.updateInventory();
        Menu.updateIndex();
        Shop.renderTrackers();
        Storage.save();
        location.reload(); 
    }
};

const ROTUNDS = [
    { id: "r1", name: "Rotund", file: "rotund.png", rarity: "COMMON", weight: 70, value: 10 },
    { id: "r2", name: "Silly Rotund", file: "sillyrotund.png", rarity: "COMMON", weight: 70, value: 10 },
    { id: "r3", name: "Blue Rotund", file: "bluerotund.png", rarity: "UNCOMMON", weight: 50, value: 25 },
    { id: "r4", name: "Pink Rotund", file: "pinkrotund.png", rarity: "UNCOMMON", weight: 50, value: 25 },
    { id: "r5", name: "Green Rotund", file: "greenrotund.png", rarity: "UNCOMMON", weight: 50, value: 25 },
    { id: "r6", name: "Yellow Rotund", file: "yellowrotund.png", rarity: "UNCOMMON", weight: 50, value: 25 },
    { id: "r8", name: "Red Rotund", file: "redrotund.png", rarity: "UNCOMMON", weight: 50, value: 25 },
    { id: "r7", name: "Gold Rotund", file: "goldrotund.png", rarity: "RARE", weight: 25, value: 75 },
    { id: "r18", name: "Italian Rotund", file: "italianrotund.png", rarity: "RARE", weight: 25, value: 75 },
    { id: "r19", name: "Nerd Rotund", file: "nerdrotund.png", rarity: "RARE", weight: 25, value: 75 },
    { id: "r9", name: "Rainbow Rotund", file: "rainbowrotund.png", rarity: "EPIC", weight: 10, value: 200 },
    { id: "r10", name: "Minecraft Rotund", file: "minecraftrotund.png", rarity: "EPIC", weight: 10, value: 200 },
    { id: "r16", name: "Devil Rotund", file: "devilrotund.png", rarity: "LEGENDARY", weight: 0.5, value: 1500 },
    { id: "r13", name: "Vulkan Rotund", file: "vulkanrotund.png", rarity: "LEGENDARY", weight: 1, value: 1000 },
    { id: "r12", name: "Matrix Rotund", file: "matrixrotund.png", rarity: "LEGENDARY", weight: 2, value: 750 },
    { id: "r17", name: "Cool Rotund", file: "coolrotund.png", rarity: "LEGENDARY", weight: 3, value: 600 },
    { id: "r14", name: "Galaxy Rotund", file: "galaxyrotund.png", rarity: "MYTHIC", weight: 0.25, value: 5000 },
    { id: "r15", name: "Dapper Rotund", file: "dapperrotund.png", rarity: "SECRET", weight: 0.01, value: 75000 },
    { id: "r11", name: "32 Bit Rotund", file: "32bitrotund.png", rarity: "SECRET", weight: 0.05, value: 25000 },
    { id: "r20", name: "Rebirth Rotund", file: "rebirthrotund.png", rarity: "ANGELIC", weight: 0.0005, value: 5000000 }
];

const UPGRADE_DATA = {
    quickRoll: { max: 4, baseCost: 300, multiplier: 2.5 },
    doubleRoll: { max: 3, baseCost: 1000, multiplier: 3.5 },
    luck: { max: 5, baseCost: 500, multiplier: 3.0 },
    autoRoll: { max: 1, baseCost: 800, multiplier: 1 }
};

let Player = {
    coins: 0,
    rebirths: 0,
    inventory: {}, // Format is now: "r1-gold": 1
    lifetimeStats: {},
    upgrades: { quickRoll: 0, doubleRoll: 0, luck: 0, autoRoll: 0 },
    autoRollActive: false
};

let isSpinning = false; 
let animationFrameId = null; 
let awayStartTime = null; 

const Storage = {
    saveKey: "RotundRoulette_SaveState_v5",
    save() {
        const payload = {
            coins: Player.coins, rebirths: Player.rebirths,
            inventory: Player.inventory, lifetimeStats: Player.lifetimeStats,
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
            if (parsed.inventory) {
                // Migration catch for old pre-mutation saves
                const migratedInv = {};
                Object.keys(parsed.inventory).forEach(k => {
                    if(!k.includes("-")) migratedInv[`${k}-none`] = parsed.inventory[k];
                    else migratedInv[k] = parsed.inventory[k];
                });
                Player.inventory = migratedInv;
            }
            if (parsed.lifetimeStats) Player.lifetimeStats = parsed.lifetimeStats;
            if (parsed.upgrades) Player.upgrades = { ...Player.upgrades, ...parsed.upgrades };
        } catch (e) {
            console.error("Failed to parse saved session data:", e);
        }
    }
};

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
            ? [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50] : [392.00, 523.25];
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
function calculateWeightsMatrix() {
    let totalWeight = 0;
    const table = ROTUNDS.map(item => {
        let w = item.weight;
        if (item.rarity !== "COMMON") {
            w = item.weight * (1 + (Player.upgrades.luck * 0.10));
        }
        totalWeight += w;
        return { ...item, calcWeight: w };
    });
    return { table, totalWeight };
}

function getRandomRotund() {
    const { table, totalWeight } = calculateWeightsMatrix();
    let rand = Math.random() * totalWeight;
    let base = ROTUNDS[0];
    for (const entry of table) {
        if (rand < entry.calcWeight) { base = entry; break; }
        rand -= entry.calcWeight;
    }

    // Roll for Mutation Overlay
    let mRand = Math.random();
    let mutationStr = "none";
    let cumulative = 0;
    for (const key in MUTATIONS) {
        cumulative += MUTATIONS[key].chance;
        if (mRand < cumulative) {
            mutationStr = key.toLowerCase();
            break;
        }
    }
    return { ...base, mutation: mutationStr };
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
        sequence.push(i === TARGET_INDEX ? winningItem : getRandomRotund()); // Random filler objects
    }
    sequence.forEach(item => {
        const node = document.createElement("div");
        const mutClass = item.mutation !== 'none' ? `mutation-${item.mutation}` : '';
        node.className = `ticker-item glow-${item.rarity.toLowerCase()}`;
        node.innerHTML = `
            <img class="${mutClass}" src="images/${item.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
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
        const mutMultiplier = MUTATIONS[winner.mutation.toUpperCase()].multiplier;
        const scaledValue = winner.value * multiplier * mutMultiplier;
        
        const invKey = `${winner.id}-${winner.mutation}`;
        Player.inventory[invKey] = (Player.inventory[invKey] || 0) + 1;
        Player.lifetimeStats[invKey] = (Player.lifetimeStats[invKey] || 0) + 1;
        Player.coins += scaledValue;

        const card = document.createElement("div");
        card.className = `result-card glow-${winner.rarity.toLowerCase()}`;
        
        const mutClass = winner.mutation !== 'none' ? `mutation-${winner.mutation}` : '';
        const mutNamePrefix = winner.mutation !== 'none' ? `${MUTATIONS[winner.mutation.toUpperCase()].name} ` : '';

        card.innerHTML = `
            <img class="${mutClass}" src="images/${winner.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'64\' height=\'64\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'1.5\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
            <span class="badge" style="background-color: var(--${winner.rarity.toLowerCase()})">${winner.rarity}</span>
            <h2>${mutNamePrefix}${winner.name}</h2>
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
            const alertText = secretItem.rarity === "ANGELIC" ? "✨ ANGELIC ACQUISITION ✨" : "🚨 SECRET ACQUISITION 🚨";
            document.querySelector(".secret-alert").innerText = alertText;
            
            const epicImg = document.getElementById("secret-epicenter-img");
            epicImg.src = `images/${secretItem.file}`;
            epicImg.className = secretItem.mutation !== 'none' ? `mutation-${secretItem.mutation}` : '';

            const mutNamePrefix = secretItem.mutation !== 'none' ? `${MUTATIONS[secretItem.mutation.toUpperCase()].name} ` : '';
            const epicName = document.getElementById("secret-epicenter-name");
            epicName.innerText = `${mutNamePrefix}${secretItem.name}`;
            epicName.style.color = `var(--${secretItem.rarity.toLowerCase()})`;
            
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
        
        counter.innerText = Player.rebirths;
        stage.classList.remove("hidden-stage");
        document.body.classList.add("shake-matrix");
        AudioFX.rebirthBoom();

        setTimeout(() => {
            Player.rebirths++;
            Player.coins = 0;
            Player.inventory = {};
            Object.keys(Player.upgrades).forEach(key => Player.upgrades[key] = 0);
            
            counter.classList.add("odometer-tick");
            setTimeout(() => {
                counter.innerText = Player.rebirths;
                counter.classList.remove("odometer-tick");
                document.body.classList.remove("shake-matrix");
            }, 300);
        }, 1500);

        setTimeout(() => {
            stage.style.opacity = "0";
            setTimeout(() => {
                stage.classList.add("hidden-stage");
                stage.style.opacity = "1";
                
                syncHUD();
                syncRouletteViewports();
                Shop.renderTrackers();
                Menu.updateInventory();
                Menu.updateIndex();
                
                if(document.getElementById("menu-drawer").classList.contains("hidden-drawer") === false) {
                    Menu.toggle();
                }
                
                Storage.save();
                if (Player.autoRollActive) { isSpinning = false; spin(); }
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
        
        Object.keys(Player.inventory).forEach(invKey => {
            const count = Player.inventory[invKey];
            if (count > 0) {
                const [id, mutStr] = invKey.split("-");
                const itemDef = ROTUNDS.find(r => r.id === id);
                if (!itemDef) return;

                empty = false;
                const mutClass = mutStr !== 'none' ? `mutation-${mutStr}` : '';
                const mutNamePrefix = mutStr !== 'none' ? `${MUTATIONS[mutStr.toUpperCase()].name} ` : '';
                const mutBadgeHTML = mutStr !== 'none' ? `<div class="mutation-badge" style="background: ${MUTATIONS[mutStr.toUpperCase()].color};">${mutStr}</div>` : '';

                const card = document.createElement("div");
                card.className = `inv-card glow-${itemDef.rarity.toLowerCase()}`;
                card.innerHTML = `
                    <span class="inv-qty">x${count}</span>
                    <img class="${mutClass}" src="images/${itemDef.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
                    ${mutBadgeHTML}
                    <div class="inv-name" style="color: var(--${itemDef.rarity.toLowerCase()})">${mutNamePrefix}${itemDef.name}</div>
                `;
                grid.appendChild(card);
            }
        });
        if (empty) grid.innerHTML = `<p class="placeholder-card" style="grid-column: span 3; padding: 2rem 0; font-size:0.7rem;">Empty</p>`;
    },
    updateIndex(filterMutation = document.getElementById("mutation-filter-select").value) {
        const list = document.getElementById("index-list"); list.innerHTML = "";
        const { table, totalWeight } = calculateWeightsMatrix();

        [...table].sort((a,b) => b.calcWeight - a.calcWeight).forEach(item => {
            const isLuckBoosted = Player.upgrades.luck > 0 && item.rarity !== "COMMON";
            
            // Allow bypassing filters if they select "all". Otherwise strictly filter.
            let renderMutations = filterMutation === 'all' 
                ? Object.keys(MUTATIONS).map(k => k.toLowerCase()) 
                : [filterMutation];

            renderMutations.forEach(mutStr => {
                const mutData = MUTATIONS[mutStr.toUpperCase()];
                
                const baseChance = (item.calcWeight / totalWeight);
                const complexChanceValue = (baseChance * mutData.chance) * 100;
                const percentText = complexChanceValue.toFixed(6);

                const mutClass = mutStr !== 'none' ? `mutation-${mutStr}` : '';
                const mutNamePrefix = mutStr !== 'none' ? `${mutData.name} ` : '';

                const row = document.createElement("div");
                row.className = `index-row glow-${item.rarity.toLowerCase()}`;
                row.style.cursor = "pointer";
                row.innerHTML = `
                    <div class="index-left">
                        <img class="${mutClass}" src="images/${item.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
                        <div>
                            <div class="index-title">${mutNamePrefix}${item.name}</div>
                            <span style="font-size:0.55rem; font-weight:800; color: var(--${item.rarity.toLowerCase()})">${item.rarity}</span>
                        </div>
                    </div>
                    <div class="index-pct ${isLuckBoosted ? 'boosteded' : ''}">${percentText}%</div>
                `;
                
                row.addEventListener("click", () => {
                    UIManager.showIndexCardModal(item, complexChanceValue, mutStr);
                });
                list.appendChild(row);
            });
        });
    }
};

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
            btn.disabled = false; btn.innerText = "ASCEND NOW";
        } else {
            section.classList.add("rebirth-locked");
            section.classList.remove("rebirth-available-pulse");
            btn.disabled = true; btn.innerText = "REQUIRES ALL MAX UPGRADES";
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
                btn.innerText = "MAXED"; btn.classList.add("unlocked"); btn.disabled = true;
            } else {
                const cost = this.getCost(type, current);
                btn.innerHTML = `${cost.toLocaleString()} <img src="images/rotundcoin.png" class="coin-icon" onerror="this.style.display='none'">`;
                btn.classList.remove("unlocked"); btn.disabled = false;
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
            if (type === "doubleRoll") syncRouletteViewports();
            if (type === "luck") Menu.updateIndex();
            if (type === "autoRoll" && Player.upgrades.autoRoll > 0) autoBtn.classList.remove("hidden-upgrade");
            Storage.save(); 
        } else {
            alert("Insufficient RotundCoins!");
        }
    }
};

const UIManager = {
    modal: document.getElementById("offline-modal"),
    grid: document.getElementById("offline-item-grid"),
    summary: document.getElementById("offline-summary-text"),
    coins: document.getElementById("offline-coins-gained"),
    indexCardModal: document.getElementById("index-card-modal"),

    showOfflineModal(rollsMissed, gains) {
        this.grid.innerHTML = "";
        this.summary.innerText = `Your Auto-Roller completed ${rollsMissed.toLocaleString()} sets while you were away.`;
        this.coins.innerText = `+${gains.coins.toLocaleString()}`;

        Object.keys(gains.items).forEach(invKey => {
            const [id, mutStr] = invKey.split("-");
            const rotundDef = ROTUNDS.find(r => r.id === id);
            const quantity = gains.items[invKey];

            if (rotundDef) {
                const mutClass = mutStr !== 'none' ? `mutation-${mutStr}` : '';
                const mutNamePrefix = mutStr !== 'none' ? `${MUTATIONS[mutStr.toUpperCase()].name} ` : '';
                
                const card = document.createElement("div");
                card.className = `inv-card glow-${rotundDef.rarity.toLowerCase()}`;
                card.innerHTML = `
                    <span class="inv-qty">x${quantity.toLocaleString()}</span>
                    <img class="${mutClass}" src="images/${rotundDef.file}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'2\'><circle cx=\'12\' cy=\'12\' r=\'10\'/></svg>'">
                    <div class="inv-name" style="color: var(--${rotundDef.rarity.toLowerCase()})">${mutNamePrefix}${rotundDef.name}</div>
                `;
                this.grid.appendChild(card);
            }
        });
        this.modal.classList.remove("hidden-modal");
    },
    claimOfflineRewards() {
        this.modal.classList.add("hidden-modal");
        if (Player.autoRollActive && !isSpinning) spin();
    },
    showIndexCardModal(item, computedChance, mutStr) {
        const title = document.getElementById("idx-card-title");
        const rarityBadge = document.getElementById("idx-card-rarity");
        const img = document.getElementById("idx-card-img");
        const statValue = document.getElementById("stat-payout-value");
        const statRolled = document.getElementById("stat-lifetime-rolled");
        const statChance = document.getElementById("stat-computed-chance");

        const mutData = MUTATIONS[mutStr.toUpperCase()];
        const mutNamePrefix = mutStr !== 'none' ? `${mutData.name} ` : '';

        title.innerText = `${mutNamePrefix}${item.name}`;
        rarityBadge.innerText = item.rarity;
        rarityBadge.style.backgroundColor = `var(--${item.rarity.toLowerCase()})`;
        
        const premiumCardElement = document.querySelector(".premium-showcase-card");
        premiumCardElement.className = `premium-showcase-card index-glow-${item.rarity.toLowerCase()}`;

        img.src = `images/${item.file}`;
        img.className = mutStr !== 'none' ? `mutation-${mutStr}` : '';
        img.onerror = () => { img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='1.5'><circle cx='12' cy='12' r='10'/></svg>"; };

        const currentMultiplier = 1 + Player.rebirths;
        const totalBasePayout = item.value * currentMultiplier * mutData.multiplier;
        statValue.innerText = totalBasePayout.toLocaleString();

        const exactKey = `${item.id}-${mutStr}`;
        const totalTimesRolled = Player.lifetimeStats[exactKey] || 0;
        statRolled.innerText = totalTimesRolled.toLocaleString();
        
        statChance.innerText = `${computedChance.toFixed(6)}%`;
        this.indexCardModal.classList.remove("hidden-modal");
    },
    closeIndexCardModal() {
        this.indexCardModal.classList.add("hidden-modal");
    }
};

autoBtn.addEventListener("click", () => {
    Player.autoRollActive = !Player.autoRollActive;
    if (Player.autoRollActive) {
        autoBtn.innerText = "AUTO: ON";
        autoBtn.classList.add("active-mode");
        if (!isSpinning) spin();
    } else {
        autoBtn.innerText = "AUTO: OFF";
        autoBtn.classList.remove("active-mode");
        if (!isSpinning) rollBtn.disabled = false;
    }
});

rollBtn.addEventListener("click", spin);

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        if (Player.autoRollActive) awayStartTime = Date.now();
    } else {
        if (awayStartTime && Player.autoRollActive) {
            const elapsed = Date.now() - awayStartTime;
            awayStartTime = null;

            const intervals = [4200, 2200, 1000, 500, 250];
            const baseDuration = intervals[Player.upgrades.quickRoll];
            const fullCycleTime = baseDuration + 1000; 

            const calculatedRolls = Math.floor(elapsed / fullCycleTime);

            if (calculatedRolls > 0) {
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                isSpinning = false; rollBtn.disabled = false;

                let gains = { coins: 0, items: {} };
                const safeMaxLimit = Math.min(calculatedRolls, 50000); 
                const multiplier = 1 + Player.rebirths;

                for (let i = 0; i < safeMaxLimit; i++) {
                    const totalTracks = 1 + Player.upgrades.doubleRoll;
                    for (let t = 0; t < totalTracks; t++) {
                        const winner = getRandomRotund();
                        const mutMultiplier = MUTATIONS[winner.mutation.toUpperCase()].multiplier;
                        const scaledValue = winner.value * multiplier * mutMultiplier;
                        
                        const invKey = `${winner.id}-${winner.mutation}`;
                        Player.inventory[invKey] = (Player.inventory[invKey] || 0) + 1;
                        Player.lifetimeStats[invKey] = (Player.lifetimeStats[invKey] || 0) + 1;
                        Player.coins += scaledValue;
                        
                        gains.coins += scaledValue;
                        gains.items[invKey] = (gains.items[invKey] || 0) + 1;
                    }
                }

                syncHUD();
                Menu.updateInventory();
                Shop.checkRebirthAvailability();
                Storage.save();
                UIManager.showOfflineModal(calculatedRolls, gains);
                syncRouletteViewports();
            } else {
                if (Player.autoRollActive && !isSpinning) spin();
            }
        }
    }
});

Storage.load(); 
syncHUD();

if (Player.upgrades.autoRoll > 0) autoBtn.classList.remove("hidden-upgrade");

syncRouletteViewports();
Shop.renderTrackers();
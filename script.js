// Add to top of script.js
const MUTATIONS = {
    NONE: { id: "none", chance: 0.7495, name: "", color: "transparent" },
    GOLD: { id: "gold", chance: 0.20, name: "Gold", color: "gold" },
    DIAMOND: { id: "diamond", chance: 0.05, name: "Diamond", color: "cyan" },
    RAINBOW: { id: "rainbow", chance: 0.0004, name: "Rainbow", color: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)" },
    VOID: { id: "void", chance: 0.0001, name: "Void", color: "black" }
};

// Update getRandomRotund
function getRandomRotund() {
    // 1. Get Base Rotund
    const { table, totalWeight } = calculateWeightsMatrix();
    let rand = Math.random() * totalWeight;
    let base = ROTUNDS[0];
    for (const entry of table) {
        if (rand < entry.calcWeight) { base = entry; break; }
        rand -= entry.calcWeight;
    }

    // 2. Roll for Mutation
    let mRand = Math.random();
    let mutation = "none";
    let cumulative = 0;
    for (const key in MUTATIONS) {
        cumulative += MUTATIONS[key].chance;
        if (mRand < cumulative) {
            mutation = key.toLowerCase();
            break;
        }
    }
    return { ...base, mutation };
}

// In finalizeSpin/Process, save items with mutation keys:
// Player.inventory[winner.id + "-" + winner.mutation] = ...

// Update Index to support sorting by mutation
function sortIndex(criteria) {
    // Re-render based on selected sort
    // e.g., sort by rarity vs sort by mutation
}
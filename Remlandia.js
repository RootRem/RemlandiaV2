// ---------------- SAVE KEYS ----------------
const SAVE_KEY = "remlandia_save";
const PENDING_NAME_KEY = "remlandia_pending_name";

let game = null;
// ---------------- STAMINA COSTS ----------------
const fightStamCost = 5;    // every fight costs 5 stamina
const gatherStamCost = 3;   // every gather costs 3 stamina
// ---------------- SAVE / LOAD ----------------
function saveGame() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game));
}

function loadGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
}

// ---------------- ENEMY TEMPLATE ----------------
const enemyTemplate = {
    name: "",
    hp: 10,
    maxHp: 10,
    attack: 2,
    defense: 1,
    level: 1,
    xpReward: 5,
    goldReward: 2,
    loot: []
};
// ---------------- NEW GAME ----------------
function createNewGame() {
    const name = localStorage.getItem(PENDING_NAME_KEY) || "Hero";
    localStorage.removeItem(PENDING_NAME_KEY);

    return {
        combat: {
    active: false,
    enemy: null
},
        player: {
            // Basic Info
    name: name,
    level: 1,
    xp: 0,
    xpToNext: 100,
    gold: 0,

    // Health & Stamina
    hp: 30,
    maxHp: 30,
    stamina: 100,
    maxStamina: 100,
    lastHpRegen: Date.now(),
    lastStaminaRegen: Date.now(),
    hpRegenRate: 1,       // HP per min
    staminaRegenRate: 2,  // Stamina per min

    // Combat Stats
    attack: 5,
    defense: 2,

    // Inventory & Equipment
    inventory: {},
        },
        // Skills & Skill XP
    skills: {
        gathering: 1,
        cooking: 1,
        alchemy: 1
    },
    skillsXp: {
        gathering: 0,
        cooking: 0,
        alchemy: 0
    },

        world: {
    currentArea: "main",
    areas: {
        main: {
            enemies: [],        
            lastEnemySpawn: Date.now(),
            spawnInterval: 0,   // no spawning
            maxEnemies: 0,
                        gatherNodes: [],
            lastGatherSpawn: Date.now(),
            gatherSpawnInterval: 0,
            maxGatherNodes: 0,
            gatherTypes: []       
        },
        explore: {
            enemies: [],
            lastEnemySpawn: Date.now(),
            spawnInterval: 0,   // no spawning
            maxEnemies: 0,
                        gatherNodes: [],
            lastGatherSpawn: Date.now(),
            gatherSpawnInterval: 0,
            maxGatherNodes: 0,
            gatherTypes: []       
        },
        applewatch: {
            enemies: [],
            lastEnemySpawn: Date.now(),
            spawnInterval: 1,   // spawn every  minute
            maxEnemies: 8,
            enemyTypes: [
                {
                    name: "Chicken",
                    hp: 10,
                    attack: 3,
                    defense: 0,
                    xpReward: 2,
                    goldReward: 1,
                    loot: [
                        { name: "Meat", min: 1, max: 1}
                    ],
                    icon: "Images/Chicken.png",
                },
                {
                    name: "Cow",
                    hp: 20,
                    attack: 7,
                    defense: 1,
                    xpReward: 5,
                    goldReward: 2,
                    loot: [{ name: "Milk", min: 1, max: 1 },
                          { name: "Meat", min: 1, max: 1}],
                    icon: "Images/Cow.png",
                }
                
            ],
                boss: {
        name: "Possesed Scarecrow",
        hp: 150,
        maxHp: 150,
        attack: 15,
        defense: 5,
        xpReward: 50,
        goldReward: 20,
        loot: [
            { name: "Overlord Core", min: 1, max: 1 }
        ],
        icon: "Images/Scarecrow.png",
        spawnInterval: 10, // in minutes
        lastSpawn: Date.now(),
        hasSpawned: false
    },
                        gatherNodes: [],
            lastGatherSpawn: Date.now(),
            gatherSpawnInterval: 1, // every minute
            maxGatherNodes: 8,

            gatherTypes: [
                {
                    id: "Wheat",
                    name: "Wheat",
                    xpReward: 3
                },
                {
                    id: "Sage",
                    name: "Sage",
                    xpReward: 4
                },
                {
                    id: "Chamomile",
                    name: "Chamomile",
                    xpReward: 3
                }
            ]
        },
        cave: {
            enemies: [],
            lastEnemySpawn: Date.now(),
            spawnInterval: 1, // spawn every 30 seconds (0.5 minutes)
            maxEnemies: 3,
            enemyTypes: [
                {
                    name: "Bat",
                    hp: 10,
                    attack: 3,
                    defense: 0,
                    xpReward: 3,
                    goldReward: 1,
                    loot: []
                }
            ]
        }
    }
},

        log: []   // ✅ ADD THIS RIGHT HERE
    };
}
const recipes = [
    {
        name: "Cooked Meat",
        ingredients: { Meat: 1 }, // how many of each raw material
        result: { "Cooked Meat": 1 }, // what it produces
    },
    {
        name: "Bread",
        ingredients: { Wheat: 2, Milk: 1 },
        result: { Bread: 1 },
    }
];
//------------------LOG--------------------
function addLog(message) {
    const timestamp = new Date().toLocaleTimeString();

    game.log.push(`[${timestamp}] ${message}`);

    // Keep only last 20 messages
    if (game.log.length > 20) {
        game.log.shift();
    }

    renderLog();
    saveGame();
}
// ---------------- TIMER LOOP ----------------
function startTimerLoop() {
    let lastTick = Date.now();

    function tick() {
        const now = Date.now();
        const deltaMs = now - lastTick;

        if (deltaMs >= 1000) {  // run every second
            lastTick = now;
            processTimers();
            renderSidebar();
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}
// ---------------- TIMER SYSTEM ----------------
function processTimers() {
    const now = Date.now();
    const player = game.player;

    if (!game.combat.active) {
        // --- HP Regen ---
        let hpElapsedMinutes = Math.floor((now - player.lastHpRegen) / 60000);
        if (hpElapsedMinutes >= 1) {
            player.hp = Math.min(player.hp + hpElapsedMinutes * player.hpRegenRate, player.maxHp);
            player.lastHpRegen += hpElapsedMinutes * 60000; // advance lastHpRegen by whole minutes
        }

        // --- Stamina Regen ---
        let staminaElapsedMinutes = Math.floor((now - player.lastStaminaRegen) / 60000);
        if (staminaElapsedMinutes >= 1) {
            player.stamina = Math.min(player.stamina + staminaElapsedMinutes * player.staminaRegenRate, player.maxStamina);
            player.lastStaminaRegen += staminaElapsedMinutes * 60000;
        }
    }

    // --- Enemy Spawn ---
    for (const areaKey in game.world.areas) {
        const area = game.world.areas[areaKey];
        if (!area || !area.enemyTypes || area.enemies.length >= area.maxEnemies) continue;

        const spawnElapsedMinutes = (now - area.lastEnemySpawn) / 60000;
        if (spawnElapsedMinutes >= area.spawnInterval) {
            spawnEnemy(areaKey);
            area.lastEnemySpawn = now;
           // if (areaKey === game.world.currentArea) renderMainView();
        }

    }
// --- Gather Spawn ---
for (const areaKey in game.world.areas) {
    const area = game.world.areas[areaKey];
    if (!area || !area.gatherTypes || area.gatherNodes.length >= area.maxGatherNodes) continue;

    const spawnElapsedMinutes = (now - area.lastGatherSpawn) / 60000;

    if (spawnElapsedMinutes >= area.gatherSpawnInterval) {
        spawnGatherNode(areaKey);
        area.lastGatherSpawn = now;

        //if (areaKey === game.world.currentArea) renderMainView();
    }

}

    saveGame();
}
// ---------------- LEVEL UP SYSTEM ----------------
function checkLevelUp(player) {
    while (player.xp >= player.xpToNext) {
        player.xp -= player.xpToNext;           // carry over extra XP
        player.level += 1;                      // increase level

        // Increase XP required for next level (e.g., +50% each level)
        player.xpToNext = Math.floor(player.xpToNext * 1.5);

        // Buff player stats
        player.maxHp += 5;                      // increase max HP
        player.hp = player.maxHp;               // restore HP on level up
        player.maxStamina += 5;                 // increase max Stamina
        player.attack += 2;                      // increase attack
        player.defense += 1;                     // increase defense

        // Optional: alert or log
        addLog(`Leveled up! You are now level ${player.level}`);
    }
}
//----------------SPAWN GATHER NODES------------------
function spawnGatherNode(areaKey) {
    const area = game.world.areas[areaKey];
    if (!area || !area.gatherTypes || area.gatherNodes.length >= area.maxGatherNodes) return;

    const typeIndex = Math.floor(Math.random() * area.gatherTypes.length);
    const gatherData = area.gatherTypes[typeIndex];

    const node = {
        id: crypto.randomUUID(),
        ...gatherData
    };

    area.gatherNodes.push(node);
}
// ---------------- SPAWN ENEMY ----------------
function spawnEnemy(areaKey) {
    const area = game.world.areas[areaKey];
    if (!area) return;

    // --- Check for boss spawn first ---
    if (area.boss && !area.boss.hasSpawned) {
        const now = Date.now();
        const elapsedMinutes = (now - area.boss.lastSpawn) / 60000;
        if (elapsedMinutes >= area.boss.spawnInterval) {
            const bossEnemy = {
                ...enemyTemplate,
                ...area.boss,
                loot: area.boss.loot
            };
            area.enemies.push(bossEnemy);
            area.boss.hasSpawned = true;
            area.boss.lastSpawn = now;

            addLog(`A mighty boss has appeared in ${areaKey}: ${bossEnemy.name}!`);
            if (game.world.currentArea === areaKey) renderMainView();
            return; // spawn only boss this tick
        }
    }

    // --- Spawn regular enemy ---
    if (!area.enemyTypes || area.enemies.length >= area.maxEnemies) return;

    const typeIndex = Math.floor(Math.random() * area.enemyTypes.length);
    const enemyData = area.enemyTypes[typeIndex];

    // --- SAFELY CREATE LOOT ARRAY ---
    let lootArray = [];
    if (enemyData.loot && Array.isArray(enemyData.loot)) {
        lootArray = enemyData.loot.map(l => {
            if (typeof l === "string") return { name: l, min: 1, max: 1 };
            return { name: l.name, min: l.min ?? 1, max: l.max ?? 1 };
        });
    }

    // --- Spawn enemy object ---
    const enemy = {
        ...enemyTemplate,
        ...enemyData,
        loot: lootArray
    };

    area.enemies.push(enemy);
}

//-----------------GATHER ACTION--------------------
function gatherNode(areaKey, nodeId) {
    const area = game.world.areas[areaKey];
    if (!area) return;
    if (game.player.stamina < gatherStamCost) {
        console.log("Not enough stamina to gather!");
        return;
    }
    game.player.stamina -= gatherStamCost;
    const nodeIndex = area.gatherNodes.findIndex(n => n.id === nodeId);
    if (nodeIndex === -1) return;

    const node = area.gatherNodes[nodeIndex];

    // --- Add XP ---

    // --- Add Item To Inventory ---
    addItemToInventory(node.id, 1);
    addLog(`You gathered 1 ${node.name}!`);

    // --- Remove Node ---
    area.gatherNodes.splice(nodeIndex, 1);

    renderMainView();
    saveGame();
}
//-------------------COMBAT-----------------------
function startCombat(enemyIndex) {
    const area = game.world.areas[game.world.currentArea];

    if (!area) {
        addLog(`Error: current area "${game.world.currentArea}" not found!`);
        return;
    }

    let enemy;
    if (enemyIndex === 'boss') {
        const boss = area.boss;
        if (!boss || boss.hp <= 0) {
            addLog("The boss is not available!");
            return;
        }
        enemy = structuredClone(boss); // clone so we don't modify the template directly
        enemy.isBoss = true;
    } else {
        enemy = area.enemies[enemyIndex];
        if (!enemy) {
            addLog(`Error: enemy at index ${enemyIndex} not found in area "${game.world.currentArea}"`);
            return;
        }
    }

    if (game.player.stamina < fightStamCost) {
        console.log("Not enough stamina to fight!");
        return;
    }
    game.player.stamina -= fightStamCost;

    game.combat.active = true;
    game.combat.enemy = enemy;
    game.combat.enemyIndex = enemyIndex;

    renderUI();
}
function attackEnemy() {
    processTimers(); // update regen & spawns first
    if (!game.combat.active) return;

    const player = game.player;
    const enemy = game.combat.enemy;

    // Player attacks
    const playerDamage = Math.max(0, player.attack - enemy.defense);
    enemy.hp -= playerDamage;
    addLog(`You hit ${enemy.name} for ${playerDamage} damage.`);

    // Enemy dies
    if (enemy.hp <= 0) {
        defeatEnemy();
        return;
    }

    // Enemy attacks
    const enemyDamage = Math.max(0, enemy.attack - player.defense);
    player.hp -= enemyDamage;
    addLog(`${enemy.name} hits you for ${enemyDamage} damage.`);

    if (player.hp <= 0) {
        player.hp = 0;
        game.combat.active = false;
        addLog("You died...");
    }

    renderSidebar();
    renderLog();
    renderUI(); // combat view
    saveGame();
}

function runFromCombat() {
    addLog(`You ran away from ${game.combat.enemy.name}!`);
    game.combat.active = false;
    game.combat.enemy = null;
    game.combat.enemyIndex = null;
    renderUI();
}
function defeatEnemy() {
    const area = game.world.areas[game.world.currentArea];
    const enemy = game.combat.enemy;

    if (!area || !enemy) return;

    // Give rewards
    game.player.xp += enemy.xpReward || 0;
    game.player.gold += enemy.goldReward || 0;
    
    // Add loot
if (enemy.loot && enemy.loot.length > 0) {
    enemy.loot.forEach(item => {
        const qty = Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
        addItemToInventory(item.name, qty);
        addLog(`${enemy.name} defeated! Gained ${enemy.xpReward} XP, ${enemy.goldReward}Gold and ${qty} x ${item.name}`);
    });
}
    // Remove enemy from area
    if (game.combat.enemyIndex != null) {
        area.enemies.splice(game.combat.enemyIndex, 1);
    }
if (game.combat.enemy.isBoss) {
    const boss = game.world.areas.applewatch.boss;
    if (boss) boss.hasSpawned = false;
}

    // Exit combat
    game.combat.active = false;
    game.combat.enemy = null;
    game.combat.enemyIndex = null;

    checkLevelUp(game.player);
    saveGame();
    renderUI();
}
// ---------------- INVENTORY VIEW ----------------
const usableItems = ["Milk", "Cooked Meat", "Bread"];

function openInventory() {
    const main = document.getElementById("main-view");
    const inventory = game.player.inventory;
    const items = Object.keys(inventory);
    
    if (items.length === 0) {
        main.innerHTML = `
            <h2>Inventory</h2>
            <p>Your inventory is empty.</p>
            <button onclick="renderMainView()">Back</button>
        `;
        return;
    }

    main.innerHTML = `
        <h2>Inventory</h2>
        <div class="inventory-list">
            ${items.map(itemName => {
                const disabled = usableItems.includes(itemName) ? "" : "disabled style='opacity:0.5;' title='Cannot use this item'";
                return `
                    <div class="inventory-item">
                        <strong>${itemName}</strong> x${inventory[itemName]}
                        <button onclick="useItem('${itemName}')" ${disabled}>Use</button>
                        <button onclick="dropItem('${itemName}')">Drop</button>
                    </div>
                `;
            }).join("")}
        </div>
        <button onclick="renderMainView()">Back</button>
    `;
}

// ---------------- INVENTORY ACTIONS ----------------
function useItem(itemName) {
    if (!game.player.inventory[itemName] || game.player.inventory[itemName] <= 0) return;
    
    addLog(`You used 1 ${itemName}.`);
    
    // Example effects for some items
    switch(itemName) {
        case "Meat":
            addLog("I should cook this first.");
            break;
        case "Milk":
            game.player.hp = Math.min(game.player.hp + 5, game.player.maxHp);
            addLog("You drank milk and recovered 5 HP.");
            break;
        case "Bread":
            game.player.hp = Math.min(game.player.hp + 10, game.player.maxHp);
            addLog("You ate bread and recovered 10 HP.");
            break;
        case "Cooked Meat":
            game.player.hp = Math.min(game.player.hp + 15, game.player.maxHp);
            addLog("You ate bread and recovered 15 HP.");
            break;
        // Add more item effects here
    }
    
    // Reduce quantity
    game.player.inventory[itemName]--;
    if (game.player.inventory[itemName] <= 0) delete game.player.inventory[itemName];
    
    saveGame();
    openInventory(); // refresh inventory view
}

function dropItem(itemName) {
    if (!game.player.inventory[itemName] || game.player.inventory[itemName] <= 0) return;
    
    addLog(`You dropped 1 ${itemName}.`);
    game.player.inventory[itemName]--;
    if (game.player.inventory[itemName] <= 0) delete game.player.inventory[itemName];
    
    saveGame();
    openInventory(); // refresh inventory view
}

// ---------------- HELPER: add items to inventory ----------------
function addItemToInventory(itemName, quantity = 1) {
    if (!game.player.inventory[itemName]) game.player.inventory[itemName] = 0;
    game.player.inventory[itemName] += quantity;
    //addLog(`Added ${quantity} ${itemName} to inventory.`);
    saveGame();
}
//----------------------CRAFTING VIEW---------------
function openCrafting() {
    const main = document.getElementById("main-view");

    main.innerHTML = `
        <h2>Crafting</h2>
        <div class="crafting-list">
            ${recipes.map(recipe => {
                const canCraft = Object.keys(recipe.ingredients).every(item =>
                    (game.player.inventory[item] || 0) >= recipe.ingredients[item]
                );

                const ingredientsHtml = Object.keys(recipe.ingredients).map(item => {
                    const playerAmount = game.player.inventory[item] || 0;
                    return `<li>${item}: ${playerAmount} / ${recipe.ingredients[item]}</li>`;
                }).join("");

                return `
                    <div class="crafting-item">
                        <strong>${recipe.name}</strong>
                        <ul>${ingredientsHtml}</ul>
                        <button onclick="craftItem('${recipe.name}'); openCrafting();" ${canCraft ? "" : "disabled style='opacity:0.5;' title='Not enough ingredients'"}>Craft</button>
                    </div>
                `;
            }).join("")}
        </div>
        <button onclick="renderMainView()">Back</button>
    `;
}
function craftItem(recipeName) {
    const recipe = recipes.find(r => r.name === recipeName);
    if (!recipe) return console.log("Recipe not found!");

    // Check ingredients
    for (let item in recipe.ingredients) {
        if (!game.player.inventory[item] || game.player.inventory[item] < recipe.ingredients[item]) {
            return console.log(`Not enough ${item} to craft ${recipe.name}`);
        }
    }

    // Deduct ingredients
    for (let item in recipe.ingredients) {
        game.player.inventory[item] -= recipe.ingredients[item];
    }

    // Add result
    for (let item in recipe.result) {
        if (!game.player.inventory[item]) game.player.inventory[item] = 0;
        game.player.inventory[item] += recipe.result[item];
    }

    addLog(`${recipe.name} crafted!`);
    saveGame();
}
// ---------------- RENDER ----------------
function renderUI() {
    renderSidebar();
    renderMainView();
}
function renderLog() {
    const logContainer = document.getElementById("log");
    if (!logContainer) return;

    logContainer.innerHTML = game.log
        .map(entry => `<div class="log-entry">${entry}</div>`)
        .join("");

    // Scroll to bottom
    logContainer.scrollTop = logContainer.scrollHeight;
}
function renderSidebar() {
    const sidebar = document.getElementById("sidebar");
    const hpPercent = (game.player.hp / game.player.maxHp) * 100;

    sidebar.innerHTML = `
        <div class="player-panel">
    <h2>${game.player.name}</h2>
    <p>Level: ${game.player.level}</p>

    <!-- HP Bar -->
    <div>
        HP: ${game.player.hp}/${game.player.maxHp}
        <div class="bar-container">
            <div class="hp-bar" style="width: ${Math.floor((game.player.hp / game.player.maxHp) * 100)}%"></div>
        </div>
    </div>

    <!-- Stamina Bar -->
    <div>
        Stamina: ${game.player.stamina}/${game.player.maxStamina}
        <div class="bar-container">
            <div class="stamina-bar" style="width: ${Math.floor((game.player.stamina / game.player.maxStamina) * 100)}%"></div>
        </div>
    </div>

    <!-- XP Bar -->
    <div>
        XP: ${game.player.xp}/${game.player.xpToNext}
        <div class="bar-container">
            <div class="xp-bar" style="width: ${Math.floor((game.player.xp / game.player.xpToNext) * 100)}%"></div>
        </div>
    </div>

    <!-- Combat Stats -->
    <p>Attack: ${game.player.attack}</p>
    <p>Defense: ${game.player.defense}</p>

    <p>Gold: ${game.player.gold}</p>
</div>

        <div class="nav-panel">
            <h3>Navigation</h3>
            <button onclick="changeArea('main')">Main</button>
            <button onclick="changeArea('explore')">Explore</button>
            <button onclick="openInventory()">Inventory</button>
            <button onclick="openCrafting()">Crafting</button>
            <button onclick="openSkills()">Skills</button>
        </div>
    `;
}
function renderMainView() {
    const main = document.getElementById("main-view");
    const areaKey = game.world.currentArea;
    const area = game.world.areas[areaKey];

    // Wrapper content variable
    let mainContent = "";

    // Combat overrides all
    if (game.combat.active) {
        mainContent = renderCombatContent();
    } 
    // Main starting page
    else if (areaKey === "main") {
        mainContent = `
            <h2>Welcome to Remlandia!</h2>
            <p>Check out the latest updates and your adventure progress.</p>
        `;
    } 
    // Explore hub
    else if (areaKey === "explore") {
        mainContent = `
            <h2>Explore</h2>
            <p>Where would you like to go?</p>
            <div class="explore-buttons">
                <button onclick="changeArea('applewatch')">Applewatch</button>
                <button onclick="changeArea('cave')">Cave</button>
            </div>
        `;
    } 
    // Default area view
else {
    mainContent = `
        <div class="area-title">
            Area: ${areaKey}
            <button onclick="renderMainView()" style="margin-left:10px;">Refresh Area</button>
        </div>

        ${area.enemies.length === 0 
                ? "<p>No enemies here... yet.</p>" 
                : `<div class="area-enemies">
                    ${area.enemies.map((e, index) => `
                        <div class="enemy-card card-base">
                            <strong>${e.name}</strong>
                            <div>HP: ${e.hp}</div>
                            <button onclick="startCombat(${index})">Fight</button>
                        </div>
                    `).join("")}
${area.boss && !area.boss.defeated ? `
    <div class="boss-card card-base">
        <strong>${area.boss.name}</strong>
        <div>HP: ${area.boss.hp} / ${area.boss.maxHp}</div>
        <button onclick="startCombat('boss')">Fight</button>
    </div>
` : ""}
                </div>`
        }

        ${
            area.gatherNodes && area.gatherNodes.length > 0
                ? `<div class="area-gather">
                    ${area.gatherNodes.map((node, index) => `
                        <div class="gather-card card-base">
                            <strong>${node.name}</strong><br>
                            <button onclick="gatherNode('${areaKey}', '${node.id}')">Gather</button>
                        </div>
                    `).join("")}
                </div>`
                : ""
        }
    `;
}
    // Inject into main view with container wrapper
    main.innerHTML = `<div class="main-container">${mainContent}</div>`;
}

// Returns combat content as a string
function renderCombatContent() {
    const enemy = game.combat.enemy;
    if (!enemy) return "<p>Error: no enemy found!</p>";

    // Calculate health percentages
    const playerHpPercent = (game.player.hp / game.player.maxHp) * 100;
    const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;

    return `
        <h2>Combat!</h2>
        <p><img src="${enemy.icon}" alt="${enemy.name}" class="enemy-icon"></p>

        <div class="health-container">
            <strong>You:</strong>
            <div class="health-bar">
                <div class="health-bar-fill" style="width: ${playerHpPercent}%;"></div>
            </div>
            ${game.player.hp}/${game.player.maxHp} HP
        </div>

        <div class="health-container">
            <strong>${enemy.name}:</strong>
            <div class="health-bar">
                <div class="health-bar-fill enemy" style="width: ${enemyHpPercent}%;"></div>
            </div>
            ${enemy.hp}/${enemy.maxHp} HP
        </div>

        <div class="combat-buttons">
            <button onclick="attackEnemy()">Attack</button>
            <button onclick="runFromCombat()">Run</button>
        </div>
    `;
}
function changeArea(areaKey) {
    game.world.currentArea = areaKey;
    renderSidebar();
    renderLog();
    renderMainView();       // show the area
    saveGame();
}
// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", initGame);

function initGame() {
    const saved = loadGame();

    if (saved) {
        game = saved;
    } else {
        game = createNewGame();
        saveGame();
    }
    startTimerLoop(); // begin automatic timer updates
    renderUI();
}



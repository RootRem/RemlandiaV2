// ---------------- SAVE KEYS ----------------
const SAVE_KEY = "remlandia_save";
const PENDING_NAME_KEY = "remlandia_pending_name";

let game = null;
// ---------------- STAMINA COSTS ----------------
const fightStamCost = 5; // every fight costs 5 stamina
const gatherStamCost = 1; // every gather costs 3 stamina
//--------------ITEM DATABASE-----------
const hpRestoreValues = {
  Bread: 10,
  "Cooked Meat": 15,
  // Add future HP-restoring items here
};
const itemPrices = {
  Meat: 5,
  Milk: 5,
  Wheat: 5,
  Bread: 12,
  Sage: 10,
  Chamomile: 7,
  "Cooked Meat": 23,
  "Chamomile Tea": 23,
  "Sage Tea": 33,
};
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
  loot: [],
};
// ---------------- NEW GAME ----------------
function createNewGame() {
  const name = localStorage.getItem(PENDING_NAME_KEY) || "Hero";
  localStorage.removeItem(PENDING_NAME_KEY);

  return {
    combat: {
      active: false,
      enemy: null,
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
      hpRegenRate: 1, // HP per min
      staminaRegenRate: 2, // Stamina per min

      // Combat Stats
      attack: 5,
      defense: 2,
      activeQuests: [],
      completedQuests: [],
      // Inventory & Equipment
      inventory: {},
      // Skills & Skill XP
      skills: {
        gathering: 1,
        cooking: 1,
      },
      skillsXp: {
        gathering: 0,
        cooking: 0,
      },
    },
    world: {
      currentArea: "main",
      areas: {
        main: {
          enemies: [],
          lastEnemySpawn: Date.now(),
          spawnInterval: 0, // no spawning
          maxEnemies: 0,
          gatherNodes: [],
          lastGatherSpawn: Date.now(),
          gatherSpawnInterval: 0,
          maxGatherNodes: 0,
          gatherTypes: [],
        },
        explore: {
          enemies: [],
          lastEnemySpawn: Date.now(),
          spawnInterval: 0, // no spawning
          maxEnemies: 0,
          gatherNodes: [],
          lastGatherSpawn: Date.now(),
          gatherSpawnInterval: 0,
          maxGatherNodes: 0,
          gatherTypes: [],
        },
        applewatch: {
          enemies: [],
          lastEnemySpawn: Date.now(),
          spawnInterval: 1.5,
          maxEnemies: 8,
          enemyTypes: [
            {
              name: "Chicken",
              hp: 10,
              maxHp: 10,
              attack: 3,
              defense: 0,
              xpReward: 5,
              goldReward: { min: 1, max: 3 },
              loot: [{ name: "Meat", min: 1, max: 1 }],
              icon: "Images/Chicken.png",
            },
            {
              name: "Cow",
              hp: 15,
              maxHp: 15,
              attack: 5,
              defense: 1,
              xpReward: 7,
              goldReward: { min: 1, max: 5 },
              loot: [
                { name: "Milk", min: 1, max: 1 },
                { name: "Meat", min: 1, max: 3 },
              ],
              icon: "Images/Cow.png",
            },
          ],
          boss: {
            name: "Possesed Scarecrow",
            hp: 150,
            maxHp: 150,
            attack: 15,
            defense: 5,
            xpReward: 50,
            goldReward: 20,
            loot: [{ name: "Nothing", min: 1, max: 1 }],
            icon: "Images/Scarecrow.png",
            spawnInterval: 10, // in minutes
            lastSpawn: Date.now(),
            hasSpawned: false,
          },
          npcs: {
            farmerBob: {
              name: "Farmer Bob",
              dialogue:
                "Hello, adventurer! Since you're visiting my farm, would you be so kind as to help me? I'll make it worth your time.",
              quests: [
                "quest_001",
                "quest_002",
                "quest_003",
                "quest_004",
                "quest_005",
                "quest_006",
              ], // List of quests he can give
              completedDialogue:
                "Thanks for your help! You really saved the day.",
              options: [{ text: "Maybe later.", action: "renderMainView()" }],
            },
          },
          gatherNodes: [
            {
              id: "Wheat",
              name: "Wheat",
              xpReward: 3,
              quantity: 10,
              maxQuantity: 20,
              baseChance: 0.75,
              gatherXp: 1,
              respawnInterval: 2, // 2 minutes per 1 item
              lastRespawn: Date.now(),
            },
            {
              id: "Sage",
              name: "Sage",
              xpReward: 4,
              quantity: 5,
              maxQuantity: 20,
              baseChance: 0.45,
              gatherXp: 3,
              respawnInterval: 2,
              lastRespawn: Date.now(),
            },
            {
              id: "Chamomile",
              name: "Chamomile",
              xpReward: 3,
              quantity: 8,
              maxQuantity: 20,
              baseChance: 0.65,
              gatherXp: 2,
              respawnInterval: 2,
              lastRespawn: Date.now(),
            },
          ],
        },
        cave: {
          enemies: [],
          lastEnemySpawn: Date.now(),
          spawnInterval: 0.5, // spawn every 30 seconds (0.5 minutes)
          maxEnemies: 3,
          enemyTypes: [
            {
              name: "Bat",
              hp: 10,
              attack: 3,
              defense: 0,
              xpReward: 3,
              goldReward: 1,
              loot: [],
            },
          ],
        },
      },
      quests: [
        {
          id: "quest_001",
          type: "kill",
          target: "Chicken",
          giver: "farmerBob",
          quantity: 5,
          reward: { gold: 20, xp: 20 },
        },
        {
          id: "quest_002",
          type: "kill",
          target: "Cow",
          giver: "farmerBob",
          quantity: 3,
          reward: { gold: 30, xp: 30 },
        },
        {
          id: "quest_003",
          type: "deliver",
          target: "Cooked Meat",
          giver: "farmerBob",
          quantity: 3,
          reward: { gold: 50, xp: 20 },
        },
        {
          id: "quest_004",
          type: "deliver",
          target: "Bread",
          giver: "farmerBob",
          quantity: 3,
          reward: { gold: 50, xp: 20 },
        },
        {
          id: "quest_005",
          type: "deliver",
          target: "Sage",
          giver: "farmerBob",
          quantity: 10,
          reward: { gold: 20, xp: 10 },
        },
        {
          id: "quest_006",
          type: "deliver",
          target: "Chamomile",
          giver: "farmerBob",
          quantity: 10,
          reward: { gold: 20, xp: 10 },
        },
      ],
    },
    log: [],
  };
}
const recipes = [
  {
    name: "Cooked Meat",
    ingredients: { Meat: 5 },
    result: { "Cooked Meat": 1 },
    xp: 5,
    difficulty: 0.4,
  },
  {
    name: "Bread",
    ingredients: { Wheat: 2, Milk: 1 },
    result: { Bread: 1 },
    xp: 1,
    difficulty: 0.2,
  },
  {
    name: "Chamomile Tea",
    ingredients: { Chamomile: 3, Milk: 1 },
    result: { "Chamomile Tea": 1 },
    xp: 3,
    difficulty: 0.4,
  },
  {
    name: "Sage Tea",
    ingredients: { Sage: 3, Milk: 1 },
    result: { "Sage Tea": 1 },
    xp: 3,
    difficulty: 0.4,
  },
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

    if (deltaMs >= 1000) {
      // run every second
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
      player.hp = Math.min(
        player.hp + hpElapsedMinutes * player.hpRegenRate,
        player.maxHp,
      );
      player.lastHpRegen += hpElapsedMinutes * 60000; // advance lastHpRegen by whole minutes
    }

    // --- Stamina Regen ---
    let staminaElapsedMinutes = Math.floor(
      (now - player.lastStaminaRegen) / 60000,
    );
    if (staminaElapsedMinutes >= 1) {
      player.stamina = Math.min(
        player.stamina + staminaElapsedMinutes * player.staminaRegenRate,
        player.maxStamina,
      );
      player.lastStaminaRegen += staminaElapsedMinutes * 60000;
    }
  }

  // --- Enemy Spawn ---
  for (const areaKey in game.world.areas) {
    const area = game.world.areas[areaKey];
    if (!area || !area.enemyTypes || area.enemies.length >= area.maxEnemies)
      continue;

    const spawnElapsedMinutes = (now - area.lastEnemySpawn) / 60000;
    if (spawnElapsedMinutes >= area.spawnInterval) {
      spawnEnemy(areaKey);
      area.lastEnemySpawn = now;
      // if (areaKey === game.world.currentArea) renderMainView();
    }
  }
}
// --- Gather Spawn ---
function updateGatherNodes(areaKey) {
  const area = game.world.areas[areaKey];
  if (!area || !area.gatherNodes) return;

  const now = Date.now();

  area.gatherNodes.forEach((node) => {
    if (node.quantity >= node.maxQuantity) return;

    const timePassedMs = now - node.lastRespawn;
    const timePassedMinutes = timePassedMs / 60000;

    const itemsToRestore = Math.floor(timePassedMinutes / node.respawnInterval);

    if (itemsToRestore > 0) {
      node.quantity = Math.min(
        node.maxQuantity,
        node.quantity + itemsToRestore,
      );

      node.lastRespawn += itemsToRestore * node.respawnInterval * 60000;
    }
  });
}
// ---------------- LEVEL UP SYSTEM ----------------
function checkLevelUp(player) {
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext; // carry over extra XP
    player.level += 1; // increase level

    // Increase XP required for next level (e.g., +50% each level)
    player.xpToNext = Math.floor(player.xpToNext * 1.5);

    // Buff player stats
    player.maxHp += 5; // increase max HP
    player.hp = player.maxHp; // restore HP on level up
    player.maxStamina += 5; // increase max Stamina
    player.attack += 2; // increase attack
    player.defense += 1; // increase defense

    // Optional: alert or log
    addLog(`Leveled up! You are now level ${player.level}`);
  }
}
//----------------SKILLS SECTION--------------
function addSkillXp(skillName, amount) {
  const player = game.player;

  if (!player.skills[skillName]) return;

  player.skillsXp[skillName] += amount;

  const currentLevel = player.skills[skillName];
  const xpNeeded = getXpForSkillLevel(currentLevel);

  if (player.skillsXp[skillName] >= xpNeeded) {
    player.skillsXp[skillName] -= xpNeeded;
    player.skills[skillName]++;
    addLog(
      `${skillName.charAt(0).toUpperCase() + skillName.slice(1)} leveled up to ${player.skills[skillName]}!`,
    );
  }
}
function getXpForSkillLevel(level) {
  return 25 + level * 15;
}
function gainXp(skill, amount) {
  addSkillXp(skill, amount);
  return `(+${amount} ${skill.charAt(0).toUpperCase() + skill.slice(1)} XP)`;
}
// ---------------- SPAWN ENEMY ----------------
// ---------------- ENEMY LEVEL HELPER ----------------
function getEnemyByLevel(baseEnemy, level) {
  const scaleFactor = 1 + (level - 1) * 0.2; // +20% per level
  const clone = structuredClone(baseEnemy);

  clone.level = level;
  clone.hp = Math.round(clone.hp * scaleFactor);
  clone.maxHp = Math.round(clone.maxHp * scaleFactor);
  clone.attack = Math.round(clone.attack * scaleFactor);
  clone.defense = Math.round(clone.defense * scaleFactor);
  clone.xpReward = Math.round(clone.xpReward * scaleFactor);
  if (clone.goldReward?.min != null && clone.goldReward?.max != null) {
    clone.goldReward.min = Math.round(clone.goldReward.min * scaleFactor);
    clone.goldReward.max = Math.round(clone.goldReward.max * scaleFactor);
  }

  return clone;
}

// Returns a random level up to maxLevel
function randomEnemyLevel(maxLevel) {
  return Math.floor(Math.random() * maxLevel) + 1;
}
function spawnEnemy(areaKey) {
  const area = game.world.areas[areaKey];
  if (!area) return;

  // --- Boss spawn ---
  if (area.boss && !area.boss.hasSpawned) {
    const now = Date.now();
    const elapsedMinutes = (now - area.boss.lastSpawn) / 60000;

    if (elapsedMinutes >= area.boss.spawnInterval) {
      area.boss.hasSpawned = true;
      area.boss.lastSpawn = now;

      addLog(`A mighty boss has appeared in ${areaKey}: ${area.boss.name}!`);
      if (game.world.currentArea === areaKey) renderMainView();
      return; // skip regular enemy this tick
    }
  }

  // --- Regular enemy spawn ---
  if (!area.enemyTypes || area.enemies.length >= area.maxEnemies) return;

  const typeIndex = Math.floor(Math.random() * area.enemyTypes.length);
  const enemyData = area.enemyTypes[typeIndex];

  const lootArray = (enemyData.loot || []).map((l) => {
    if (typeof l === "string") return { name: l, min: 1, max: 1 };
    return { name: l.name, min: l.min ?? 1, max: l.max ?? 1 };
  });
  const level = randomEnemyLevel(area.maxLevel || 5);
  const enemy = getEnemyByLevel(enemyData, level);

  area.enemies.push(enemy);
}
//---------POPULATE GAME----------
function populateArea(areaKey) {
  const area = game.world.areas[areaKey];
  if (!area) return;

  // Fill enemies
  if (area.enemyTypes) {
    while (area.enemies.length < area.maxEnemies) {
      spawnEnemy(areaKey);
    }
  }

  // Fill gather nodes
  if (area.gatherTypes) {
    while (area.gatherNodes.length < area.maxGatherNodes) {
      spawnGatherNode(areaKey);
    }
  }
}
//-----------------GATHER ACTION--------------------
function gatherNode(areaKey, nodeId) {
  if (!game?.player?.skills) {
    console.warn("Player skills not ready yet, cannot gather.");
    return;
  }

  const area = game.world.areas[areaKey];
  if (!area) return;

  const node = area.gatherNodes.find((n) => n.id === nodeId);
  if (!node || node.quantity <= 0) return;

  if (game.player.stamina < gatherStamCost) {
    addLog("Not enough stamina to gather!");
    return;
  }

  // Skill & node difficulty
  const baseChance = node.baseChance || 0.5; // node difficulty
  const skillModifier = game.player.skills.gathering * 0.05;
  const successChance = Math.min(baseChance + skillModifier, 1);

  game.player.stamina -= gatherStamCost;

  // Determine XP per node
  const nodeXp = node.gatherXp || 1; // fallback 1 if not defined
  const failXp = nodeXp * 0.2; // 20% XP on failure

  if (Math.random() < successChance) {
    node.quantity--;
    addItemToInventory(node.id, 1);
    safeQuestUpdate();
    addSkillXp("gathering", nodeXp);
    addLog(`You successfully gathered 1 ${node.name}! (+${nodeXp} XP)`);
  } else {
    addSkillXp("gathering", failXp);
    addLog(`You failed to gather ${node.name}... (+${failXp} XP)`);
  }

  renderMainView();
  saveGame();
}

//-------------------COMBAT-----------------------
function startCombat(enemyIndex) {
  const area = game.world.areas[game.world.currentArea];
  if (!area)
    return addLog(`Error: current area "${game.world.currentArea}" not found!`);

  let enemy;
  if (enemyIndex === "boss") {
    const boss = area.boss;
    if (!boss || boss.hp <= 0) return addLog("The boss is not available!");
    enemy = structuredClone({ ...enemyTemplate, ...boss });
    enemy.isBoss = true;
  } else {
    const baseEnemy = area.enemies[enemyIndex];
    if (!baseEnemy)
      return addLog(
        `Error: enemy at index ${enemyIndex} not found in area "${game.world.currentArea}"`,
      );
    // Clone and initialize hp
    enemy = structuredClone(baseEnemy);
    if (!enemy.maxHp) enemy.maxHp = enemy.hp; // fallback if maxHp not set
    enemy = structuredClone(baseEnemy);

    if (enemy.hp == null) {
      enemy.hp = enemy.maxHp;
    }
  }

  if (game.player.stamina < fightStamCost)
    return addLog("Not enough stamina to fight!");
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

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // --- Player attacks ---
  const playerMissChance = 0.1; // 10% chance to miss
  if (Math.random() < playerMissChance) {
    addLog(`You missed ${enemy.name}!`);
  } else {
    // Randomize damage a bit: ±20% around base damage
    const baseDamage = Math.max(0, player.attack - enemy.defense);
    const variance = 0.2; // 20%
    const minDamage = Math.floor(baseDamage * (1 - variance));
    const maxDamage = Math.ceil(baseDamage * (1 + variance));
    const playerDamage = getRandomInt(minDamage, maxDamage);

    enemy.hp -= playerDamage;
    addLog(`You hit ${enemy.name} for ${playerDamage} damage.`);
  }

  // Check if enemy dies
  if (enemy.hp <= 0) {
    defeatEnemy();
    return;
  }

  // --- Enemy attacks ---
  const enemyMissChance = 0.15; // 15% chance to miss
  if (Math.random() < enemyMissChance) {
    addLog(`${enemy.name} missed you!`);
  } else {
    const baseDamage = Math.max(0, enemy.attack - player.defense);
    const variance = 0.2; // 20%
    const minDamage = Math.floor(baseDamage * (1 - variance));
    const maxDamage = Math.ceil(baseDamage * (1 + variance));
    const enemyDamage = getRandomInt(minDamage, maxDamage);

    player.hp -= enemyDamage;
    addLog(`${enemy.name} hits you for ${enemyDamage} damage.`);

    if (player.hp <= 0) {
      player.hp = 0;
      game.combat.active = false;
      addLog("You died...");
    }
  }

  renderSidebar();
  renderLog();
  renderUI(); // combat view
  saveGame();
}

function runFromCombat() {
  const area = game.world.areas[game.world.currentArea];

  // Save enemy HP back to the area if not a boss
  if (!game.combat.enemy.isBoss && game.combat.enemyIndex != null) {
    area.enemies[game.combat.enemyIndex].hp = game.combat.enemy.hp;
  }

  addLog(`You ran away from ${game.combat.enemy.name}!`);

  game.combat.active = false;
  game.combat.enemy = null;
  game.combat.enemyIndex = null;

  saveGame();
  renderUI();
}
function defeatEnemy() {
  const area = game.world.areas[game.world.currentArea];
  const enemy = game.combat.enemy;
  if (!area || !enemy) return;

  // Rewards
  const xpGained = enemy.xpReward || 0;
  game.player.xp += xpGained;
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  const goldEarned = getRandomInt(enemy.goldReward.min, enemy.goldReward.max);
  game.player.gold += goldEarned;

  addLog(
    `${enemy.name} defeated! Gained ${xpGained} XP and ${goldEarned} Gold.`,
  );

  // Loot
  (enemy.loot || []).forEach((item) => {
    const qty =
      Math.floor(Math.random() * (item.max - item.min + 1)) + item.min;
    addItemToInventory(item.name, qty);
    safeQuestUpdate();
    addLog(`Looted ${qty} x ${item.name}.`);
  });
  // check for quest
  onEnemyKilled(enemy.name);
  // Remove from area
  if (!enemy.isBoss && game.combat.enemyIndex != null) {
    area.enemies.splice(game.combat.enemyIndex, 1);
  }

  // Reset boss if defeated
  if (enemy.isBoss) {
    const boss = area.boss;
    if (boss) boss.hasSpawned = false;
  }

  game.combat.active = false;
  game.combat.enemy = null;
  game.combat.enemyIndex = null;

  checkLevelUp(game.player);
  saveGame();
  renderUI();
}

//------------ITEM DATABASE------------------
const itemData = {
  Milk: {
    description: "A bottle of fresh milk. Restores 10 Stamina.",
    usable: true,
  },
  Bread: {
    description: "Simple but filling. Restores 10 HP.",
    usable: true,
  },
  "Cooked Meat": {
    description: "Nicely cooked. Restores 15 HP.",
    usable: true,
  },
  "Chamomile Tea": {
    description: "A calming herbal tea. Restores 25 Stamina.",
    usable: true,
  },
  "Sage Tea": {
    description: "Strong herbal brew. Restores 50 Stamina.",
    usable: true,
  },
  Meat: {
    description: "Raw meat. Better cook it first.",
    usable: false,
  },
  Wheat: {
    description: "Golden grain.",
    usable: false,
  },
};
// ---------------- INVENTORY VIEW ----------------
function openInventory() {
  const main = document.getElementById("main-view");
  const inventory = game.player.inventory;
  const items = Object.keys(inventory).filter((item) => inventory[item] > 0);

  if (items.length === 0) {
    main.innerHTML = `
            <h2>Inventory</h2>
            <p>Your inventory is empty.</p>
            <button onclick="renderMainView()">Back</button>
        `;
    return;
  }

  main.innerHTML = `
        <center><h2>Inventory</h2></center>
        <div class="inventory-grid">
            ${items
              .map((itemName) => {
                const data = itemData[itemName] || {
                  description: "No description.",
                  usable: false,
                };
                const useButton = data.usable
                  ? `<button onclick="useItem('${itemName}')">Use</button>`
                  : `<button disabled class="disabled-btn">Use</button>`;

                return `
                    <div class="inventory-card card-base">
                        <strong>${itemName}</strong>
                        <p>x${inventory[itemName]}</p>

                        ${useButton}
                        <button onclick="dropItem('${itemName}')">
                            Drop
                        </button>

                        <div class="tooltip">
                            ${data.description}
                        </div>
                    </div>
                `;
              })
              .join("")}
        </div>

        <button onclick="renderMainView()">Back</button>
    `;
}

// ---------------- INVENTORY ACTIONS ----------------
function useItem(itemName) {
  const data = itemData[itemName];

  // Item not usable? Stop right there.
  if (!data || !data.usable) {
    addLog(`${itemName} cannot be used.`);
    return;
  }

  if (!game.player.inventory[itemName] || game.player.inventory[itemName] <= 0)
    return;

  addLog(`You used 1 ${itemName}.`);

  // Example effects for some items
  switch (itemName) {
    case "Meat":
      addLog("I should cook this first.");
      break;
    case "Milk":
      game.player.stamina = Math.min(
        game.player.stamina + 10,
        game.player.maxStamina,
      );
      addLog("You drank milk and recovered 10 Stamina.");
      break;
    case "Bread":
      game.player.hp = Math.min(game.player.hp + 10, game.player.maxHp);
      addLog("You ate bread and recovered 10 HP.");
      break;
    case "Cooked Meat":
      game.player.hp = Math.min(game.player.hp + 15, game.player.maxHp);
      addLog("You ate cooked meat and recovered 15 HP.");
      break;
    case "Chamomile Tea":
      game.player.stamina = Math.min(
        game.player.stamina + 25,
        game.player.maxStamina,
      );
      addLog("You drank chamomile tea and recovered 25 Stamina.");
      break;
    case "Sage Tea":
      game.player.stamina = Math.min(
        game.player.stamina + 50,
        game.player.maxStamina,
      );
      addLog("You drank sage tea and recovered 50 Stamina.");
      break;
    // Add more item effects here
  }

  // Reduce quantity
  game.player.inventory[itemName]--;
  if (game.player.inventory[itemName] <= 0)
    delete game.player.inventory[itemName];
  onInventoryChange();
  saveGame();
  openInventory(); // refresh inventory view
}

function dropItem(itemName) {
  if (!game.player.inventory[itemName] || game.player.inventory[itemName] <= 0)
    return;
  onInventoryChange();
  addLog(`You dropped 1 ${itemName}.`);
  game.player.inventory[itemName]--;
  if (game.player.inventory[itemName] <= 0)
    delete game.player.inventory[itemName];

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
        <center><h2>Crafting</h2></center><br><br>
        <div class="crafting-grid">
            ${recipes
              .map((recipe) => {
                const canCraft = Object.keys(recipe.ingredients).every(
                  (item) =>
                    (game.player.inventory[item] || 0) >=
                    recipe.ingredients[item],
                );

                const ingredientsText = Object.keys(recipe.ingredients)
                  .map((item) => {
                    const playerAmount = game.player.inventory[item] || 0;
                    return `${item}: ${playerAmount}/${recipe.ingredients[item]}`;
                  })
                  .join("<br>");

                const resultText = Object.keys(recipe.result)
                  .map((item) => {
                    const data = itemData[item];
                    const description =
                      data?.description || "No description available.";
                    return `${description}`;
                  })
                  .join("<br><br>");

                // --- Success chance calculation for this recipe ---
                const cookingSkill = game.player.skills.cooking || 1;
                const baseChance = 1 - (recipe.difficulty || 0.5);
                const skillModifier = cookingSkill * 0.05;
                const chancePercent = Math.round(
                  Math.min(1, Math.max(0.05, baseChance + skillModifier)) * 100,
                );

                const craftButton = canCraft
                  ? `<button onclick="craftItem('${recipe.name}'); openCrafting();">Craft</button>`
                  : `<button disabled class="disabled-btn">Craft</button>`;

                return `
                    <div class="crafting-card card-base">
                        <strong>${recipe.name}</strong>
                        ${craftButton}
                        <div class="tooltip">
                            ${ingredientsText}<br>
                            ${resultText}<br>
                            XP: ${recipe.xp || 0}<br>
                            Success chance: ${chancePercent}%
                        </div>
                    </div>
                `;
              })
              .join("")}
        </div>

        <button onclick="renderMainView()">Back</button>
    `;
}
function craftItem(recipeName) {
  const recipe = recipes.find((r) => r.name === recipeName);
  if (!recipe) return addLog("Recipe not found!");

  // Check ingredients
  for (let item in recipe.ingredients) {
    if (
      !game.player.inventory[item] ||
      game.player.inventory[item] < recipe.ingredients[item]
    ) {
      return addLog(`Not enough ${item} to craft ${recipe.name}`);
    }
  }

  // Calculate success chance
  const cookingSkill = game.player.skills.cooking || 1;
  const baseChance = 1 - (recipe.difficulty || 0.5);
  const skillModifier = cookingSkill * 0.05;
  const successChance = Math.min(1, Math.max(0.05, baseChance + skillModifier));

  // Deduct ingredients anyway
  for (let item in recipe.ingredients) {
    game.player.inventory[item] -= recipe.ingredients[item];
    if (game.player.inventory[item] <= 0) delete game.player.inventory[item];
  }

  // Determine outcome
  const success = Math.random() < successChance;
  const xpGain = success ? recipe.xp || 0 : (recipe.xp || 0) * 0.2;

  addSkillXp("cooking", xpGain);

  if (success) {
    for (let item in recipe.result) {
      addItemToInventory(item, recipe.result[item]);
      safeQuestUpdate();
    }
    addLog(
      `Successfully crafted ${Object.keys(recipe.result).join(", ")}! (+${xpGain} Cooking XP)`,
    );
  } else {
    addLog(
      `Failed to craft ${recipe.name}. (+${xpGain.toFixed(1)} Cooking XP)`,
    );
  }

  saveGame();
  openCrafting(); // refresh view
}
//----------------------SKILLS VIEW---------
function openSkills() {
  const main = document.getElementById("main-view");

  function skillBar(skillName) {
    const level = game.player.skills[skillName];
    const xp = game.player.skillsXp[skillName];
    const xpNeeded = getXpForSkillLevel(level);
    const percent = Math.min(100, (xp / xpNeeded) * 100);

    return `
            <div style="margin-bottom: 10px;">
                <strong>${skillName.charAt(0).toUpperCase() + skillName.slice(1)}: Level ${level}</strong>
                <div style="background-color: #444; border: 1px solid #222; border-radius: 5px; width: 200px; height: 20px; overflow: hidden;">
                    <div style="
                        width: ${percent}%;
                        height: 100%;
                        background-color: #4caf50;
                        transition: width 0.3s;
                    "></div>
                </div>
                <small>${xp} / ${xpNeeded} XP</small>
            </div>
        `;
  }

  main.innerHTML = `
        <h2>Skills</h2>
        ${skillBar("gathering")}
        ${skillBar("cooking")}
    `;
}
//--------------------SHOP-------------------
function getAvailableShopItems() {
  const availableItems = {};

  // Gather nodes
  for (const areaKey in game.world.areas) {
    const area = game.world.areas[areaKey];
    if (area.gatherNodes) {
      area.gatherNodes.forEach((node) => {
        if (itemPrices[node.id]) {
          availableItems[node.id] = {
            name: node.id,
            price: itemPrices[node.id],
          };
        }
      });
    }
  }

  // Enemy loot
  for (const areaKey in game.world.areas) {
    const area = game.world.areas[areaKey];
    if (area.enemyTypes) {
      area.enemyTypes.forEach((enemy) => {
        (enemy.loot || []).forEach((l) => {
          const name = typeof l === "string" ? l : l.name;
          if (name && itemPrices[name]) {
            availableItems[name] = { name, price: itemPrices[name] };
          }
        });
      });
    }
  }

  // Recipes (crafted items)
  recipes.forEach((r) => {
    for (let resultItem in r.result) {
      if (itemPrices[resultItem]) {
        availableItems[resultItem] = {
          name: resultItem,
          price: itemPrices[resultItem],
        };
      }
    }
  });

  return Object.values(availableItems);
}
function buyShopItem(itemName) {
  const price = itemPrices[itemName];
  if (!price) return addLog(`Cannot buy ${itemName} — item not available!`);

  if (game.player.gold >= price) {
    game.player.gold -= price;
    addItemToInventory(itemName, 1);
    safeQuestUpdate();
    addLog(`You bought 1 ${itemName} for ${price} Gold!`);
    openShop(); // refresh shop
  } else {
    addLog("Not enough gold to buy this item.");
  }
}
//-------------SHOP VIEW-----------
function openShop() {
  const main = document.getElementById("main-view");
  const shopItems = getAvailableShopItems();

  main.innerHTML = `
        <h2>Shop</h2>
        <p>Gold: ${game.player.gold}</p>
        <div class="shop-grid">
            ${shopItems
              .map((item) => {
                const data = itemData[item.name] || {
                  description: "No description.",
                  usable: false,
                };

                // ✅ Buy button logic per item
                const buyButton =
                  game.player.gold >= item.price
                    ? `<button onclick="buyShopItem('${item.name}')">Buy</button>`
                    : `<button disabled class="disabled-btn">Buy</button>`;

                return `
                    <div class="shop-card card-base">
                        <strong>${item.name}</strong><br>
                        ${buyButton}

                        <div class="tooltip">
                            ${data.description}<br><br>
                            Price: ${item.price} Gold
                        </div>
                    </div>
                `;
              })
              .join("")}
        </div>

        <button onclick="renderMainView()">Back</button>
    `;
}
//----------------  quest view-------------
function openQuests() {
  const main = document.getElementById("main-view");
  const quests = game.player.activeQuests;

  if (quests.length === 0) {
    main.innerHTML = `
            <h2>My Quests</h2>
            <p>You don't have any active quests.</p>
        `;
    return;
  }

  main.innerHTML = `
        <h2>My Quests</h2>
        <ul>
            ${quests
              .map(
                (q) => `
                <li>
                    <strong>${q.type} ${q.target}</strong><br>
                    Progress: ${q.progress}/${q.quantity}<br>
                    Reward: ${q.reward.gold} Gold, ${q.reward.xp} XP
                </li>
            `,
              )
              .join("")}
        </ul>
    `;
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
    .map((entry) => `<div class="log-entry">${entry}</div>`)
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
            <button onclick="openQuests()">Quests</button>
            <button onclick="openShop()">Shop</button>
        </div>
    `;
}
function renderMainView() {
  const main = document.getElementById("main-view");
  const areaKey = game.world.currentArea;
  const area = game.world.areas[areaKey];

  // Wrapper content variable
  let mainContent = "";
  updateGatherNodes(game.world.currentArea);
  // Combat overrides all
  if (game.combat.active) {
    mainContent = renderCombatContent();
  }
  // Main starting page
  else if (areaKey === "main") {
    mainContent = `
            <h2>Welcome to Remlandia!</h2>
            <p style="text-align: left;"><Changelog #0.1 
            <br>*Reworked resource nodes and gathering.
	        <br>*Nodes have difficulty - and gathering has a success chance that depends on your skill.
<br>*Different nodes give different xp.
<br>*Failure to gather results in stamina lost, but 20% of node xp.
<br>*Added Teas to restore stamina.
<br>*Milk now restores stamina.
<br>*Game log now persists through page refresh.
<br>*Added Skills section, implemented Cooking and Gathering skills.
	<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*Gathering skill affects gathering success.
	<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*Cooking skill affects cooking success.
<br>*Added shop.
<br>*Randomized gold gained from cows and chickens.
<br>*Rebalanced xp gain from Applewatch enemies.
<br>*Added tooltips for explanation, so it's clear what does what.
<br>*Added NPCs and Questing system.
</p>
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
            <h2>Area: ${areaKey.charAt(0).toUpperCase() + areaKey.slice(1)}</h2>
            <button onclick="renderMainView()" style="margin-left:10px;">Refresh Area</button>
        </div><h2>People in this location:</h2><br>

${
  area.npcs && Object.keys(area.npcs).length > 0
    ? `<div class="area-npcs">
        ${Object.keys(area.npcs)
          .map((npcKey) => {
            const npc = area.npcs[npcKey];

            return `
                <div class="npc-card card-base">
                    <strong>${npc.name}</strong><br>
                    <button onclick="openTalk('${npcKey}')">
                        Talk
                    </button>
                </div>
            `;
          })
          .join("")}
      </div>`
    : "<p>No one is around.</p>"
}
<h2>Enemies in this location:</h2><br>
        <div class="area-enemies">
            ${
              area.enemies.length === 0 &&
              !(area.boss && area.boss.hasSpawned && area.boss.hp > 0)
                ? "<p>No enemies here... yet.</p>"
                : ""
            }

            ${area.enemies
              .map(
                (e, index) => `
                <div class="enemy-card card-base">
                    <strong>${e.name} Lv ${e.level}</strong><br>
                    ${e.hp} HP <br>
                    <button onclick="startCombat(${index})">Fight</button>
                    <div class="tooltip">
                        Stamina cost: ${fightStamCost}
                    </div>
                </div>
            `,
              )
              .join("")}
            
            ${
              area.boss && area.boss.hasSpawned && area.boss.hp > 0
                ? `
                <div class="boss-card card-base">
                    <strong>${area.boss.name}</strong><br>${area.boss.hp} HP <br>
                    <button onclick="startCombat('boss')">Fight</button>
                    <div class="tooltip">
                        Stamina cost: ${fightStamCost}
                    </div>
                </div>
            `
                : ""
            }
        </div>
<h2>Resources in this location:</h2><br>
        ${
          area.gatherNodes && area.gatherNodes.length > 0
            ? `<div class="area-gather">
                ${area.gatherNodes
                  .map((node) => {
                    const gatheringLevel = game?.player?.skills?.gathering || 0;
                    const baseChance = node.baseChance || 0.5;

                    const chancePercent =
                      node.quantity > 0
                        ? Math.min(baseChance + gatheringLevel * 0.05, 1) * 100
                        : 0;

                    return `
                        <div class="gather-card card-base">
                            <strong>${node.name} (${node.quantity})</strong><br>

                            <button
                                onclick='gatherNode("${areaKey}", "${node.id}")'
                                ${node.quantity <= 0 ? "disabled" : ""}
                            >
                                Gather
                            </button>

                            <div class="tooltip">
                                Success chance: ${Math.round(chancePercent)}%<br>
                                Stamina cost: ${gatherStamCost}
                            </div>
                        </div>
                    `;
                  })
                  .join("")}
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

  const playerHpPercent = (game.player.hp / game.player.maxHp) * 100;
  const enemyHpPercent = (enemy.hp / enemy.maxHp) * 100;

  const inventory = game.player.inventory;
  const hpItems = Object.keys(inventory).filter(
    (item) => hpRestoreValues[item] && inventory[item] > 0,
  );

  // Render buttons for HP items dynamically showing how much HP they restore
  const hpButtons = hpItems
    .map((itemName) => {
      const hpAmount = hpRestoreValues[itemName];
      return `<button onclick="useItem('${itemName}'); renderCombatContentInDOM();">
                    ${itemName} (+${hpAmount} HP)
                </button>`;
    })
    .join(" ");

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

        ${hpItems.length > 0 ? `<div class="combat-hp-items">${hpButtons}</div>` : ""}
    `;
}

function renderCombatContentInDOM() {
  const main = document.getElementById("main-view");
  main.innerHTML = `<div class="combat-container">${renderCombatContent()}</div>`;
}
//---------------- TALK ------------
function openTalk(npcKey) {
  const area = game.world.areas[game.world.currentArea];
  const npc = area.npcs[npcKey];
  if (!npc) return;

  const main = document.getElementById("main-view");
  main.innerHTML = ""; // clear existing content

  // Dialogue
  const dialogueEl = document.createElement("p");
  dialogueEl.textContent = npc.dialogue;
  main.appendChild(dialogueEl);

  // Buttons container
  const buttonsContainer = document.createElement("div");
  main.appendChild(buttonsContainer);

  // ---------------- QUEST LOGIC ----------------
  // ---------------- QUEST LOGIC ----------------
  const activeQuests = game.player.activeQuests.map((q) => q.id);

  // Quests ready to complete from this NPC
  const readyQuests = game.player.activeQuests.filter(
    (q) => q.readyToComplete && q.giver === npcKey,
  );
  readyQuests.forEach((q) => {
    const completeBtn = document.createElement("button");
    completeBtn.textContent = `Turn in: ${q.type} ${q.target}`;
    completeBtn.addEventListener("click", () =>
      completeQuestFromNPC(npcKey, q.id),
    );
    buttonsContainer.appendChild(completeBtn);
  });

  // Quests NPC can give — **show all available, not just first**
  const availableQuestIds = npc.quests?.filter(
    (qId) =>
      !activeQuests.includes(qId) && !game.player.completedQuests.includes(qId),
  );

  availableQuestIds?.forEach((qId) => {
    const quest = game.world.quests.find((q) => q.id === qId);
    if (!quest) return;

    const giveBtn = document.createElement("button");
    giveBtn.textContent = `Accept: ${quest.type} ${quest.target} x${quest.quantity}`;
    giveBtn.addEventListener("click", () => giveQuest(npcKey, qId));
    buttonsContainer.appendChild(giveBtn);
  });

  // Normal NPC options
  npc.options.forEach((opt) => {
    const optBtn = document.createElement("button");
    optBtn.textContent = opt.text;

    // If opt.action is a function name as string, convert to function
    if (typeof window[opt.action] === "function") {
      optBtn.addEventListener("click", window[opt.action]);
    } else {
      // fallback: treat as code string
      optBtn.setAttribute("onclick", opt.action);
    }

    buttonsContainer.appendChild(optBtn);
  });

  // NPC name
  const header = document.createElement("h2");
  header.textContent = npc.name;
  main.prepend(header); // put above dialogue
}
// ---------------- GIVE QUEST ----------------
function giveQuest(npcKey, questId) {
  const npc = game.world.areas[game.world.currentArea].npcs[npcKey];
  const quest = game.world.quests.find((q) => q.id === questId);
  if (!npc || !quest) return;

  // Prevent duplicate or completed quests
  if (
    game.player.activeQuests.some((q) => q.id === questId) ||
    game.player.completedQuests.includes(questId)
  ) {
    addLog(`You can't take ${quest.type} ${quest.target} again.`);
    return;
  }
  // Clone quest, assign this NPC as the giver
  const questInstance = {
    ...quest,
    progress: 0,
    readyToComplete: false,
    giver: npcKey,
  };
  game.player.activeQuests.push(questInstance);

  addLog(`Quest accepted: ${quest.type} ${quest.target} x${quest.quantity}`);
  safeQuestUpdate();
  // Optionally mark NPC as currently giving this quest
  npc.currentQuestId = questId;

  // Refresh the NPC talk view
  openTalk(npcKey);
}
// ---------------- SAFE LOGGING FOR DELIVER QUESTS ----------------
function updateQuestProgress(event = {}) {
  if (!game || !game.player) return;

  const { enemyKilled } = event;

  game.player.activeQuests.forEach((quest) => {
    // ---------------- KILL QUESTS ----------------
    if (quest.type === "kill" && enemyKilled === quest.target) {
      quest.progress = (quest.progress || 0) + 1;

      // Log progress
      addLog(
        `Quest progress: ${quest.progress}/${quest.quantity} ${quest.target} killed`,
      );

      if (quest.progress >= quest.quantity && !quest.readyToComplete) {
        quest.readyToComplete = true;
        addLog(
          `Quest ready: ${quest.type} ${quest.target}! Go talk to ${quest.giver}.`,
        );
      }
    }

    // ---------------- DELIVER/GATHER QUESTS ----------------
    if (quest.type === "deliver") {
      const currentProgress = game.player.inventory[quest.target] || 0;
      quest.progress = currentProgress;

      // Only log if progress changed
      if (quest._lastLoggedProgress !== currentProgress) {
        addLog(
          `Quest progress: ${quest.progress}/${quest.quantity} ${quest.target} in inventory`,
        );
        quest._lastLoggedProgress = currentProgress;
      }

      if (quest.progress >= quest.quantity && !quest.readyToComplete) {
        quest.readyToComplete = true;
        addLog(
          `Quest ready: ${quest.type} ${quest.target}! Go talk to ${quest.giver}.`,
        );
      }
    }
  });
}

// ---------------- COMPLETE QUEST ----------------
function completeQuestFromNPC(npcKey, questId) {
  if (!game || !game.player) return;

  const questIndex = game.player.activeQuests.findIndex(
    (q) => q.id === questId && q.giver === npcKey,
  );
  if (questIndex === -1) return;

  const quest = game.player.activeQuests[questIndex];

  if (!quest.readyToComplete) {
    addLog(`You haven't completed ${quest.type} ${quest.target} yet!`);
    return;
  }

  // Remove items from inventory if deliver quest
  if (quest.type === "deliver") {
    const currentCount = game.player.inventory[quest.target] || 0;
    game.player.inventory[quest.target] = Math.max(
      0,
      currentCount - quest.quantity,
    );
  }

  // Give rewards
  if (quest.reward) {
    if (quest.reward.gold) game.player.gold += quest.reward.gold;
    if (quest.reward.xp) game.player.xp += quest.reward.xp;

    // **Trigger level up check after adding XP**
    if (quest.reward.xp) checkLevelUp(game.player);
  }

  addLog(`Quest turned in: ${quest.type} ${quest.target}! Rewards collected.`);

  game.player.activeQuests.splice(questIndex, 1);
  // Mark quest as completed
  game.player.completedQuests.push(questId);

  const npc = game.world?.areas[game.world.currentArea]?.npcs[npcKey];
  if (npc && npc.currentQuestId === questId) npc.currentQuestId = null;

  openTalk(npcKey);
}

// ---------------- SAFE HOOK ----------------
function safeQuestUpdate(event) {
  if (!game) return;
  updateQuestProgress(event);
}

// ---------------- HOOKS ----------------
function onEnemyKilled(enemyName) {
  safeQuestUpdate({ enemyKilled: enemyName });
}

// Call this whenever inventory changes (e.g., picking up items)
function onInventoryChange() {
  safeQuestUpdate();
}

function changeArea(areaKey) {
  game.world.currentArea = areaKey;
  renderSidebar();
  renderLog();
  renderMainView(); // show the area
  saveGame();
}
// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", initGame);

function initGame() {
  let saved = loadGame();

  if (saved) {
    game = saved;

    // Fix missing player skills in old saves
    game.player.skills = game.player.skills || { gathering: 1, cooking: 1 };
    game.player.skillsXp = game.player.skillsXp || { gathering: 0, cooking: 0 };
  } else {
    game = createNewGame();

    for (const areaKey in game.world.areas) {
      populateArea(areaKey);
    }

    saveGame();
  }

  startTimerLoop();
  renderUI();
  renderLog();
}

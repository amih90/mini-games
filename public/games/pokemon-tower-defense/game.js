(() => {
  "use strict";
  if (window.parent !== window) document.documentElement.classList.add("is-embedded");

  let WIDTH = 1600;
  let HEIGHT = 900;
  const GRID = 80;
  const PATH_WIDTH = 96;
  const SAVE_KEY = "mini-games:pokemon-tower-defense:profile";
  const RUN_SAVE_KEY = "mini-games:pokemon-tower-defense:run";
  const SAVE_VERSION = 1;
  const ASSET_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
  const GameData = window.PokemonTDData;
  const { text, pokemonName, locale } = window.PokemonTDLocale;
  const { DIFFICULTIES, EEVEE_EVOLUTIONS } = GameData;
  const TOWER_TYPES = {
    pikachu: {
      name: "פיקאצ׳ו",
      element: "electric",
      cost: 60,
      range: 190,
      rate: 0.56,
      damage: 13,
      attack: "lightning",
      upgradeCosts: [70, 145],
      special: { name: "שרשרת ברקים", detail: "עוד מטרה", icon: "⚡" },
      evolutions: [
        { name: "ראיצ׳ו", image: "raichuAnimated" },
        { name: "ראיצ׳ו · מאסטר ברק", image: "raichuAnimated", mastery: true },
      ],
      color: "#ffe052",
    },
    charmander: {
      name: "צ׳רמנדר",
      element: "fire",
      cost: 75,
      range: 178,
      rate: 1.05,
      damage: 27,
      splash: 54,
      attack: "fire",
      projectileSpeed: 440,
      upgradeCosts: [80, 160],
      special: { name: "להבה מתפוצצת", detail: "פיצוץ גדול", icon: "🔥" },
      evolutions: [
        { name: "צ׳רמיליון", image: "charmeleonAnimated" },
        { name: "צ׳ריזארד", image: "charizardAnimated" },
      ],
      color: "#ff8b4d",
    },
    bulbasaur: {
      name: "בולבזור",
      element: "grass",
      cost: 65,
      range: 188,
      rate: 0.82,
      damage: 18,
      splash: 30,
      slow: 1.1,
      attack: "seed",
      projectileSpeed: 390,
      upgradeCosts: [75, 150],
      special: { name: "שורשים לוכדים", detail: "האטה ארוכה", icon: "🌿" },
      evolutions: [
        { name: "אייביזור", image: "ivysaurAnimated" },
        { name: "ונוסאור", image: "venusaurAnimated" },
      ],
      color: "#70d87b",
    },
    squirtle: {
      name: "סקווירטל",
      element: "water",
      cost: 70,
      range: 182,
      rate: 0.7,
      damage: 16,
      splash: 48,
      slow: 0.7,
      attack: "water",
      projectileSpeed: 500,
      upgradeCosts: [75, 155],
      special: { name: "גל מים", detail: "פיצוץ רחב", icon: "💧" },
      evolutions: [
        { name: "וורטורטל", image: "wartortleAnimated" },
        { name: "בלסטויז", image: "blastoiseAnimated" },
      ],
      color: "#68c9f2",
    },
    eevee: {
      name: "איבי",
      element: "normal",
      cost: 80,
      range: 210,
      rate: 0.65,
      damage: 21,
      splash: 20,
      attack: "star",
      projectileSpeed: 570,
      upgradeCosts: [90, 165],
      special: { name: "כוכב זריז", detail: "ירי מהיר", icon: "⭐" },
      evolutions: [
        { name: "ופוריאון", image: "vaporeonAnimated" },
        { name: "ופוריאון · מאסטר גלים", image: "vaporeonAnimated", mastery: true },
      ],
      color: "#e4ad67",
    },
    magnemite: {
      name: "מגנמייט",
      element: "electric",
      cost: 85,
      range: 215,
      rate: 0.78,
      damage: 24,
      attack: "lightning",
      upgradeCosts: [90, 170],
      special: { name: "שדה מגנטי", detail: "עוד שרשראות", icon: "🧲" },
      evolutions: [
        { name: "מגנטון", image: "magnetonAnimated" },
        { name: "מגנזון", image: "magnezoneAnimated" },
      ],
      color: "#b7d6e3",
    },
    shinx: {
      name: "שינקס",
      element: "electric",
      cost: 70,
      range: 185,
      rate: 0.5,
      damage: 12,
      attack: "lightning",
      upgradeCosts: [75, 150],
      special: { name: "ניצוץ פראי", detail: "ירי מהיר", icon: "⚡" },
      evolutions: [
        { name: "לוקסיו", image: "luxioAnimated" },
        { name: "לוקסריי", image: "luxrayAnimated" },
      ],
      color: "#5da9e9",
    },
    vulpix: {
      name: "וולפיקס",
      element: "fire",
      cost: 80,
      range: 195,
      rate: 0.82,
      damage: 23,
      splash: 44,
      attack: "fire",
      projectileSpeed: 470,
      upgradeCosts: [85, 165],
      special: { name: "אש שועל", detail: "פיצוץ גדול", icon: "🦊" },
      evolutions: [
        { name: "ניינטיילס", image: "ninetalesAnimated" },
        { name: "ניינטיילס · מאסטר אש", image: "ninetalesAnimated", mastery: true },
      ],
      color: "#f3a463",
    },
    torchic: {
      name: "טורצ׳יק",
      element: "fire",
      cost: 68,
      range: 170,
      rate: 0.62,
      damage: 17,
      splash: 34,
      attack: "fire",
      projectileSpeed: 520,
      upgradeCosts: [72, 148],
      special: { name: "בעיטה לוהטת", detail: "ירי מהיר", icon: "🔥" },
      evolutions: [
        { name: "קומבסקן", image: "combuskenAnimated" },
        { name: "בלייזיקן", image: "blazikenAnimated" },
      ],
      color: "#ef6a45",
    },
    mudkip: {
      name: "מדקיפ",
      element: "water",
      cost: 72,
      range: 188,
      rate: 0.76,
      damage: 18,
      splash: 46,
      slow: 0.65,
      attack: "water",
      projectileSpeed: 480,
      upgradeCosts: [78, 155],
      special: { name: "גל בוץ", detail: "האטה רחבה", icon: "🌊" },
      evolutions: [
        { name: "מרשטומפ", image: "marshtompAnimated" },
        { name: "סוואמפרט", image: "swampertAnimated" },
      ],
      color: "#61b8e6",
    },
    piplup: {
      name: "פיפלאפ",
      element: "water",
      cost: 78,
      range: 205,
      rate: 0.72,
      damage: 19,
      splash: 40,
      slow: 0.5,
      attack: "water",
      projectileSpeed: 540,
      upgradeCosts: [82, 160],
      special: { name: "בועת כתר", detail: "טווח ופיצוץ", icon: "👑" },
      evolutions: [
        { name: "פרינפלאפ", image: "prinplupAnimated" },
        { name: "אמפוליאון", image: "empoleonAnimated" },
      ],
      color: "#4c8ed9",
    },
    chikorita: {
      name: "צ׳יקוריטה",
      element: "grass",
      cost: 66,
      range: 202,
      rate: 0.86,
      damage: 17,
      splash: 26,
      slow: 1.25,
      attack: "seed",
      projectileSpeed: 410,
      upgradeCosts: [72, 145],
      special: { name: "עלה מרגיע", detail: "האטה ארוכה", icon: "🍃" },
      evolutions: [
        { name: "בייליף", image: "bayleefAnimated" },
        { name: "מגניום", image: "meganiumAnimated" },
      ],
      color: "#9bcf66",
    },
    rowlet: {
      name: "ראולט",
      element: "grass",
      cost: 82,
      range: 225,
      rate: 0.72,
      damage: 21,
      splash: 28,
      slow: 0.8,
      attack: "seed",
      projectileSpeed: 560,
      upgradeCosts: [88, 170],
      special: { name: "חץ עלים", detail: "טווח ארוך", icon: "🏹" },
      evolutions: [
        { name: "דרטריקס", image: "dartrixAnimated" },
        { name: "דסידואיי", image: "decidueyeAnimated" },
      ],
      color: "#5dbb72",
    },
    abra: {
      name: "אברה",
      element: "psychic",
      cost: 88,
      range: 235,
      rate: 0.92,
      damage: 30,
      splash: 34,
      attack: "star",
      projectileSpeed: 620,
      upgradeCosts: [95, 180],
      special: { name: "גל מוח", detail: "כוח וטווח", icon: "🔮" },
      evolutions: [
        { name: "קדברה", image: "kadabraAnimated" },
        { name: "אלאקזם", image: "alakazamAnimated" },
      ],
      color: "#d9a6ed",
    },
    ralts: {
      name: "ראלטס",
      element: "psychic",
      cost: 76,
      range: 210,
      rate: 0.68,
      damage: 19,
      splash: 38,
      attack: "star",
      projectileSpeed: 580,
      upgradeCosts: [82, 160],
      special: { name: "קסם פיות", detail: "ירי ופיצוץ", icon: "✨" },
      evolutions: [
        { name: "קירליה", image: "kirliaAnimated" },
        { name: "גרדבואר", image: "gardevoirAnimated" },
      ],
      color: "#ef9dd6",
    },
  };
  const ELEMENT_TYPES = {
    all: { name: "הכול", icon: "◈" },
    electric: { name: "חשמל", icon: "⚡" },
    fire: { name: "אש", icon: "🔥" },
    water: { name: "מים", icon: "💧" },
    grass: { name: "צמח", icon: "🌿" },
    psychic: { name: "על-חושי", icon: "🔮" },
    normal: { name: "רגיל", icon: "⭐" },
  };
  const ENEMY_FAMILIES = [
    {
      id: "pidgey",
      stages: [
        { name: "פידג׳י", image: "pidgeyAnimated", health: 0.9, speed: 1.08, radius: 25, reward: 1 },
        { name: "פידג׳וטו", image: "pidgeottoAnimated", health: 1.22, speed: 1.05, radius: 28, reward: 1.25 },
        { name: "פידג׳וט", image: "pidgeotAnimated", health: 1.58, speed: 1.08, radius: 31, reward: 1.55 },
      ],
    },
    {
      id: "weedle",
      stages: [
        { name: "וידל", image: "weedleAnimated", health: 1.18, speed: 0.82, radius: 22, reward: 1.1 },
        { name: "קקונה", image: "kakunaAnimated", health: 1.68, speed: 0.64, radius: 25, reward: 1.35 },
        { name: "בידריל", image: "beedrillAnimated", health: 1.45, speed: 1.18, radius: 30, reward: 1.6 },
      ],
    },
    {
      id: "rattata",
      stages: [
        { name: "רטטה", image: "rattataAnimated", health: 0.74, speed: 1.28, radius: 23, reward: 0.9 },
        { name: "רטיקייט", image: "raticateAnimated", health: 1.35, speed: 1.2, radius: 29, reward: 1.35 },
      ],
    },
    {
      id: "caterpie",
      stages: [
        { name: "קטרפי", image: "caterpieAnimated", health: 1.35, speed: 0.72, radius: 24, reward: 1.2 },
        { name: "מטפוד", image: "metapodAnimated", health: 1.82, speed: 0.58, radius: 26, reward: 1.4 },
        { name: "באטרפרי", image: "butterfreeAnimated", health: 1.5, speed: 1.12, radius: 31, reward: 1.65 },
      ],
    },
    {
      id: "zubat",
      stages: [
        { name: "זובט", image: "zubatAnimated", health: 1, speed: 1, radius: 26, reward: 1 },
        { name: "גולבט", image: "golbatAnimated", health: 1.42, speed: 1.06, radius: 31, reward: 1.4 },
        { name: "קרובט", image: "crobatAnimated", health: 1.62, speed: 1.25, radius: 33, reward: 1.7 },
      ],
    },
    {
      id: "sentret",
      stages: [
        { name: "סנטרט", image: "sentretAnimated", health: 0.88, speed: 1.12, radius: 24, reward: 1 },
        { name: "פיורט", image: "furretAnimated", health: 1.38, speed: 1.18, radius: 30, reward: 1.4 },
      ],
    },
    {
      id: "hoothoot",
      stages: [
        { name: "הוטהוט", image: "hoothootAnimated", health: 1.08, speed: 0.92, radius: 25, reward: 1.05 },
        { name: "נוקטאול", image: "noctowlAnimated", health: 1.55, speed: 1.02, radius: 32, reward: 1.5 },
      ],
    },
    {
      id: "poochyena",
      stages: [
        { name: "פוצ׳יינה", image: "poochyenaAnimated", health: 0.9, speed: 1.2, radius: 24, reward: 1 },
        { name: "מייטיינה", image: "mightyenaAnimated", health: 1.52, speed: 1.14, radius: 31, reward: 1.5 },
      ],
    },
    {
      id: "bidoof",
      stages: [
        { name: "בידוף", image: "bidoofAnimated", health: 1.25, speed: 0.82, radius: 26, reward: 1.1 },
        { name: "ביבראל", image: "bibarelAnimated", health: 1.72, speed: 0.86, radius: 32, reward: 1.55 },
      ],
    },
    {
      id: "starly",
      stages: [
        { name: "סטארלי", image: "starlyAnimated", health: 0.82, speed: 1.25, radius: 23, reward: 1 },
        { name: "סטארביה", image: "staraviaAnimated", health: 1.28, speed: 1.22, radius: 28, reward: 1.35 },
        { name: "סטארפטור", image: "staraptorAnimated", health: 1.65, speed: 1.28, radius: 33, reward: 1.7 },
      ],
    },
    {
      id: "patrat",
      stages: [
        { name: "פטרט", image: "patratAnimated", health: 0.92, speed: 1.14, radius: 23, reward: 1 },
        { name: "ווצ׳וג", image: "watchogAnimated", health: 1.48, speed: 1.08, radius: 30, reward: 1.45 },
      ],
    },
    {
      id: "fletchling",
      stages: [
        { name: "פלצ׳לינג", image: "fletchlingAnimated", health: 0.8, speed: 1.3, radius: 23, reward: 1 },
        { name: "פלצ׳ינדר", image: "fletchinderAnimated", health: 1.3, speed: 1.27, radius: 28, reward: 1.4 },
        { name: "טלונפליים", image: "talonflameAnimated", health: 1.62, speed: 1.34, radius: 32, reward: 1.75 },
      ],
    },
    {
      id: "yungoos",
      stages: [
        { name: "יונגוס", image: "yungoosAnimated", health: 1.02, speed: 1.08, radius: 24, reward: 1 },
        { name: "גאמשוס", image: "gumshoosAnimated", health: 1.62, speed: 0.96, radius: 32, reward: 1.5 },
      ],
    },
    {
      id: "skwovet",
      stages: [
        { name: "סקוובט", image: "skwovetAnimated", health: 1.18, speed: 0.9, radius: 25, reward: 1.05 },
        { name: "גרידנט", image: "greedentAnimated", health: 1.78, speed: 0.82, radius: 33, reward: 1.55 },
      ],
    },
    {
      id: "lechonk",
      stages: [
        { name: "לצ׳ונק", image: "lechonkAnimated", health: 1.16, speed: 0.94, radius: 25, reward: 1.05 },
        { name: "אוינקולון", image: "oinkologneAnimated", health: 1.7, speed: 0.9, radius: 33, reward: 1.55 },
      ],
    },
  ];
  const WAVE_MODIFIERS = [
    { name: "רגיל", icon: "●", health: 1, speed: 1, count: 0 },
    { name: "נחיל", icon: "✦", health: 0.88, speed: 1.04, count: 3 },
    { name: "מהיר", icon: "»", health: 1, speed: 1.2, count: 1 },
    { name: "משוריין", icon: "◆", health: 1.28, speed: 0.94, count: 0 },
  ];
  const BOSS_STAGES = [
    {
      name: "אוניקס",
      image: "onixAnimated",
      weakness: ["water", "seed"],
      weaknessLabel: "מים או צמח",
      mechanic: "מגן אבנים",
      ability: "shield",
      health: 1,
      speed: 0.78,
      radius: 42,
      color: "#c9d0d3",
    },
    {
      name: "האנטר",
      image: "haunterAnimated",
      weakness: "lightning",
      weaknessLabel: "ברק",
      mechanic: "היעלמות",
      ability: "phase",
      health: 1.08,
      speed: 1.02,
      radius: 38,
      color: "#b487df",
    },
    {
      name: "סנורלקס",
      image: "snorlaxAnimated",
      weakness: "fire",
      weaknessLabel: "אש",
      mechanic: "שנת ריפוי",
      ability: "heal",
      health: 1.32,
      speed: 0.62,
      radius: 46,
      color: "#7fc8ba",
    },
    {
      name: "דרגונייט",
      image: "dragoniteAnimated",
      weakness: "star",
      weaknessLabel: "כוכב",
      mechanic: "הסתערות",
      ability: "dash",
      health: 1.18,
      speed: 0.9,
      radius: 43,
      color: "#ffb25f",
    },
  ];
  Object.assign(TOWER_TYPES, GameData.ADDITIONAL_TOWERS);
  const SHOP_TOWER_IDS = GameData.shopTowerIds(TOWER_TYPES, EEVEE_EVOLUTIONS);
  GameData.SHOP_TOWER_IDS = SHOP_TOWER_IDS;
  document.querySelector(".buy-pokemon-button small").textContent =
    text("shopRosterCount", { count: SHOP_TOWER_IDS.length });
  Object.entries(GameData.ELEMENTS).forEach(([id, element]) => {
    ELEMENT_TYPES[id] = { icon: element.icon, name: text(`element.${id}`) };
  });
  ELEMENT_TYPES.all.name = text("element.all");
  ENEMY_FAMILIES.push(...GameData.ADDITIONAL_ENEMY_FAMILIES);
  BOSS_STAGES.push(...GameData.ADDITIONAL_BOSSES);

  const specialDetails = {
    pikachu: "chains", magnemite: "chains", shinx: "speed",
    charmander: "splash", vulpix: "splash", torchic: "speed",
    bulbasaur: "slow", chikorita: "slow", rowlet: "range",
    squirtle: "splash", mudkip: "slow", piplup: "splash",
    abra: "psychic", ralts: "splash", eevee: "speed",
  };
  Object.entries(TOWER_TYPES).forEach(([id, type]) => {
    type.name = pokemonName(id);
    type.special = {
      ...type.special,
      name: text(`special.${type.special.key || id}`),
      detail: text(`specialDetail.${specialDetails[id] || (
        type.attack === "lightning" ? "chains" : type.slow ? "slow" : type.splash ? "splash" : "speed"
      )}`),
    };
    type.evolutions.forEach((evolution) => {
      const name = pokemonName(evolution.image.replace("Animated", ""));
      evolution.name = evolution.mastery ? text("mastery", { name }) : name;
    });
  });
  ENEMY_FAMILIES.forEach((family) => family.stages.forEach((stage) => {
    stage.name = pokemonName(stage.image.replace("Animated", ""));
  }));
  const modifierIds = ["normal", "swarm", "fast", "armored"];
  WAVE_MODIFIERS.forEach((modifier, index) => {
    modifier.id = modifierIds[index];
    modifier.name = text(`modifier.${modifier.id}`);
  });
  const originalBossWeaknesses = {
    onix: ["water", "grass", "ice", "fighting", "ground"],
    haunter: ["psychic", "ghost", "dark"],
    snorlax: ["fighting"],
    dragonite: ["ice", "dragon", "fairy", "rock"],
  };
  BOSS_STAGES.forEach((boss) => {
    boss.id = boss.id || boss.image.replace("Animated", "");
    boss.tier = boss.tier || 1;
    boss.name = pokemonName(boss.id);
    boss.weakness = originalBossWeaknesses[boss.id] || boss.weakness;
    boss.weaknessLabel = boss.weakness.map((element) => ELEMENT_TYPES[element].name).join(text("or"));
    boss.mechanic = text(`mechanic.${boss.ability}`);
  });
  const ENEMY_BY_IMAGE = new Map(ENEMY_FAMILIES.flatMap((family) =>
    family.stages.map((stage) => [stage.image, stage]),
  ));
  let activeMap = GameData.MAPS.classic;
  let PATH = activeMap.route;
  let TERRAIN_BLOCKERS = activeMap.blockers;

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const coinValue = document.getElementById("coinValue");
  const waveValue = document.getElementById("waveValue");
  const lifeValue = document.getElementById("lifeValue");
  const helperText = document.getElementById("helperText");
  const startPanel = document.getElementById("startPanel");
  const gameOverPanel = document.getElementById("gameOverPanel");
  const finalWave = document.getElementById("finalWave");
  const toast = document.getElementById("toast");
  const soundButton = document.getElementById("soundButton");
  const speedButton = document.getElementById("speedButton");
  const upgradePanel = document.getElementById("upgradePanel");
  const upgradeBadge = document.getElementById("upgradeBadge");
  const upgradeName = document.getElementById("upgradeName");
  const upgradeStats = document.getElementById("upgradeStats");
  const heroPortrait = document.getElementById("heroPortrait");
  const specialAbilityIcon = document.getElementById("specialAbilityIcon");
  const specialAbilityName = document.getElementById("specialAbilityName");
  const specialAbilityDetail = document.getElementById("specialAbilityDetail");
  const evolutionDetail = document.getElementById("evolutionDetail");
  const abilityButtons = [...document.querySelectorAll(".ability-button")];
  const waveEnemyIcon = document.getElementById("waveEnemyIcon");
  const waveEnemyName = document.getElementById("waveEnemyName");
  const waveStatus = document.getElementById("waveStatus");
  const waveProgressFill = document.getElementById("waveProgressFill");
  const powerButton = document.getElementById("powerButton");
  const powerLabel = document.getElementById("powerLabel");
  const startWaveButton = document.getElementById("startWaveButton");
  const earlyWaveBonus = document.getElementById("earlyWaveBonus");
  const bossHealth = document.getElementById("bossHealth");
  const bossHealthName = document.getElementById("bossHealthName");
  const bossHealthStatus = document.getElementById("bossHealthStatus");
  const bossHealthFill = document.getElementById("bossHealthFill");
  const bossWarning = document.getElementById("bossWarning");
  const bossWarningImage = document.getElementById("bossWarningImage");
  const bossWarningName = document.getElementById("bossWarningName");
  const bossWarningDetail = document.getElementById("bossWarningDetail");
  const bestWaveValue = document.getElementById("bestWaveValue");
  const bossStarsValue = document.getElementById("bossStarsValue");
  const dexValue = document.getElementById("dexValue");
  const gameOverRewards = document.getElementById("gameOverRewards");
  const tutorialPanel = document.getElementById("tutorialPanel");
  const tutorialStep = document.getElementById("tutorialStep");
  const tutorialTitle = document.getElementById("tutorialTitle");
  const tutorialText = document.getElementById("tutorialText");
  const closeUpgradeButton = document.getElementById("closeUpgradeButton");
  const sellTowerButton = document.getElementById("sellTowerButton");
  const sellTowerValue = document.getElementById("sellTowerValue");
  const openShopButton = document.getElementById("openShopButton");
  const closeShopButton = document.getElementById("closeShopButton");
  const towerShop = document.getElementById("towerShop");
  const typeTabs = document.getElementById("typeTabs");
  const towerGrid = document.getElementById("towerGrid");
  const selectedTowerPortrait = document.getElementById("selectedTowerPortrait");
  const selectedTowerType = document.getElementById("selectedTowerType");
  const selectedTowerName = document.getElementById("selectedTowerName");
  const selectedTowerDetail = document.getElementById("selectedTowerDetail");
  const selectedTowerPrice = document.getElementById("selectedTowerPrice");
  const continueButton = document.getElementById("continueButton");
  const difficultyButtons = [...document.querySelectorAll("[data-difficulty]")];
  const difficultyValue = document.getElementById("difficultyValue");
  const difficultyDescription = document.getElementById("difficultyDescription");
  const eeveeEvolutionChoices = document.getElementById("eeveeEvolutionChoices");
  const eeveeEvolutionOptions = document.getElementById("eeveeEvolutionOptions");
  const pauseButton = document.getElementById("pauseButton");
  const pausePanel = document.getElementById("pausePanel");
  const mapButtons = [...document.querySelectorAll("button[data-map]")];
  const mapValue = document.getElementById("mapValue");
  const mapDescription = document.getElementById("mapDescription");
  let towerButtons = [];

  const images = {};
  const assetUrls = {
    ...Object.fromEntries(Object.entries(GameData.POKEMON).flatMap(([id, pokemon]) => [
      // Retain gameplay species keys; presentation now uses high resolution art
      // with our own reduced-motion-aware idle, attack, lift and hit transforms.
      [`${id}Animated`, `${ASSET_ROOT}/other/official-artwork/${pokemon.dex}.png`],
      [`${id}Art`, `${ASSET_ROOT}/other/official-artwork/${pokemon.dex}.png`],
    ])),
  };

  let state;
  let selectedTower = "pikachu";
  let lastTime = performance.now();
  let toastTimer = 0;
  let audioContext = null;
  const imageLoads = new Map();
  let soundEnabled = true;
  let portalSoundMuted = false;
  let hoverCell = null;
  let keyboardCursor = { x: 120, y: 360 };
  let pointerDrag = null;
  let holdTimer = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let nextId = 1;
  let tutorialIndex = 0;
  let activeShopFilter = "all";
  let portalInstructionsOpen = false;
  let profile = loadProfile();
  let selectedDifficulty = profile.difficulty;
  let selectedMap = profile.mapId;

  const TUTORIAL_STEPS = Array.from({ length: 4 }, (_, index) => [
    text(`tutorialTitle.${index}`), text(`tutorialText.${index}`),
  ]);

  function defaultProfile() {
    return {
      version: SAVE_VERSION,
      bestWave: 0,
      bossStars: 0,
      discoveries: [...SHOP_TOWER_IDS],
      soundEnabled: true,
      gameSpeed: 1,
      difficulty: "medium",
      mapId: "classic",
      tutorialComplete: false,
    };
  }

  function loadProfile() {
    const fallback = defaultProfile();
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      if (!saved || saved.version !== SAVE_VERSION) return fallback;
      return {
        version: SAVE_VERSION,
        bestWave: Math.max(0, Math.min(999, Math.floor(Number(saved.bestWave) || 0))),
        bossStars: Math.max(0, Math.min(9999, Math.floor(Number(saved.bossStars) || 0))),
        discoveries: Array.isArray(saved.discoveries)
          ? [...new Set([...fallback.discoveries, ...saved.discoveries.filter((item) => typeof item === "string")])].slice(0, 1000)
          : fallback.discoveries,
        soundEnabled: saved.soundEnabled !== false,
        gameSpeed: saved.gameSpeed === 2 ? 2 : 1,
        difficulty: Object.hasOwn(DIFFICULTIES, saved.difficulty) ? saved.difficulty : "medium",
        mapId: Object.hasOwn(GameData.MAPS, saved.mapId) ? saved.mapId : "classic",
        tutorialComplete: saved.tutorialComplete === true,
      };
    } catch (error) {
      console.warn("Could not read the saved trainer profile.", error);
      return fallback;
    }
  }

  function saveProfile() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(profile));
    } catch {
      showToast(text("saveProfileError"));
    }
    updateProfileUi();
  }

  function updateProfileUi() {
    bestWaveValue.textContent = String(profile.bestWave);
    bossStarsValue.textContent = String(profile.bossStars);
    dexValue.textContent = String(profile.discoveries.length);
    document.querySelector(".buy-pokemon-button small").textContent =
      text("shopRosterCount", { count: SHOP_TOWER_IDS.length });
  }

  function discoverPokemon(key) {
    if (profile.discoveries.includes(key)) return false;
    profile.discoveries.push(key);
    if (state) state.newDiscoveries += 1;
    saveProfile();
    return true;
  }

  function readRunCheckpoint() {
    try {
      const saved = JSON.parse(localStorage.getItem(RUN_SAVE_KEY) || "null");
      if (!saved || saved.version !== SAVE_VERSION || !Array.isArray(saved.towers)) return null;
      return saved;
    } catch (error) {
      console.warn("Could not read the saved run.", error);
      return null;
    }
  }

  function refreshContinueButton() {
    const saved = readRunCheckpoint();
    continueButton.hidden = !saved;
    if (saved) continueButton.textContent = text("continueWave", { wave: Math.max(1, Number(saved.wave) + 1) });
  }

  function saveRunCheckpoint() {
    if (!state || !state.running || state.over || state.waveActive) return;
    const snapshot = {
      version: SAVE_VERSION,
      routeVersion: 2,
      savedAt: Date.now(),
      coins: state.coins,
      lives: state.lives,
      wave: state.wave,
      power: state.power,
      bossesDefeated: state.bossesDefeated,
      finalEvolutionUnlocked: state.finalEvolutionUnlocked,
      difficulty: state.difficulty,
      mapId: state.mapId,
      camera: { ...state.camera },
      selectedTower,
      buildSelectionActive: state.buildSelectionActive,
      nextEnemyFamilyId: state.nextEnemyFamily.id,
      familyQueue: [...state.familyQueue],
      bossHistory: [...state.bossHistory],
      nextBossId: state.nextBoss.id,
      nextWavePlan: state.nextWavePlan.map((enemy) => enemy.image),
      towers: state.towers.map((tower) => ({
        type: tower.type,
        x: tower.x,
        y: tower.y,
        skills: { ...tower.skills },
        evolutionStage: tower.evolutionStage,
        eeveeEvolution: tower.eeveeEvolution || null,
        spentCoins: tower.spentCoins,
        durability: tower.durability ?? 3,
      })),
    };
    try {
      localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(snapshot));
      refreshContinueButton();
    } catch (error) {
      console.warn("Could not save the current run.", error);
      showToast(text("saveRunError"));
    }
  }

  function clearRunCheckpoint() {
    try {
      localStorage.removeItem(RUN_SAVE_KEY);
    } catch (error) {
      console.warn("Could not clear the saved run.", error);
    }
    refreshContinueButton();
  }

  function restoreRunCheckpoint() {
    const saved = readRunCheckpoint();
    if (!saved) {
      showToast(text("noSave"));
      refreshContinueButton();
      return;
    }
    selectedDifficulty = Object.hasOwn(DIFFICULTIES, saved.difficulty) ? saved.difficulty : "medium";
    selectedMap = Object.hasOwn(GameData.MAPS, saved.mapId) ? saved.mapId : "classic";
    resetGame();
    state.coins = Math.max(0, Math.min(999999, Math.floor(Number(saved.coins) || 0)));
    state.lives = Math.max(1, Math.min(99, Math.floor(Number(saved.lives) || 10)));
    state.wave = Math.max(0, Math.min(999, Math.floor(Number(saved.wave) || 0)));
    state.waveLabel = Math.max(1, state.wave + 1);
    state.power = Math.max(0, Math.min(100, Number(saved.power) || 0));
    state.bossesDefeated = Math.max(0, Math.min(999, Math.floor(Number(saved.bossesDefeated) || 0)));
    state.finalEvolutionUnlocked = saved.finalEvolutionUnlocked === true;
    state.nextEnemyFamily =
      ENEMY_FAMILIES.find((family) => family.id === saved.nextEnemyFamilyId) || pickEnemyFamily();
    if (Array.isArray(saved.familyQueue)) {
      state.familyQueue = [...new Set(saved.familyQueue.filter((id) =>
        ENEMY_FAMILIES.some((family) => family.id === id),
      ))];
    }
    state.bossHistory = Array.isArray(saved.bossHistory)
      ? saved.bossHistory.filter((id) => BOSS_STAGES.some((boss) => boss.id === id))
      : [];
    state.nextBoss = BOSS_STAGES.find((boss) => boss.id === saved.nextBossId) ||
      pickBossForWave(Math.ceil((state.wave + 1) / 5) * 5);
    selectedTower = TOWER_TYPES[saved.selectedTower] ? saved.selectedTower : "pikachu";
    state.buildSelectionActive = saved.buildSelectionActive !== false;
    const restoredCells = new Set();
    let recoveredInvestment = 0;
    state.towers = saved.towers
      .filter((tower) => TOWER_TYPES[tower.type])
      .map((tower) => {
        const type = TOWER_TYPES[tower.type];
        const x = Math.max(40, Math.min(WIDTH - 40, Number(tower.x) || 40));
        const y = Math.max(activeMap.buildTop, Math.min(HEIGHT - 40, Number(tower.y) || activeMap.buildTop));
        return {
          id: nextId++,
          type: tower.type,
          x,
          y,
          level: 1,
          skills: {
            power: Math.max(0, Math.min(3, Math.floor(Number(tower.skills?.power) || 0))),
            range: Math.max(0, Math.min(3, Math.floor(Number(tower.skills?.range) || 0))),
            special: Math.max(0, Math.min(3, Math.floor(Number(tower.skills?.special) || 0))),
          },
          evolutionStage: Math.max(0, Math.min(2, Math.floor(Number(tower.evolutionStage) || 0))),
          eeveeEvolution: tower.type === "eevee" && Number(tower.evolutionStage) > 0
            ? Object.hasOwn(EEVEE_EVOLUTIONS, tower.eeveeEvolution) ? tower.eeveeEvolution : "vaporeon"
            : null,
          spentCoins: Math.max(type.cost, Math.floor(Number(tower.spentCoins) || type.cost)),
          durability: Math.max(1, Math.min(3, Math.floor(Number(tower.durability) || 3))),
          cooldown: 0.2,
          anim: 0,
          placed: 0,
          upgradeAnim: 0,
          evolving: 0,
          targetAngle: 0,
          phase: Math.random() * Math.PI * 2,
        };
      })
      .filter((tower) => {
        const cellKey = `${tower.x}:${tower.y}`;
        const valid =
          isInsideField(tower.x, tower.y) &&
          distanceToPath(tower.x, tower.y) >= PATH_WIDTH / 2 + 34 &&
          !isTerrainBlocked(tower.x, tower.y) &&
          !restoredCells.has(cellKey);
        if (valid) restoredCells.add(cellKey);
        else recoveredInvestment += tower.spentCoins;
        return valid;
      });
    state.coins += recoveredInvestment;
    for (const tower of state.towers) {
      tower.level = getTowerLevel(tower);
      loadTowerAssets(tower);
    }
    prepareNextWave();
    if (Array.isArray(saved.nextWavePlan) && state.wave % 5 !== 4 &&
        saved.nextWavePlan.length === state.nextWavePlan.length &&
        saved.nextWavePlan.every((image) => ENEMY_BY_IMAGE.has(image))) {
      state.nextWavePlan = saved.nextWavePlan.map((image) => ENEMY_BY_IMAGE.get(image));
      preloadWave(state.nextWavePlan);
    }
    if (Array.isArray(saved.nextWavePlan) && state.wave % 5 === 4 &&
        saved.nextWavePlan.length === GameData.bossCount(state.wave + 1, state.difficulty)) {
      const squad = saved.nextWavePlan.map((image) => BOSS_STAGES.find((boss) => boss.image === image));
      if (squad.every(Boolean) && squad[0].id === state.nextBoss.id) {
        state.nextWavePlan = squad;
        preloadWave(squad);
      }
    }
    startPanel.classList.add("is-hidden");
    gameOverPanel.classList.add("is-hidden");
    state.running = true;
    if (saved.camera && Number.isFinite(saved.camera.zoom) &&
        Number.isFinite(saved.camera.x) && Number.isFinite(saved.camera.y)) {
      state.camera = GameData.clampCamera(saved.camera, activeMap);
    }
    state.waveTimer = 1.8;
    state.banner = { text: text("welcomeBack", { wave: state.wave + 1 }), time: 2.6 };
    updateSelectedTowerCard();
    renderTowerShop();
    updateHud();
    updateWaveUi();
    updateDifficultyUi();
    updateMapUi();
    updateCameraUi();
    updatePauseUi();
    saveRunCheckpoint();
    playTone(640, 0.12, "sine", 0.04);
    if (recoveredInvestment) showToast(text("routeRecovery", { coins: recoveredInvestment }), 10000);
  }

  function loadImage(key, url) {
    if (imageLoads.has(key)) return imageLoads.get(key);
    const loading = new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      let triedArtwork = false;
      image.onload = () => {
        images[key] = image;
        resolve(true);
      };
      image.onerror = () => {
        const id = key.replace(/Animated$|Art$/, "");
        const artwork = GameData.POKEMON[id]
          ? `${ASSET_ROOT}/other/home/${GameData.POKEMON[id].dex}.png` : null;
        if (key.endsWith("Animated") && artwork && !triedArtwork) {
          triedArtwork = true;
          image.src = artwork;
          return;
        }
        images[key] = null;
        console.warn(`Pokémon artwork unavailable; using drawn fallback: ${key}`);
        document.querySelectorAll(`img[data-species="${id}"]`).forEach((portrait) => {
          portrait.hidden = true;
          portrait.parentElement.classList.add("art-unavailable");
        });
        showToast(text("artUnavailable", { name: pokemonName(id) }));
        resolve(false);
      };
      image.src = url;
    });
    imageLoads.set(key, loading);
    return loading;
  }

  function loadAssets() {
    [`${selectedTower}Animated`].forEach((key) =>
      loadImage(key, assetUrls[key]),
    );
    updateSelectedTowerCard();
  }

  function loadTowerAssets(tower) {
    loadImage(`${tower.type}Animated`, assetUrls[`${tower.type}Animated`]);
    for (const evolution of getEvolutionPath(tower)) {
      loadImage(evolution.image, assetUrls[evolution.image]);
    }
  }

  function preloadWave(plan) {
    for (const enemy of plan) loadImage(enemy.image, assetUrls[enemy.image]);
  }

  function getTowerDetail(type) {
    return text(`attack.${type.attack}`);
  }

  function updateSelectedTowerCard() {
    const card = document.querySelector(".selected-pokemon-card");
    card.classList.toggle("is-inactive", !state.buildSelectionActive);
    card.setAttribute("aria-label", text(state.buildSelectionActive ? "uiChooseDefender" : "selectionCanceled"));
    canvas.dataset.buildSelection = String(state.buildSelectionActive);
    const type = TOWER_TYPES[selectedTower];
    const element = ELEMENT_TYPES[type.element];
    selectedTowerPortrait.src = assetUrls[`${selectedTower}Art`] || assetUrls[`${selectedTower}Animated`];
    selectedTowerType.textContent = element.name;
    selectedTowerName.textContent = type.name;
    selectedTowerDetail.textContent = getTowerDetail(type);
    selectedTowerPrice.textContent = String(type.cost);
    if (!getSelectedPlacedTower()) helperText.textContent = state.buildSelectionActive
      ? text("selected", { name: type.name }) : text("selectionCanceled");
  }

  function renderTowerShop(filter = activeShopFilter) {
    activeShopFilter = filter;
    document.querySelector(".shop-hint").textContent = text("shopHint", { count: SHOP_TOWER_IDS.length });
    typeTabs.replaceChildren(
      ...Object.entries(ELEMENT_TYPES).map(([key, element]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.type = key;
        button.classList.toggle("is-selected", key === activeShopFilter);
        button.setAttribute("aria-pressed", String(key === activeShopFilter));
        button.textContent = element.name;
        button.style.setProperty("--type-color", GameData.ELEMENTS[key]?.color || "#9acbc4");
        button.addEventListener("click", () => renderTowerShop(key));
        return button;
      }),
    );
    const entries = SHOP_TOWER_IDS.map((id) => [id, TOWER_TYPES[id]]).filter(
      ([, type]) => activeShopFilter === "all" || type.element === activeShopFilter,
    );
    towerGrid.replaceChildren(
      ...entries.map(([key, type]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "shop-tower-card";
        button.dataset.tower = key;
        button.classList.toggle("is-selected", state.buildSelectionActive && key === selectedTower);
        button.setAttribute("aria-pressed", String(state.buildSelectionActive && key === selectedTower));
        button.style.setProperty("--tower-color", type.color);
        button.innerHTML = `
          <span class="card-art"><img data-species="${key}" src="${assetUrls[`${key}Art`]}" alt="" loading="lazy"><i class="card-number">#${String(GameData.POKEMON[key].dex).padStart(3, "0")}</i></span>
          <span class="card-copy"><small class="card-type">${ELEMENT_TYPES[type.element].name}</small><strong>${type.name}</strong><small>${getTowerDetail(type)}</small></span>
          <b class="card-price">${type.cost}<span aria-hidden="true"> ◈</span></b>
        `;
        button.addEventListener("click", () => {
          selectTower(key);
          towerShop.hidden = true;
          updatePowerUi();
          canvas.focus({ preventScroll: true });
        });
        button.querySelector("img").addEventListener("error", (event) => {
          const portrait = event.target;
          if (!portrait.dataset.fallback) {
            portrait.dataset.fallback = "true";
            portrait.src = `${ASSET_ROOT}/other/home/${GameData.POKEMON[key].dex}.png`;
          } else {
            portrait.hidden = true;
            portrait.parentElement.classList.add("art-unavailable");
            portrait.parentElement.setAttribute("aria-label", text("artUnavailable", { name: type.name }));
          }
        });
        return button;
      }),
    );
    towerButtons = [...towerGrid.querySelectorAll(".shop-tower-card")];
  }

  function pickEnemyFamily(excludeId = "") {
    if (!state.familyQueue.length) {
      state.familyQueue = GameData.shuffled(ENEMY_FAMILIES.map((family) => family.id));
    }
    if (state.familyQueue[0] === excludeId && state.familyQueue.length > 1) {
      [state.familyQueue[0], state.familyQueue[1]] = [state.familyQueue[1], state.familyQueue[0]];
    }
    const id = state.familyQueue.shift();
    return ENEMY_FAMILIES.find((family) => family.id === id);
  }

  function getEnemyForWave(family, wave) {
    const maxStage = Math.min(
      family.stages.length - 1,
      Math.floor((wave + DIFFICULTIES[state.difficulty].stageAdvance - 1) / 5),
    );
    return family.stages[Math.max(0, maxStage)];
  }

  function pickBossForWave(wave) {
    const tier = Math.min(3, 1 + Math.floor((wave - 5) / 10));
    const eligible = BOSS_STAGES.filter((boss) => boss.tier <= tier);
    let choices = eligible.filter((boss) => !state.bossHistory.includes(boss.id));
    if (!choices.length) {
      state.bossHistory = state.bossHistory.slice(-1);
      choices = eligible.filter((boss) => !state.bossHistory.includes(boss.id));
    }
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function prepareNextWave() {
    const wave = state.wave + 1;
    if (wave % 5 === 0) {
      const count = GameData.bossCount(wave, state.difficulty);
      const squad = [state.nextBoss];
      const tier = Math.min(3, 1 + Math.floor((wave - 5) / 10));
      const others = GameData.shuffled(BOSS_STAGES.filter((boss) =>
        boss.tier <= tier && boss.id !== state.nextBoss.id,
      ));
      for (let index = 1; index < count; index++) squad.push(others[(index - 1) % others.length]);
      state.nextWavePlan = squad;
    } else {
      const modifier = WAVE_MODIFIERS[(wave - 1) % WAVE_MODIFIERS.length];
      const alternatives = ENEMY_FAMILIES.filter((family) => family.id !== state.nextEnemyFamily.id);
      const secondaryFamily = alternatives[Math.floor(Math.random() * alternatives.length)];
      state.nextWavePlan = GameData.buildWavePlan({
        family: state.nextEnemyFamily,
        secondaryFamily,
        wave,
        count: GameData.waveCount(wave, state.difficulty, modifier),
        difficulty: state.difficulty,
      });
    }
    preloadWave(state.nextWavePlan);
  }

  function waveComposition(plan) {
    const counts = new Map();
    for (const enemy of plan) counts.set(enemy.name, (counts.get(enemy.name) || 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1]).map(([name, count]) => `${count}× ${name}`).join(" + ");
  }

  function updateDifficultyUi() {
    difficultyValue.textContent = text(`difficulty.${state.difficulty}`);
    difficultyDescription.textContent = text(`difficultyDescription.${selectedDifficulty}`);
    difficultyButtons.forEach((button) => {
      const selected = button.dataset.difficulty === selectedDifficulty;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = state.running;
    });
  }

  function selectDifficulty(difficulty) {
    if (state.running || !Object.hasOwn(DIFFICULTIES, difficulty)) return;
    selectedDifficulty = difficulty;
    profile.difficulty = difficulty;
    resetGame();
    saveProfile();
    playTone(480, 0.06, "sine", 0.025);
  }

  function updateMapUi() {
    mapValue.textContent = text(`map.${state.mapId}`);
    mapDescription.textContent = text(`mapDescription.${selectedMap}`);
    const sceneTitle = document.getElementById("sceneTitle");
    if (sceneTitle) {
      sceneTitle.textContent = text(`map.${state.mapId}`);
      document.getElementById("sceneDifficulty").textContent =
        `${text("uiDifficultyLabel")} · ${text(`uiDifficulty${state.difficulty[0].toUpperCase()}${state.difficulty.slice(1)}`)}`;
    }
    canvas.dataset.map = state.mapId;
    canvas.dataset.worldWidth = String(WIDTH);
    canvas.dataset.worldHeight = String(HEIGHT);
    mapButtons.forEach((button) => {
      const selected = button.dataset.map === selectedMap;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
      button.disabled = state.running;
    });
  }

  function selectMap(mapId) {
    if (state.running || !Object.hasOwn(GameData.MAPS, mapId)) return;
    selectedMap = mapId;
    profile.mapId = mapId;
    resetGame();
    saveProfile();
    playTone(560, 0.06, "sine", 0.025);
  }

  function resetGame() {
    soundEnabled = profile.soundEnabled;
    const settings = DIFFICULTIES[selectedDifficulty];
    activeMap = GameData.MAPS[selectedMap];
    WIDTH = activeMap.width;
    HEIGHT = activeMap.height;
    PATH = activeMap.route;
    TERRAIN_BLOCKERS = activeMap.blockers;
    state = {
      running: false,
      over: false,
      difficulty: selectedDifficulty,
      mapId: selectedMap,
      camera: { x: 0, y: 0, zoom: 1 },
      coins: settings.coins,
      lives: settings.lives,
      wave: 0,
      waveLabel: 1,
      waveActive: false,
      waveTimer: 1.1,
      spawnTimer: 0,
      enemiesToSpawn: 0,
      enemiesSpawned: 0,
      enemiesCompleted: 0,
      currentEnemyFamily: ENEMY_FAMILIES[0],
      currentEnemyType: ENEMY_FAMILIES[0].stages[0],
      nextEnemyFamily: ENEMY_FAMILIES[0],
      familyQueue: [],
      wavePlan: [],
      nextWavePlan: [],
      waveModifier: WAVE_MODIFIERS[0],
      currentBoss: null,
      nextBoss: null,
      bossHistory: [],
      isBossWave: false,
      bossesDefeated: 0,
      finalEvolutionUnlocked: false,
      bossShieldAvailable: false,
      bossDefeatedThisWave: false,
      bossesKilledThisWave: 0,
      bossWarningTime: 0,
      towers: [],
      enemies: [],
      projectiles: [],
      particles: [],
      effects: [],
      floats: [],
      shake: 0,
      banner: { text: text("choosePokemon"), time: 2.5 },
      elapsed: 0,
      selectedTowerId: null,
      movingTowerId: null,
      buildSelectionActive: true,
      power: 0,
      combo: 0,
      comboTimer: 0,
      gameSpeed: profile.gameSpeed,
      newDiscoveries: 0,
      tutorialActive: false,
      paused: false,
      instructionsOpen: portalInstructionsOpen,
      choosingEvolution: false,
    };
    state.nextEnemyFamily = pickEnemyFamily();
    state.nextBoss = pickBossForWave(5);
    prepareNextWave();
    hoverCell = null;
    keyboardCursor = {
      x: 120,
      y: Math.ceil((activeMap.buildTop + 160) / GRID) * GRID + GRID / 2,
    };
    cancelPointerGesture();
    towerShop.hidden = true;
    tutorialPanel.hidden = true;
    bossHealth.hidden = true;
    bossWarning.hidden = true;
    updateHud();
    updateSelectedTowerCard();
    updateWaveUi();
    updateSpeedUi();
    updateSoundUi();
    updateProfileUi();
    updateDifficultyUi();
    updateMapUi();
    updatePauseUi();
    updateCameraUi();
    refreshContinueButton();
  }

  function startGame() {
    ensureAudio();
    startPanel.classList.add("is-hidden");
    gameOverPanel.classList.add("is-hidden");
    state.running = true;
    state.waveTimer = 3;
    state.banner = { text: text("protectBasket"), time: 2.3 };
    updateDifficultyUi();
    updateMapUi();
    if (!profile.tutorialComplete) showTutorial(0);
    updatePauseUi();
    saveRunCheckpoint();
    playTone(520, 0.12, "sine", 0.05, "levelUp");
  }

  function beginWave() {
    state.wave += 1;
    state.waveLabel = state.wave;
    state.waveActive = true;
    state.isBossWave = state.wave % 5 === 0;
    state.currentBoss = state.isBossWave ? state.nextBoss : null;
    state.wavePlan = state.nextWavePlan;
    if (state.isBossWave) {
      state.bossHistory.push(...state.wavePlan.map((boss) => boss.id));
      state.nextBoss = pickBossForWave(state.wave + 5);
    }
    if (!state.isBossWave) {
      state.currentEnemyFamily = state.nextEnemyFamily;
      state.currentEnemyType = getEnemyForWave(state.currentEnemyFamily, state.wave);
      state.nextEnemyFamily = pickEnemyFamily(state.currentEnemyFamily.id);
    }
    state.waveModifier = WAVE_MODIFIERS[(state.wave - 1) % WAVE_MODIFIERS.length];
    state.enemiesToSpawn = state.wavePlan.length;
    state.enemiesSpawned = 0;
    state.enemiesCompleted = 0;
    state.spawnTimer = state.isBossWave ? 1.15 : 0;
    state.bossShieldAvailable = state.isBossWave;
    state.bossDefeatedThisWave = false;
    state.bossesKilledThisWave = 0;
    state.bossWarningTime = state.isBossWave ? 2.8 : 0;
    state.banner = {
      text: state.isBossWave
        ? text("bossBattle", { name: state.currentBoss.name })
        : text("waveBanner", { wave: state.wave, name: state.currentEnemyType.name, modifier: state.waveModifier.name }),
      time: 2.4,
    };
    if (state.isBossWave) {
      bossWarningImage.src = assetUrls[state.currentBoss.image];
      bossWarningName.textContent = `${text("bossSquad", { count: state.wavePlan.length })} · ${state.currentBoss.name}`;
      bossWarningDetail.textContent =
        text("weakness", { types: state.currentBoss.weaknessLabel, mechanic: state.currentBoss.mechanic });
      bossWarning.hidden = false;
      for (const boss of state.wavePlan) discoverPokemon(`boss-${boss.image}`);
    } else {
      for (const enemy of state.wavePlan) discoverPokemon(`enemy-${enemy.image}`);
    }
    updateHud();
    updateWaveUi();
    playTone(330, 0.08, "square", 0.025, "levelUp");
  }

  function completeWave() {
    state.waveActive = false;
    const bossVictory = state.isBossWave && state.bossesKilledThisWave === state.enemiesToSpawn;
    const bonus = state.isBossWave
      ? GameData.bossWaveReward(state.wave, state.bossesKilledThisWave, state.enemiesToSpawn)
      : 18 + state.wave * 3;
    state.coins += bonus;
    state.waveTimer = Math.max(4.5, 8 - state.wave * 0.14);
    state.banner = {
      text: state.isBossWave
        ? bossVictory
          ? text("bossCompleted", { coins: bonus })
          : text("bossEscaped")
        : text("waveCompleted", { coins: bonus }),
      time: state.isBossWave ? 3 : 2.1,
    };
    burst(WIDTH / 2, HEIGHT / 2, "#ffe66c", 26, 150);
    profile.bestWave = Math.max(profile.bestWave, state.wave);
    saveProfile();
    prepareNextWave();
    updateHud();
    updateWaveUi();
    saveRunCheckpoint();
    playTone(660, 0.09, "sine", 0.04, "success");
  }

  function spawnEnemy() {
    const wave = state.wave;
    const isBoss = state.isBossWave;
    const enemyType = state.wavePlan[state.enemiesSpawned];
    const stats = GameData.enemyStats(enemyType, wave, state.difficulty, state.waveModifier, isBoss);
    const health = stats.health;
    state.enemies.push({
      id: nextId++,
      name: enemyType.name,
      image: enemyType.image,
      x: PATH[0].x,
      y: PATH[0].y,
      segment: 0,
      health,
      maxHealth: health,
      speed: stats.speed,
      baseSpeed: stats.baseSpeed,
      radius: stats.radius,
      rewardMultiplier: stats.rewardMultiplier,
      boss: isBoss,
      bossData: isBoss ? enemyType : null,
      modifier: isBoss ? "boss" : state.waveModifier.id,
      abilityTimer: isBoss ? 4.2 * DIFFICULTIES[state.difficulty].abilityInterval : 0,
      strikeTimer: isBoss ? 6 * DIFFICULTIES[state.difficulty].abilityInterval : 0,
      strike: null,
      abilityMode: "",
      abilityState: "",
      abilityTime: 0,
      shielded: false,
      phased: false,
      healInterruptDamage: 0,
      slow: 0,
      hit: 0,
      bob: Math.random() * Math.PI * 2,
      spawnAnim: isBoss ? 1 : 0,
      escaped: false,
      dead: false,
    });
  }

  function update(dt) {
    if (simulationPaused()) return;
    state.elapsed += dt;
    if (state.banner.time > 0) state.banner.time -= dt;
    if (state.bossWarningTime > 0) {
      state.bossWarningTime -= dt;
      if (state.bossWarningTime <= 0) bossWarning.hidden = true;
    }
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }
    updateParticles(dt);
    if (!state.running || state.over || state.tutorialActive) return;

    if (!state.waveActive) {
      state.waveTimer -= dt;
      if (state.waveTimer <= 0) beginWave();
    } else {
      state.spawnTimer -= dt;
      if (state.enemiesSpawned < state.enemiesToSpawn && state.spawnTimer <= 0) {
        spawnEnemy();
        state.enemiesSpawned += 1;
        state.spawnTimer = state.isBossWave
          ? (state.difficulty === "hard" ? 1.8 : 2.5)
          : Math.max(0.38, 1.05 - state.wave * 0.025) * DIFFICULTIES[state.difficulty].spawnInterval;
      }
    }

    updateEnemies(dt);
    if (state.over) {
      cleanupEntities();
      updateWaveUi();
      return;
    }
    updateTowers(dt);
    updateProjectiles(dt);
    cleanupEntities();
    updateWaveUi();
    updatePowerUi();

    if (
      state.running &&
      !state.over &&
      state.waveActive &&
      state.enemiesSpawned >= state.enemiesToSpawn &&
      state.enemies.length === 0
    ) {
      completeWave();
    }
    state.shake = Math.max(0, state.shake - dt * 14);
  }

  function updateEnemies(dt) {
    for (const enemy of state.enemies) {
      if (enemy.dead || enemy.escaped) continue;
      enemy.hit = Math.max(0, enemy.hit - dt * 5);
      enemy.spawnAnim = Math.max(0, enemy.spawnAnim - dt * 0.75);
      enemy.slow = Math.max(0, enemy.slow - dt);
      if (enemy.boss) {
        updateBossStrike(enemy, dt);
        updateBossMechanic(enemy, dt);
      }
      const target = PATH[enemy.segment + 1];
      if (!target) {
        if (enemy.boss && state.bossShieldAvailable) {
          state.bossShieldAvailable = false;
          const rewind = PATH[PATH.length - 1].distance - 450;
          enemy.segment = Math.max(0, PATH.findIndex((point) => point.distance >= rewind));
          enemy.x = PATH[enemy.segment].x;
          enemy.y = PATH[enemy.segment].y;
          enemy.health = Math.max(1, enemy.health * 0.82);
          enemy.shielded = false;
          enemy.phased = false;
          enemy.abilityMode = "berryShield";
          enemy.abilityState = text("bossAbility.berryShield");
          enemy.abilityTime = 1.8;
          state.banner = { text: text("berryShield"), time: 2.4 };
          state.shake = 12;
          burst(enemy.x, enemy.y, "#9cf5ff", 38, 210);
          playTone(760, 0.18, "sine", 0.05);
          continue;
        }
        enemy.escaped = true;
        state.enemiesCompleted += 1;
        state.lives -= enemy.boss ? 2 : 1;
        state.shake = 8;
        burst(enemy.x, enemy.y, "#8657a4", 18, 130);
        addFloat(enemy.x, enemy.y - 20, text(enemy.boss ? "bossStoleLives" : "berryStolen"), "#fff");
        playTone(130, 0.18, "sawtooth", 0.04);
        updateHud();
        if (state.lives <= 0) {
          endGame();
          break;
        }
        continue;
      }
      const dashMultiplier = enemy.abilityMode === "dash"
        ? DIFFICULTIES[state.difficulty].dash
        : enemy.abilityMode === "enrage" ? 1.35 : 1;
      const move = enemy.speed * dashMultiplier * (enemy.slow > 0 ? 0.65 : 1) * dt;
      GameData.advanceRoute(PATH, enemy, move);
    }

    function updateBossMechanic(enemy, dt) {
      const settings = DIFFICULTIES[state.difficulty];
      if (enemy.abilityTime > 0) {
        enemy.abilityTime -= dt;
        if (enemy.abilityTime > 0) return;
        enemy.shielded = false;
        enemy.phased = false;
        if (enemy.abilityMode === "heal") {
          enemy.health = Math.min(enemy.maxHealth, enemy.health + enemy.maxHealth * settings.heal);
          addFloat(enemy.x, enemy.y - 45, text("recovered"), "#9dff9f");
        }
        enemy.abilityMode = "";
        enemy.abilityState = "";
        enemy.abilityTimer = (5.2 + Math.random() * 1.2) * settings.abilityInterval;
      }
      enemy.abilityTimer -= dt;
      if (enemy.abilityTimer > 0) return;
      const ability = enemy.bossData.ability;
      enemy.abilityMode = ability;
      enemy.abilityState = text(`bossAbility.${ability}`);
      if (ability === "shield") {
        enemy.shielded = true;
        enemy.abilityTime = 1.9;
      } else if (ability === "phase") {
        enemy.phased = true;
        enemy.abilityTime = 1.45;
      } else if (ability === "heal") {
        enemy.abilityTime = 1.55;
        enemy.healInterruptDamage = 0;
      } else if (ability === "dash") {
        enemy.abilityTime = 1.5;
      } else if (ability === "storm") {
        enemy.abilityTime = 1.2;
        const points = [{ x: enemy.x, y: enemy.y }];
        for (const tower of state.towers) {
          if (Math.hypot(tower.x - enemy.x, tower.y - enemy.y) > 300) continue;
          tower.cooldown = Math.max(tower.cooldown, settings.storm);
          points.push({ x: tower.x, y: tower.y });
        }
        if (points.length > 1) {
          state.effects.push({ type: "lightning", points, life: 0.4, maxLife: 0.4 });
        }
        burst(enemy.x, enemy.y, enemy.bossData.color, 24, 180);
      } else if (ability === "enrage") {
        enemy.shielded = true;
        enemy.abilityTime = 3.2;
      }
      state.shake = Math.max(state.shake, 4);
      addFloat(enemy.x, enemy.y - 50, enemy.abilityState, enemy.bossData.color);
    }
  }

  function updateBossStrike(enemy, dt) {
    if (enemy.strike) {
      enemy.strike.time -= dt;
      if (enemy.strike.time > 0) return;
      const strike = enemy.strike;
      enemy.strike = null;
      burst(strike.x, strike.y, "#ff6954", 24, 180);
      for (const tower of [...state.towers]) {
        if (Math.hypot(tower.x - strike.x, tower.y - strike.y) > 65) continue;
        const result = GameData.towerStrike(tower.durability ?? 3, state.difficulty);
        tower.durability = result.durability;
        tower.cooldown = Math.max(tower.cooldown, result.stun);
        if (tower.durability === 0) {
          const refund = Math.floor((tower.spentCoins || TOWER_TYPES[tower.type].cost) * 0.65);
          state.coins += refund;
          state.towers = state.towers.filter((candidate) => candidate.id !== tower.id);
          if (state.selectedTowerId === tower.id) state.selectedTowerId = null;
          if (state.movingTowerId === tower.id) state.movingTowerId = null;
          showToast(text("towerLost", { name: getTowerName(tower), coins: refund }));
        } else {
          showToast(text(state.difficulty === "easy" ? "towerStunned" : "towerHit", { hp: tower.durability }));
        }
      }
      playTone(160, 0.12, "sawtooth", 0.025, "hit");
      updateHud();
      return;
    }
    enemy.strikeTimer -= dt;
    if (enemy.strikeTimer > 0) return;
    enemy.strikeTimer = 9 * DIFFICULTIES[state.difficulty].abilityInterval;
    const target = state.towers
      .filter((tower) => Math.hypot(tower.x - enemy.x, tower.y - enemy.y) < 340)
      .sort((a, b) => Math.hypot(a.x - enemy.x, a.y - enemy.y) - Math.hypot(b.x - enemy.x, b.y - enemy.y))[0];
    if (!target) return;
    // Target the ground, not a homing hit: moving away really dodges the attack.
    enemy.strike = { x: target.x, y: target.y, time: 2.4, duration: 2.4 };
    showToast(text("towerThreat"));
    playTone(280, 0.1, "square", 0.025, "hit");
  }

  function getTowerStats(tower) {
    return GameData.towerStats(TOWER_TYPES[tower.type], tower);
  }

  function getTowerType(tower) {
    const type = GameData.towerType(TOWER_TYPES[tower.type], tower);
    if (tower.type !== "eevee" || !tower.evolutionStage) return type;
    return {
      ...type,
      special: {
        ...type.special,
        name: text(`special.${type.element}`),
        detail: text(`specialDetail.${type.attack === "lightning" ? "chains" : type.slow ? "slow" : "splash"}`),
      },
    };
  }

  function getEvolutionPath(tower) {
    if (tower.type !== "eevee") return TOWER_TYPES[tower.type].evolutions;
    if (!tower.eeveeEvolution && !tower.evolutionStage) return [];
    const evolution = tower.eeveeEvolution || "vaporeon";
    const name = pokemonName(evolution);
    return [
      { name, image: `${evolution}Animated` },
      { name: text("mastery", { name }), image: `${evolution}Animated`, mastery: true },
    ];
  }

  function getSpentAbilityPoints(tower) {
    return Object.values(tower.skills || {}).reduce((sum, rank) => sum + rank, 0);
  }

  function getTowerLevel(tower) {
    return 1 + Math.floor(getSpentAbilityPoints(tower) / 2) + (tower.evolutionStage || 0);
  }

  function getAbilityCost(tower, ability) {
    const type = TOWER_TYPES[tower.type];
    if (ability === "evolution") return type.upgradeCosts[tower.evolutionStage || 0];
    const rank = tower.skills[ability];
    const base = { power: 38, range: 34, special: 42 }[ability];
    return Math.round((base + type.cost * 0.16 + rank * 28) / 5) * 5;
  }

  function getTowerName(tower) {
    const type = TOWER_TYPES[tower.type];
    const stage = tower.evolutionStage || 0;
    return stage ? getEvolutionPath(tower)[stage - 1].name : type.name;
  }

  function getTowerImage(tower) {
    const stage = tower.evolutionStage || 0;
    const evolution = stage ? getEvolutionPath(tower)[stage - 1] : null;
    if (evolution && images[evolution.image]) {
      return images[evolution.image];
    }
    return images[`${tower.type}Animated`] || images[`${tower.type}Art`];
  }

  function getSelectedPlacedTower() {
    return state.towers.find((tower) => tower.id === state.selectedTowerId) || null;
  }

  function updateSelectedTowerHelper(tower) {
    const stats = getTowerStats(tower);
    helperText.textContent = text("towerHelper", { name: getTowerName(tower), damage: stats.damage, range: stats.range });
  }

  function updateUpgradePanel() {
    if (!state) return;
    canvas.dataset.movingTower = state.movingTowerId ? String(state.movingTowerId) : "";
    const tower = getSelectedPlacedTower();
    upgradePanel.hidden = !tower;
    closeUpgradeButton.hidden = !tower;
    if (!tower) {
      state.choosingEvolution = false;
      eeveeEvolutionChoices.hidden = true;
      return;
    }
    const type = getTowerType(tower);
    const stats = getTowerStats(tower);
    tower.level = getTowerLevel(tower);
    upgradeBadge.textContent = `${tower.durability ?? 3}/3 · ${text("uiLevel")} ${tower.level}`;
    upgradeName.textContent = getTowerName(tower);
    upgradeStats.textContent = text("towerStats", { damage: stats.damage, range: stats.range, rate: (1 / stats.rate).toFixed(1) });
    const stage = tower.evolutionStage || 0;
    const evolutions = getEvolutionPath(tower);
    const nextEvolution = evolutions[stage];
    const portraitKey = stage ? evolutions[stage - 1].image : `${tower.type}Animated`;
    heroPortrait.src = assetUrls[portraitKey] || assetUrls[`${tower.type}Art`];
    specialAbilityIcon.innerHTML = upgradeIllustration("special");
    specialAbilityName.textContent = type.special.name;
    specialAbilityDetail.textContent = type.special.detail;
    const spent = getSpentAbilityPoints(tower);
    const evolutionIcon = document.querySelector('[data-ability="evolution"] .ability-icon');
    const evolutionSpecies = nextEvolution?.image.replace("Animated", "");
    const evolutionArt = assetUrls[`${evolutionSpecies}Art`] || assetUrls[nextEvolution?.image];
    if (evolutionArt && evolutionIcon.dataset.species !== evolutionSpecies) {
      const portrait = document.createElement("img");
      portrait.alt = "";
      portrait.src = evolutionArt;
      portrait.addEventListener("error", () => {
        evolutionIcon.innerHTML = upgradeIllustration("evolution");
      });
      evolutionIcon.replaceChildren(portrait);
      evolutionIcon.dataset.species = evolutionSpecies;
    } else if (!evolutionArt) {
      evolutionIcon.innerHTML = upgradeIllustration("evolution");
      delete evolutionIcon.dataset.species;
    }
    const requiredPoints = stage === 0 ? 3 : 6;
    evolutionDetail.textContent =
      stage >= 2
        ? text("maxFormComplete")
        : stage === 1 && !state.finalEvolutionUnlocked
          ? text("defeatBossForFinal")
          : spent >= requiredPoints
            ? tower.type === "eevee" && stage === 0
              ? text("chooseEevee")
              : text(nextEvolution.mastery ? "masterInto" : "evolveInto", { name: nextEvolution.name })
            : text("moreUpgrades", { count: requiredPoints - spent });

    eeveeEvolutionChoices.hidden = !(tower.type === "eevee" && stage === 0 && state.choosingEvolution);
    if (!eeveeEvolutionChoices.hidden) renderEeveeChoices(tower);

    for (const button of abilityButtons) {
      const ability = button.dataset.ability;
      const isEvolution = ability === "evolution";
      const rank = isEvolution ? stage : tower.skills[ability];
      const maxRank = isEvolution ? 2 : 3;
      const maxed = rank >= maxRank;
      const locked =
        isEvolution &&
        !maxed &&
        (spent < requiredPoints || (stage === 1 && !state.finalEvolutionUnlocked));
      const cost = getAbilityCost(tower, ability);
      const affordable = !maxed && !locked && state.coins >= cost;
      button.disabled = maxed || locked || !affordable || state.paused || state.instructionsOpen;
      button.classList.toggle("is-maxed", maxed);
      button.classList.toggle("is-locked", locked);
      button.classList.toggle("is-affordable", affordable);
      button.classList.toggle("is-unaffordable", !maxed && !locked && state.coins < cost);
      const statusIcon = button.querySelector(".ability-state");
      statusIcon.innerHTML = maxed
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : locked
          ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="12" cy="15" r="2" fill="#192b3a"/></svg>'
          : "";
      const ranks = button.querySelector(".ability-ranks");
      const dotCount = isEvolution && locked ? requiredPoints : maxRank;
      const filledDots = isEvolution && locked ? Math.min(spent, requiredPoints) : rank;
      ranks.replaceChildren(
        ...Array.from({ length: dotCount }, (_, index) => {
          const pip = document.createElement("i");
          pip.classList.toggle("is-filled", index < filledDots);
          return pip;
        }),
      );
      const price = button.querySelector(".ability-price");
      price.textContent = maxed ? "✓" : `${cost} ◈`;
      button.setAttribute(
        "aria-label",
        text("abilityLabel", {
          name: button.querySelector("strong").textContent, rank, max: maxRank,
          status: maxed ? text("maxed")
            : locked ? `${text("locked")} · ${text("price", { coins: cost })}`
              : state.coins < cost ? text("missingCoins", { coins: cost - state.coins })
                : text("price", { coins: cost }),
        }),
      );
      button.title = button.getAttribute("aria-label");
      button.setAttribute("aria-description", button.querySelector(".ability-detail").textContent);
    }
    const sellValue = Math.max(1, Math.floor((tower.spentCoins || type.cost) * 0.65));
    sellTowerValue.textContent = String(sellValue);
    const sellPortrait = document.getElementById("sellTowerPortrait");
    if (sellPortrait.getAttribute("src") !== heroPortrait.getAttribute("src")) {
      sellPortrait.src = heroPortrait.src;
    }
    sellTowerButton.setAttribute("aria-label", text("sellLabel", { name: getTowerName(tower), coins: sellValue }));
    sellTowerButton.title = sellTowerButton.getAttribute("aria-label");
    canvas.dataset.movingTower = state.movingTowerId ? String(state.movingTowerId) : "";
  }

  function renderEeveeChoices(tower) {
    const cost = getAbilityCost(tower, "evolution");
    if (eeveeEvolutionOptions.dataset.towerId !== String(tower.id)) {
      eeveeEvolutionOptions.dataset.towerId = String(tower.id);
      eeveeEvolutionOptions.replaceChildren(...Object.entries(EEVEE_EVOLUTIONS).map(([id, branch]) => {
        const button = document.createElement("button");
        const element = ELEMENT_TYPES[branch.element];
        button.type = "button";
        button.className = "evolution-choice";
        button.dataset.evolution = id;
        button.innerHTML = `
          <img src="${assetUrls[`${id}Art`]}" alt="" loading="lazy">
          <strong>${pokemonName(id)}</strong>
          <small>${element.icon} ${element.name}</small>
          <b>${cost}</b>
        `;
        button.addEventListener("click", () => purchaseAbility("evolution", id));
        return button;
      }));
    }
    eeveeEvolutionOptions.querySelectorAll("button").forEach((button) => {
      button.disabled = state.coins < cost;
    });
  }

  function purchaseAbility(ability, evolutionChoice) {
    const tower = getSelectedPlacedTower();
    if (!tower || !state.running || state.over || state.paused || state.instructionsOpen) return;
    if (!["power", "range", "special", "evolution"].includes(ability)) {
      throw new Error(`Unknown Pokémon ability: ${ability}`);
    }
    const isEvolution = ability === "evolution";
    const spent = getSpentAbilityPoints(tower);
    const stage = tower.evolutionStage || 0;
    const requiredPoints = stage === 0 ? 3 : 6;
    if (isEvolution && stage >= 2) {
      showToast(text("alreadyMaxForm"));
      return;
    }
    if (isEvolution && stage === 1 && !state.finalEvolutionUnlocked) {
      showToast(text("firstBossNeeded"));
      return;
    }
    if (isEvolution && spent < requiredPoints) {
      showToast(text("moreAbilityUpgrades", { count: requiredPoints - spent }));
      return;
    }
    if (!isEvolution && tower.skills[ability] >= 3) {
      showToast(text("abilityMaxed"));
      return;
    }
    const cost = getAbilityCost(tower, ability);
    if (state.coins < cost) {
      showToast(text("missingCoins", { coins: cost - state.coins }));
      playTone(145, 0.07, "square", 0.018);
      return;
    }
    if (isEvolution && tower.type === "eevee" && stage === 0) {
      if (!evolutionChoice) {
        state.choosingEvolution = true;
        updateUpgradePanel();
        return;
      }
      if (!Object.hasOwn(EEVEE_EVOLUTIONS, evolutionChoice)) {
        showToast(text("invalidEvolution"));
        return;
      }
      tower.eeveeEvolution = evolutionChoice;
    }
    state.choosingEvolution = false;
    state.coins -= cost;
    tower.spentCoins += cost;
    if (isEvolution) tower.evolutionStage += 1;
    else tower.skills[ability] += 1;
    tower.level = getTowerLevel(tower);
    if (!reducedMotion) {
      const purchasedTile = abilityButtons.find((button) => button.dataset.ability === ability);
      purchasedTile.classList.add("is-purchased");
      setTimeout(() => purchasedTile.classList.remove("is-purchased"), 800);
    }
    const maxEvolution = isEvolution && tower.evolutionStage === 2;
    tower.upgradeAnim = 1;
    tower.evolving = isEvolution ? 1 : 0;
    tower.cooldown = Math.min(tower.cooldown, 0.15);
    if (isEvolution) loadTowerAssets(tower);
    state.shake = Math.max(state.shake, maxEvolution ? 14 : isEvolution ? 9 : 2.5);
    state.effects.push({
      type: isEvolution ? "evolution" : "upgrade",
      x: tower.x,
      y: tower.y,
      life: maxEvolution ? 1.8 : isEvolution ? 1.35 : 0.85,
      maxLife: maxEvolution ? 1.8 : isEvolution ? 1.35 : 0.85,
      maxTier: maxEvolution,
      color: getTowerStats(tower).color,
    });
    burst(
      tower.x,
      tower.y,
      "#fff272",
      maxEvolution ? 76 : isEvolution ? 52 : 26,
      maxEvolution ? 290 : isEvolution ? 230 : 165,
    );
    if (isEvolution) {
      const evolvedName = getTowerName(tower);
      const maxed = tower.evolutionStage === 2;
      state.banner = {
        text: text(maxed ? "finalForm" : "evolved", { name: evolvedName }),
        time: maxed ? 3.2 : 2.6,
      };
      addFloat(tower.x, tower.y - 48, maxed ? text("maxForm") : text("evolved", { name: evolvedName }), "#fff27a");
    } else {
      const abilityNames = {
        power: text("power"),
        range: text("range"),
        special: getTowerType(tower).special.name,
      };
      addFloat(
        tower.x,
        tower.y - 48,
        `${abilityNames[ability]} ${tower.skills[ability]}`,
        "#fff27a",
      );
    }
    updateSelectedTowerHelper(tower);
    playTone(520, 0.12, "sine", 0.04, isEvolution ? "powerUp" : "levelUp");
    updateHud();
    saveRunCheckpoint();
  }

  function updateTowers(dt) {
    for (const tower of state.towers) {
      tower.cooldown -= dt;
      tower.anim = Math.max(0, tower.anim - dt * 4.5);
      tower.placed = Math.max(0, tower.placed - dt * 2.8);
      tower.upgradeAnim = Math.max(0, tower.upgradeAnim - dt * 2.1);
      tower.evolving = Math.max(0, tower.evolving - dt * 0.85);
      if (tower.cooldown > 0) continue;
      const stats = getTowerStats(tower);
      const target = findTarget(tower, stats.range);
      if (!target) continue;
      tower.anim = 1;
      tower.targetAngle = Math.atan2(target.y - tower.y, target.x - tower.x);
      tower.cooldown = stats.rate;
      if (stats.attack === "lightning") {
        zapEnemy(tower, target, stats);
      } else {
        fireProjectile(tower, target, stats);
      }
    }
  }

  function findTarget(tower, range) {
    let chosen = null;
    let furthest = -1;
    for (const enemy of state.enemies) {
      if (enemy.dead || enemy.escaped || enemy.phased) continue;
      if (Math.hypot(enemy.x - tower.x, enemy.y - tower.y) > range + 2) continue;
      const progress = GameData.routeProgress(PATH, enemy);
      if (progress > furthest) {
        furthest = progress;
        chosen = enemy;
      }
    }
    return chosen;
  }

  function zapEnemy(tower, target, stats) {
    const chain = [target];
    let last = target;
    for (let i = 0; i < stats.chains - 1; i += 1) {
      const nearby = state.enemies.find(
        (enemy) =>
          !enemy.dead &&
          !enemy.phased &&
          !chain.includes(enemy) &&
          Math.hypot(enemy.x - last.x, enemy.y - last.y) < 72,
      );
      if (!nearby) break;
      chain.push(nearby);
      last = nearby;
    }
    const points = [{ x: tower.x, y: tower.y - 14 }];
    chain.forEach((enemy, index) => {
      points.push({ x: enemy.x, y: enemy.y });
      damageEnemy(enemy, stats.damage * (index === 0 ? 1 : 0.62), true, stats.element);
      enemy.slow = 0.25;
      burst(enemy.x, enemy.y, "#fff375", 7, 95);
    });
    state.effects.push({ type: "lightning", points, life: 0.2, maxLife: 0.2 });
    state.effects.push({
      type: "attackRing",
      x: tower.x,
      y: tower.y,
      life: 0.24,
      maxLife: 0.24,
      color: "#fff278",
    });
    playTone(720 + Math.random() * 120, 0.045, "square", 0.018, "shoot");
  }

  function fireProjectile(tower, target, stats) {
    state.projectiles.push({
      x: tower.x,
      y: tower.y - 10,
      target,
      speed: stats.projectileSpeed,
      damage: stats.damage,
      splash: stats.splash,
      slow: stats.slow,
      style: stats.attack,
      element: stats.element,
      color: stats.color,
      level: tower.level,
      evolutionStage: tower.evolutionStage || 0,
      life: 2,
      trail: 0,
    });
    playTone(230, 0.06, "sine", 0.018, "shoot");
  }

  function updateProjectiles(dt) {
    for (const projectile of state.projectiles) {
      projectile.life -= dt;
      const target = projectile.target;
      if (!target || target.dead || target.escaped) {
        projectile.life = 0;
        continue;
      }
      const dx = target.x - projectile.x;
      const dy = target.y - projectile.y;
      const distance = Math.hypot(dx, dy);
      const move = projectile.speed * dt;
      projectile.trail -= dt;
      if (projectile.trail <= 0) {
        state.particles.push({
          x: projectile.x,
          y: projectile.y,
          vx: (Math.random() - 0.5) * 35,
          vy: (Math.random() - 0.5) * 35,
          life: 0.35,
          maxLife: 0.35,
          size: projectile.style === "star" ? 7 : 6,
          color: projectile.color,
        });
        projectile.trail = 0.035;
      }
      if (distance <= move + target.radius) {
        projectile.life = 0;
        state.shake = Math.max(state.shake, 3);
        burst(target.x, target.y, projectile.color, 18, 145);
        for (const enemy of state.enemies) {
          if (
            !enemy.dead &&
            !enemy.escaped &&
            Math.hypot(enemy.x - target.x, enemy.y - target.y) <= projectile.splash
          ) {
            damageEnemy(enemy, projectile.damage, true, projectile.element);
            enemy.slow = Math.max(enemy.slow, projectile.slow || 0);
          }
        }
        playTone(155, 0.09, "triangle", 0.027, "hit");
      } else {
        projectile.x += (dx / distance) * move;
        projectile.y += (dy / distance) * move;
      }
    }
  }

  function damageEnemy(enemy, amount, chargesPower = true, attackType = "") {
    if (enemy.dead || enemy.escaped || enemy.phased) return;
    let finalAmount = amount;
    const weakness = enemy.boss ? enemy.bossData.weakness : null;
    if (
      enemy.boss &&
      (Array.isArray(weakness) ? weakness.includes(attackType) : weakness === attackType)
    ) {
      finalAmount *= 1.25;
      if (Math.random() < 0.18) addFloat(enemy.x, enemy.y - 42, text("superEffective"), "#fff27a");
    }
    if (enemy.shielded) finalAmount *= DIFFICULTIES[state.difficulty].shieldDamage;
    enemy.health -= finalAmount;
    enemy.hit = 1;
    if (enemy.abilityMode === "heal") {
      enemy.healInterruptDamage += finalAmount;
      if (enemy.healInterruptDamage >= enemy.maxHealth * 0.04) {
        enemy.abilityMode = "interrupted";
        enemy.abilityState = text("bossAbility.interrupted");
        enemy.abilityTime = 0.8;
        addFloat(enemy.x, enemy.y - 44, text("bossAbility.interrupted"), "#fff27a");
      }
    }
    if (enemy.health > 0) return;
    enemy.dead = true;
    state.enemiesCompleted += 1;
    state.combo = state.comboTimer > 0 ? state.combo + 1 : 1;
    state.comboTimer = 2.5;
    const comboBonus = state.combo >= 3 ? Math.min(6, Math.floor(state.combo / 3)) : 0;
    const reward = Math.max(
      5,
      Math.round((9 + Math.floor(state.wave * 0.7)) * (enemy.rewardMultiplier || 1)),
    ) + comboBonus;
    state.coins += reward;
    if (chargesPower) state.power = Math.min(100, state.power + (enemy.boss ? 35 : 11));
    if (enemy.boss) {
      state.bossDefeatedThisWave = true;
      state.bossesKilledThisWave += 1;
      state.bossesDefeated += 1;
      state.finalEvolutionUnlocked = true;
      profile.bossStars += 1;
      saveProfile();
      state.banner = { text: text("bossUnlock", { name: enemy.name }), time: 3.2 };
      burst(enemy.x, enemy.y, "#fff27a", 58, 250);
    }
    addFloat(enemy.x, enemy.y - 18, `+${reward}`, "#ffe86b");
    if (state.combo >= 3) {
      addFloat(enemy.x, enemy.y - 42, text("combo", { count: state.combo }), "#9ff8ff");
    }
    burst(enemy.x, enemy.y, "#b991df", 14, 125);
    playTone(enemy.boss ? 880 : 620, 0.08, "sine", 0.025, enemy.boss ? "powerUp" : "success");
    updateHud();
    saveRunCheckpoint();
  }

  function cleanupEntities() {
    state.enemies = state.enemies.filter((enemy) => !enemy.dead && !enemy.escaped);
    state.projectiles = state.projectiles.filter((projectile) => projectile.life > 0);
    state.effects = state.effects.filter((effect) => effect.life > 0);
    state.particles = state.particles.filter((particle) => particle.life > 0);
    state.floats = state.floats.filter((text) => text.life > 0);
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.pow(0.08, dt);
      particle.vy = particle.vy * Math.pow(0.16, dt) + 24 * dt;
    }
    for (const effect of state.effects) effect.life -= dt;
    for (const text of state.floats) {
      text.life -= dt;
      text.y -= 34 * dt;
    }
  }

  function burst(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.35 + Math.random() * 0.65);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 0.4 + Math.random() * 0.42,
        maxLife: 0.82,
        size: 3 + Math.random() * 6,
        color,
      });
    }
  }

  function addFloat(x, y, text, color) {
    state.floats.push({ x, y, text, color, life: 0.85, maxLife: 0.85 });
  }

  function endGame() {
    state.lives = 0;
    state.running = false;
    state.over = true;
    state.selectedTowerId = null;
    updatePauseUi();
    updateUpgradePanel();
    updatePowerUi();
    updateHud();
    updateWaveUi();
    profile.bestWave = Math.max(profile.bestWave, state.wave);
    saveProfile();
    clearRunCheckpoint();
    finalWave.textContent = String(state.wave);
    gameOverRewards.textContent =
      text("runRewards", { bosses: state.bossesDefeated, discoveries: state.newDiscoveries });
    gameOverPanel.classList.remove("is-hidden");
    playTone(220, 0.28, "sine", 0.045, "gameOver");
  }

  function placeTower(x, y) {
    if (!state.running || state.over || simulationPaused() || !state.buildSelectionActive) return;
    const cell = snapToCell(x, y);
    const type = TOWER_TYPES[selectedTower];
    if (!isInsideField(cell.x, cell.y)) {
      showToast(text("insideGrass"));
      return;
    }
    if (distanceToPath(cell.x, cell.y) < PATH_WIDTH / 2 + 34) {
      rejectPlacement(cell.x, cell.y, text("clearPath"));
      return;
    }
    if (isTerrainBlocked(cell.x, cell.y)) {
      rejectPlacement(cell.x, cell.y, text("blockedTerrain"));
      return;
    }
    const occupied = state.towers.find((tower) => tower.x === cell.x && tower.y === cell.y);
    if (occupied) {
      selectPlacedTower(occupied);
      return;
    }
    if (state.coins < type.cost) {
      rejectPlacement(cell.x, cell.y, text("missingCoins", { coins: type.cost - state.coins }));
      return;
    }
    state.coins -= type.cost;
    const tower = {
      id: nextId++,
      type: selectedTower,
      x: cell.x,
      y: cell.y,
      level: 1,
      skills: { power: 0, range: 0, special: 0 },
      evolutionStage: 0,
      eeveeEvolution: null,
      spentCoins: type.cost,
      cooldown: 0.2,
      anim: 0,
      placed: 1,
      upgradeAnim: 0,
      evolving: 0,
      targetAngle: 0,
      phase: Math.random() * Math.PI * 2,
    };
    state.towers.push(tower);
    loadTowerAssets(tower);
    state.selectedTowerId = tower.id;
    burst(cell.x, cell.y, type.color, 18, 115);
    addFloat(cell.x, cell.y - 36, type.name, "#fff");
    playTone(selectedTower === "pikachu" ? 640 : 390, 0.1, "sine", 0.035);
    updateHud();
    saveRunCheckpoint();
  }

  function selectPlacedTower(tower) {
    state.choosingEvolution = false;
    state.selectedTowerId = tower.id;
    updateSelectedTowerHelper(tower);
    updateUpgradePanel();
    saveRunCheckpoint();
    playTone(480 + tower.level * 80, 0.055, "sine", 0.02);
  }

  function toggleMoveTower() {
    const tower = getSelectedPlacedTower();
    if (!tower || !state.running || state.over || state.paused || state.instructionsOpen) return;
    state.movingTowerId = state.movingTowerId === tower.id ? null : tower.id;
    if (state.movingTowerId) {
      keyboardCursor = { x: tower.x, y: tower.y };
      hoverCell = keyboardCursor;
    }
    state.choosingEvolution = false;
    helperText.textContent = state.movingTowerId
      ? text("moveReady")
      : text("moveCanceled");
    updateUpgradePanel();
  }

  function sellSelectedTower() {
    const tower = getSelectedPlacedTower();
    if (!tower || !state.running || state.over || state.paused || state.instructionsOpen) return;
    const refund = Math.max(1, Math.floor((tower.spentCoins || TOWER_TYPES[tower.type].cost) * 0.65));
    state.coins += refund;
    state.towers = state.towers.filter((candidate) => candidate.id !== tower.id);
    state.selectedTowerId = null;
    state.movingTowerId = null;
    burst(tower.x, tower.y, "#ffe66c", 22, 150);
    addFloat(tower.x, tower.y - 35, `+${refund}`, "#ffe66c");
    showToast(text("sold", { coins: refund }));
    playTone(760, 0.08, "sine", 0.025, "success");
    updateHud();
    saveRunCheckpoint();
  }

  function tryMoveTower(x, y) {
    const tower = state.towers.find((candidate) => candidate.id === state.movingTowerId);
    if (!tower) {
      state.movingTowerId = null;
      return;
    }
    const cell = snapToCell(x, y);
    const occupied = state.towers.some(
      (candidate) => candidate.id !== tower.id && candidate.x === cell.x && candidate.y === cell.y,
    );
    if (
      !isInsideField(cell.x, cell.y) ||
      distanceToPath(cell.x, cell.y) < PATH_WIDTH / 2 + 34 ||
      isTerrainBlocked(cell.x, cell.y) ||
      occupied
    ) {
      rejectPlacement(cell.x, cell.y, text("emptyGrass"));
      return;
    }
    tower.x = cell.x;
    tower.y = cell.y;
    tower.placed = 1;
    state.movingTowerId = null;
    burst(cell.x, cell.y, TOWER_TYPES[tower.type].color, 20, 125);
    showToast(text("moved"));
    updateSelectedTowerHelper(tower);
    updateUpgradePanel();
    saveRunCheckpoint();
  }

  function handleFieldTap(x, y, byKeyboard = false) {
    if (!state.running || state.over || simulationPaused()) return;
    if (state.movingTowerId) {
      tryMoveTower(x, y);
      return;
    }
    // Keyboard actions target the exact grid cell, not a neighboring portrait's
    // generous finger hit area. Pointer body selection keeps that larger target.
    const tappedTower = byKeyboard
      ? state.towers.find((tower) => tower.x === x && tower.y === y)
      : hitTower(x, y);
    if (tappedTower) {
      selectPlacedTower(tappedTower);
      return;
    }
    if (state.selectedTowerId !== null) {
      state.selectedTowerId = null;
      hoverCell = null;
      updateUpgradePanel();
      helperText.textContent = text("inspectionClosed");
      return; // Dismiss inspection only; this tap must never buy another defender.
    }
    placeTower(x, y);
  }

  function towerSpriteBounds(tower) {
    const size = 128 + (tower.evolutionStage || 0) * 8;
    return { x: tower.x - size / 2, y: tower.y - size + 24, width: size, height: size };
  }

  function hitTower(x, y) {
    const padding = Math.min(18, 8 * WIDTH / canvas.clientWidth / state.camera.zoom);
    return [...state.towers].sort((a, b) => b.y - a.y).find((tower) => {
      const bounds = towerSpriteBounds(tower);
      return x >= bounds.x - padding && x <= bounds.x + bounds.width + padding &&
        y >= bounds.y - padding && y <= bounds.y + bounds.height + padding;
    });
  }

  function drawHoldProgress() {
    if (!pointerDrag?.towerId || pointerDrag.lifted || pointerDrag.holdCanceled) return;
    const tower = state.towers.find((candidate) => candidate.id === pointerDrag.towerId);
    if (!tower) return;
    const progress = Math.min(1, (performance.now() - pointerDrag.holdStarted) / 480);
    ctx.save();
    ctx.strokeStyle = "#173c4be0"; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(tower.x, tower.y, 44, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "#a6f1de"; ctx.lineWidth = 6; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(tower.x, tower.y, 44, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress); ctx.stroke();
    ctx.restore();
  }

  function rejectPlacement(x, y, message) {
    state.effects.push({ type: "reject", x, y, life: 0.38, maxLife: 0.38 });
    showToast(message);
    playTone(145, 0.07, "square", 0.018);
  }

  function snapToCell(x, y) {
    return {
      x: Math.floor(x / GRID) * GRID + GRID / 2,
      y: Math.floor(y / GRID) * GRID + GRID / 2,
    };
  }

  function isInsideField(x, y) {
    return x >= 40 && x <= WIDTH - 40 && y >= activeMap.buildTop && y <= HEIGHT - 40;
  }

  function isTerrainBlocked(x, y) {
    return TERRAIN_BLOCKERS.some((area) => {
      const dx = (x - area.x) / (area.rx + 36);
      const dy = (y - area.y) / (area.ry + 36);
      return dx * dx + dy * dy < 1;
    });
  }

  function distanceToPath(x, y) {
    return GameData.routeDistance(PATH, x, y);
  }

  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.round(canvas.clientWidth * dpr);
    const targetHeight = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }
    ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.direction = locale === "he" ? "rtl" : "ltr";

    const shakeX = !reducedMotion && state.shake ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = !reducedMotion && state.shake ? (Math.random() - 0.5) * state.shake : 0;
    ctx.save();
    ctx.scale(state.camera.zoom, state.camera.zoom);
    ctx.translate(-state.camera.x + shakeX, -state.camera.y + shakeY);
    ctx.drawImage(window.PokemonTDLandscape.get(activeMap, state.mapId), 0, 0);
    drawPlacementPreview();
    drawTowers();
    drawHoldProgress();
    drawEnemies();
    drawProjectiles();
    drawEffects();
    ctx.restore();
    drawBanner();
    drawCombo();
  }

  function drawPlacementPreview() {
    if (!state.running || state.over) return;
    const selected = getSelectedPlacedTower();
    if (selected) {
      const stats = getTowerStats(selected);
      const pulse = reducedMotion ? 0.55 : 0.5 + Math.sin(state.elapsed * 3.5) * 0.08;
      ctx.save();
      ctx.fillStyle = `rgba(83, 174, 255, ${pulse * 0.2})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulse + 0.3})`;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 7]);
      ctx.lineDashOffset = reducedMotion ? 0 : -state.elapsed * 18;
      ctx.beginPath();
      ctx.arc(selected.x, selected.y, stats.range, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(72, 151, 244, 0.28)";
      ctx.beginPath();
      ctx.arc(selected.x, selected.y, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (!hoverCell) return;
    const moving = state.towers.find((tower) => tower.id === state.movingTowerId);
    if (selected && !moving) return; // Inspection previews upgrades, not another purchase.
    if (!moving && !state.buildSelectionActive) return;
    const type = moving ? getTowerStats(moving) : TOWER_TYPES[selectedTower];
    if (!moving && state.towers.some((tower) => tower.x === hoverCell.x && tower.y === hoverCell.y)) {
      return;
    }
    const valid =
      isInsideField(hoverCell.x, hoverCell.y) &&
      distanceToPath(hoverCell.x, hoverCell.y) >= PATH_WIDTH / 2 + 34 &&
      !isTerrainBlocked(hoverCell.x, hoverCell.y) &&
      !state.towers.some((tower) => tower.id !== moving?.id && tower.x === hoverCell.x && tower.y === hoverCell.y) &&
      (moving || state.coins >= type.cost);
    ctx.save();
    ctx.fillStyle = valid ? "rgba(100, 235, 121, 0.25)" : "rgba(255, 80, 80, 0.24)";
    ctx.strokeStyle = valid ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 220, 220, 0.9)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(hoverCell.x, hoverCell.y, type.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = valid ? "rgba(255,255,255,.25)" : "rgba(255,80,80,.28)";
    roundRect(ctx, hoverCell.x - 34, hoverCell.y - 34, 68, 68, 14);
    ctx.fill();
    if (moving) {
      ctx.globalAlpha = 0.9;
      const image = getTowerImage(moving);
      if (image) {
        const size = towerSpriteBounds(moving).width;
        ctx.shadowColor = valid ? "#a6f1de" : "#ff7a8b";
        ctx.shadowBlur = 14;
        drawContainedImage(image, hoverCell.x - size / 2, hoverCell.y - size + 6, size, size);
      }
      else {
        ctx.translate(hoverCell.x, hoverCell.y - 15);
        drawFallbackPokemon(moving.type, type.color);
      }
    }
    ctx.restore();
  }

  function drawTowers() {
    // Depth order and hit testing agree when adjacent artwork overlaps.
    for (const tower of [...state.towers].sort((a, b) => a.y - b.y)) {
      const evolutionStage = tower.evolutionStage || 0;
      const bob = reducedMotion ? 0 : Math.sin(state.elapsed * 3 + tower.phase) * 2.5;
      const squash = !reducedMotion && tower.anim ? 1 + tower.anim * 0.16 : 1;
      const placementProgress = 1 - tower.placed;
      const placementScale =
        !reducedMotion && tower.placed > 0
          ? placementProgress + Math.sin(placementProgress * Math.PI) * 0.38
          : 1;
      const upgradeScale = reducedMotion ? 1 : 1 + Math.sin(tower.upgradeAnim * Math.PI * 4) * tower.upgradeAnim * 0.12;
      const evolutionScale =
        reducedMotion ? 1 : 1 + Math.sin((1 - tower.evolving) * Math.PI * 7) * tower.evolving * 0.16;
      const image = getTowerImage(tower);
      ctx.save();
      ctx.translate(tower.x, tower.y + bob);
      if (state.movingTowerId === tower.id) {
        ctx.globalAlpha = pointerDrag?.lifted ? 0.3 : 0.7;
        ctx.strokeStyle = "#fff176";
        ctx.lineWidth = 6;
        ctx.setLineDash([12, 6]);
        ctx.lineDashOffset = reducedMotion ? 0 : -performance.now() / 35;
        ctx.beginPath();
        ctx.ellipse(0, 15, 48, 24, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.translate(0, -18 - (reducedMotion ? 0 : Math.sin(performance.now() / 160) * 5));
        ctx.scale(1.12, 1.12);
      }
      if (!reducedMotion && tower.anim > 0) {
        ctx.translate(
          Math.cos(tower.targetAngle) * tower.anim * 8,
          Math.sin(tower.targetAngle) * tower.anim * 5,
        );
      }
      ctx.scale(
        placementScale * upgradeScale * evolutionScale,
        placementScale * upgradeScale * evolutionScale,
      );
      if (tower.evolving > 0) {
        const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 72);
        glow.addColorStop(0, `rgba(255, 255, 220, ${tower.evolving * 0.72})`);
        glow.addColorStop(1, "rgba(255, 244, 120, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, 72, 0, Math.PI * 2);
        ctx.fill();
      }
      if (evolutionStage === 2) {
        const masteryGlow = ctx.createRadialGradient(0, 0, 12, 0, 0, 64);
        masteryGlow.addColorStop(0, "rgba(255, 246, 142, .32)");
        masteryGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = masteryGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 64 + Math.sin(state.elapsed * 4 + tower.phase) * 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(20, 68, 46, 0.26)";
      ctx.beginPath();
      ctx.ellipse(0, 26, 28, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = tower.type === "pikachu" ? "rgba(255, 231, 83, .22)" : "rgba(255, 128, 61, .22)";
      ctx.beginPath();
      ctx.arc(0, 0, 36 + Math.sin(state.elapsed * 2 + tower.phase) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.scale(
        Math.cos(tower.targetAngle) < 0 ? -squash : squash,
        1 / squash,
      );
      if (image) {
        const bounds = towerSpriteBounds(tower);
        drawContainedImage(image, bounds.x - tower.x, bounds.y - tower.y, bounds.width, bounds.height);
      } else {
        const species = evolutionStage ? getEvolutionPath(tower)[evolutionStage - 1].image.replace("Animated", "") : tower.type;
        drawFallbackPokemon(species, getTowerStats(tower).color);
      }
      ctx.restore();
      ctx.textAlign = "center";
      ctx.font = "900 16px Trebuchet MS, sans-serif";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(25, 66, 52, .72)";
      ctx.fillStyle = "#fff176";
      const stars = tower.level > 5 ? `★★★★★ ${tower.level}` : "★".repeat(tower.level);
      ctx.strokeText(stars, 0, 44);
      ctx.fillText(stars, 0, 44);
      if ((tower.durability ?? 3) < 3) {
        ctx.fillStyle = "#ffb8a5";
        ctx.fillText("🛡".repeat(tower.durability), 0, 48);
      }
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const enemy of state.enemies) {
      if (enemy.strike && !enemy.dead && !enemy.escaped) {
        const strike = enemy.strike;
        ctx.save();
        ctx.strokeStyle = "#ff382e";
        ctx.fillStyle = "rgba(255, 70, 40, .2)";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(strike.x, strike.y, 65, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#fff6b7";
        ctx.beginPath();
        ctx.arc(strike.x, strike.y, 72, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * strike.time / strike.duration);
        ctx.stroke();
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fff";
        ctx.fillText("!", strike.x, strike.y - 80);
        ctx.restore();
      }
      const image = images[enemy.image];
      const bob = reducedMotion ? 0 : Math.sin(state.elapsed * 7 + enemy.bob) * 2;
      const next = PATH[enemy.segment + 1] || PATH[enemy.segment];
      const lean = next ? Math.max(-0.22, Math.min(0.22, (next.x - enemy.x) / 350)) : 0;
      ctx.save();
      ctx.translate(enemy.x, enemy.y + bob);
      if (!reducedMotion && enemy.spawnAnim > 0) {
        const entrance = 1 - enemy.spawnAnim;
        const entranceScale = Math.max(0.15, entrance + Math.sin(entrance * Math.PI) * 0.35);
        ctx.scale(entranceScale, entranceScale);
      }
      if (enemy.phased) ctx.globalAlpha = 0.3;
      if (!reducedMotion && enemy.hit > 0) {
        ctx.translate(Math.sin(enemy.hit * 42) * enemy.hit * 5, 0);
        ctx.scale(1 + enemy.hit * 0.08, 1 - enemy.hit * 0.06);
      }
      if (!reducedMotion) ctx.rotate(lean);
      if (enemy.modifier === "fast") {
        ctx.strokeStyle = "rgba(134, 235, 255, .5)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-enemy.radius * 1.8, -8);
        ctx.lineTo(-enemy.radius * 3.1, -8);
        ctx.moveTo(-enemy.radius * 1.5, 8);
        ctx.lineTo(-enemy.radius * 2.6, 8);
        ctx.stroke();
      }
      if (enemy.modifier === "armored") {
        ctx.strokeStyle = "rgba(210, 226, 232, .8)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 1.48, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (enemy.boss) {
        const bossGlow = ctx.createRadialGradient(0, 0, 8, 0, 0, enemy.radius * 2.6);
        bossGlow.addColorStop(0, "rgba(255, 226, 84, .34)");
        bossGlow.addColorStop(1, "rgba(255, 125, 54, 0)");
        ctx.fillStyle = bossGlow;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (enemy.shielded) {
        ctx.strokeStyle = "rgba(225, 242, 255, .92)";
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * 1.55, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (enemy.slow > 0) {
        ctx.fillStyle = "#9cf5ff";
        ctx.strokeStyle = "rgba(30, 78, 104, .75)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(enemy.radius * 0.9, -enemy.radius * 0.95, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(55, 39, 75, 0.18)";
      ctx.beginPath();
      ctx.ellipse(0, -bob, 25, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (enemy.hit > 0) {
        ctx.globalAlpha = reducedMotion ? 0.85 : 0.68 + Math.sin(enemy.hit * 30) * 0.26;
      }
      if (image) {
        const spriteSize = Math.max(70, enemy.radius * 3.25);
        drawContainedImage(image, -spriteSize / 2, -spriteSize * 0.88, spriteSize, spriteSize);
      } else {
        if (enemy.boss) {
          ctx.fillStyle = enemy.bossData.color;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#25313a";
          ctx.beginPath();
          ctx.arc(-12, -6, 5, 0, Math.PI * 2);
          ctx.arc(12, -6, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.save();
          ctx.scale(enemy.radius / 24, enemy.radius / 24);
          drawFallbackPokemon(enemy.image.replace("Animated", ""));
          ctx.restore();
          ctx.font = "900 14px Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.fillStyle = "#fff8df";
          ctx.fillText(enemy.name, 0, enemy.radius + 20);
        }
      }
      ctx.globalAlpha = 1;
      drawHealthBar(enemy);
      if (enemy.boss) {
        ctx.fillStyle = "#ffe45c";
        ctx.strokeStyle = "#8e5517";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-17, -enemy.radius - 25);
        ctx.lineTo(-11, -enemy.radius - 41);
        ctx.lineTo(0, -enemy.radius - 29);
        ctx.lineTo(11, -enemy.radius - 41);
        ctx.lineTo(17, -enemy.radius - 25);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (enemy.abilityState) {
          ctx.font = "900 16px Arial, sans-serif";
          ctx.textAlign = "center";
          ctx.lineWidth = 5;
          ctx.strokeStyle = "rgba(42, 20, 48, .86)";
          ctx.fillStyle = "#fff6a8";
          ctx.strokeText(enemy.abilityState, 0, -enemy.radius - 48);
          ctx.fillText(enemy.abilityState, 0, -enemy.radius - 48);
        }
      }
      ctx.restore();
    }
  }

  function drawContainedImage(image, x, y, width, height) {
    const ratio = Math.min(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * ratio;
    const drawHeight = image.naturalHeight * ratio;
    ctx.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function drawFallbackPokemon(type, color) {
    if (type === "zubat") {
      ctx.fillStyle = "#7861ad";
      ctx.beginPath();
      ctx.ellipse(0, 0, 19, 25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-12, -5);
      ctx.lineTo(-42, -22);
      ctx.lineTo(-34, 8);
      ctx.lineTo(-48, 23);
      ctx.lineTo(-10, 14);
      ctx.fill();
      ctx.save();
      ctx.scale(-1, 1);
      ctx.beginPath();
      ctx.moveTo(-12, -5);
      ctx.lineTo(-42, -22);
      ctx.lineTo(-34, 8);
      ctx.lineTo(-48, 23);
      ctx.lineTo(-10, 14);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ef7fa6";
      ctx.beginPath();
      ctx.ellipse(0, 9, 11, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.fillStyle = color || TOWER_TYPES[type]?.color || `hsl(${(GameData.POKEMON[type].dex * 137) % 360} 60% 65%)`;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(-8, -5, 3, 0, Math.PI * 2);
    ctx.arc(8, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5f381c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 3, 7, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  function drawHealthBar(enemy) {
    if (enemy.health >= enemy.maxHealth) return;
    const width = enemy.boss ? Math.max(90, enemy.radius * 1.6) : 52;
    const y = enemy.boss ? -enemy.radius * 1.7 : -48;
    ctx.fillStyle = "rgba(30, 42, 44, .72)";
    roundRect(ctx, -width / 2 - 2, y, width + 4, 10, 5);
    ctx.fill();
    ctx.fillStyle = enemy.health / enemy.maxHealth > 0.45 ? "#66dc69" : "#ff705f";
    roundRect(ctx, -width / 2, y + 2, Math.max(0, width * (enemy.health / enemy.maxHealth)), 6, 3);
    ctx.fill();
  }

  function drawProjectiles() {
    for (const projectile of state.projectiles) {
      const size = 18 + projectile.level * 3;
      const glow = ctx.createRadialGradient(
        projectile.x,
        projectile.y,
        0,
        projectile.x,
        projectile.y,
        size,
      );
      glow.addColorStop(0, "#fff");
      glow.addColorStop(0.34, projectile.color);
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(projectile.x, projectile.y);
      ctx.fillStyle = projectile.style === "water" ? "#d9f8ff" : "#fff5a1";
      ctx.strokeStyle = projectile.color;
      ctx.lineWidth = 3;
      if (projectile.style === "seed") {
        ctx.rotate(state.elapsed * 8);
        ctx.beginPath();
        ctx.ellipse(0, 0, 6 + projectile.level, 10 + projectile.level, 0, 0, Math.PI * 2);
      } else if (projectile.style === "star") {
        ctx.rotate(state.elapsed * 9);
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const angle = -Math.PI / 2 + (i * Math.PI) / 5;
          const radius = i % 2 === 0 ? 10 + projectile.level : 4 + projectile.level;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, 5 + projectile.level, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEffects() {
    for (const effect of state.effects) {
      const progress = effect.life / effect.maxLife;
      if (effect.type === "lightning") {
        ctx.save();
        ctx.globalAlpha = progress;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let pass = 0; pass < 2; pass += 1) {
          ctx.beginPath();
          effect.points.forEach((point, index) => {
            if (index === 0) {
              ctx.moveTo(point.x, point.y);
              return;
            }
            const previous = effect.points[index - 1];
            for (let step = 1; step <= 5; step += 1) {
              const t = step / 5;
              const jitter = step === 5 ? 0 : (Math.random() - 0.5) * 17;
              ctx.lineTo(
                previous.x + (point.x - previous.x) * t + jitter,
                previous.y + (point.y - previous.y) * t + jitter,
              );
            }
          });
          ctx.strokeStyle = pass === 0 ? "#fff06b" : "#fff";
          ctx.lineWidth = pass === 0 ? 9 : 3;
          ctx.stroke();
        }
        ctx.restore();
      } else if (effect.type === "pokePower") {
        const outward = 1 - progress;
        ctx.save();
        ctx.globalAlpha = progress * 0.32;
        ctx.fillStyle = "#fff8a8";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.globalAlpha = progress;
        for (let ring = 0; ring < 3; ring += 1) {
          ctx.strokeStyle = ["#fff", "#ffe45d", "#7ee8ff"][ring];
          ctx.lineWidth = 18 - ring * 4;
          ctx.beginPath();
          ctx.arc(
            effect.x,
            effect.y,
            Math.max(1, 80 + outward * (WIDTH * 0.72) - ring * 48),
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
        ctx.restore();
      } else if (
        effect.type === "attackRing" ||
        effect.type === "upgrade" ||
        effect.type === "evolution"
      ) {
        const outward = 1 - progress;
        const radius =
          effect.type === "evolution"
            ? 28 + outward * (effect.maxTier ? 220 : 150)
            : effect.type === "upgrade"
              ? 38 + outward * 82
              : 24 + outward * 44;
        ctx.save();
        ctx.globalAlpha = progress;
        ctx.strokeStyle = effect.color;
        ctx.lineWidth =
          effect.type === "evolution"
            ? 12 * progress + 3
            : effect.type === "upgrade"
              ? 8 * progress + 2
              : 5 * progress + 1;
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (effect.type === "upgrade" || effect.type === "evolution") {
          ctx.fillStyle = "#fff8a8";
          const sparkleCount = effect.type === "evolution" ? 14 : 8;
          for (let i = 0; i < sparkleCount; i += 1) {
            const angle = (i / sparkleCount) * Math.PI * 2;
            const distance =
              effect.type === "evolution" ? 32 + outward * 145 : 34 + outward * 74;
            ctx.save();
            ctx.translate(effect.x + Math.cos(angle) * distance, effect.y + Math.sin(angle) * distance);
            ctx.rotate(angle + outward * Math.PI);
            ctx.fillRect(-4, -4, 8, 8);
            ctx.restore();
          }
          if (effect.maxTier) {
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 5 * progress + 2;
            ctx.beginPath();
            ctx.arc(effect.x, effect.y, Math.max(1, 70 + outward * 240), 0, Math.PI * 2);
            ctx.stroke();
          }
        }
        ctx.restore();
      } else if (effect.type === "reject") {
        ctx.save();
        ctx.globalAlpha = progress;
        ctx.strokeStyle = "#ff5858";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(effect.x - 20, effect.y - 20);
        ctx.lineTo(effect.x + 20, effect.y + 20);
        ctx.moveTo(effect.x + 20, effect.y - 20);
        ctx.lineTo(effect.x - 20, effect.y + 20);
        ctx.stroke();
        ctx.restore();
      }
    }
    for (const particle of state.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.life * 8);
      ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      ctx.restore();
    }
    for (const text of state.floats) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, text.life / text.maxLife);
      ctx.font = "900 22px Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(28, 62, 50, .7)";
      ctx.strokeText(text.text, text.x, text.y);
      ctx.fillStyle = text.color;
      ctx.fillText(text.text, text.x, text.y);
      ctx.restore();
    }
  }

  function drawBanner() {
    if (state.banner.time <= 0) return;
    const alpha = Math.min(1, state.banner.time * 2);
    const scale = 1 + Math.max(0, state.banner.time - 1.7) * 0.08;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(WIDTH / 2, HEIGHT * 0.158);
    ctx.scale(scale * HEIGHT / 900, scale * HEIGHT / 900);
    ctx.font = "900 34px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 9;
    ctx.strokeStyle = "rgba(24, 83, 55, .75)";
    ctx.strokeText(state.banner.text, 0, 0);
    ctx.fillStyle = "#fff9d2";
    ctx.fillText(state.banner.text, 0, 0);
    ctx.restore();
  }

  function drawCombo() {
    if (state.combo < 2 || state.comboTimer <= 0) return;
    const pulse = 1 + Math.sin(state.elapsed * 10) * 0.06;
    ctx.save();
    ctx.translate(WIDTH / 2, HEIGHT * 0.958);
    ctx.scale(pulse * HEIGHT / 900, pulse * HEIGHT / 900);
    ctx.textAlign = "center";
    ctx.font = `900 ${28 + Math.min(16, state.combo * 1.5)}px Arial, sans-serif`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(27, 67, 61, .78)";
    ctx.fillStyle = state.combo >= 6 ? "#fff06b" : "#9ff8ff";
    const comboText = text("combo", { count: state.combo });
    ctx.strokeText(comboText, 0, 0);
    ctx.fillText(comboText, 0, 0);
    ctx.restore();
  }

  function roundRect(context, x, y, width, height, radius) {
    const safeWidth = Math.max(0, width);
    const safeHeight = Math.max(0, height);
    const r = Math.min(radius, safeWidth / 2, safeHeight / 2);
    context.beginPath();
    context.roundRect(x, y, safeWidth, safeHeight, r);
  }

  function updateHud() {
    setHudValue(coinValue, state.coins);
    setHudValue(waveValue, Math.max(1, state.waveLabel));
    setHudValue(lifeValue, Math.max(0, state.lives));
    for (const [element, key] of [[coinValue, "uiCoins"], [lifeValue, "uiLives"], [waveValue, "uiWave"]]) {
      const label = `${text(key)}: ${element.textContent}`;
      element.closest(".stat").setAttribute("aria-label", label);
      element.closest(".stat").title = label;
    }
    updateUpgradePanel();
    updatePowerUi();
  }

  function setHudValue(element, value) {
    const text = String(value);
    if (element.textContent === text) return;
    element.textContent = text;
    const stat = element.closest(".stat");
    stat.classList.remove("is-bumping");
    void stat.offsetWidth;
    stat.classList.add("is-bumping");
  }

  function updateWaveUi() {
    if (!state) return;
    const nextWave = state.wave + 1;
    const previewBoss =
      !state.waveActive && nextWave % 5 === 0
        ? state.nextBoss
        : null;
    const type = state.waveActive
      ? state.isBossWave
        ? state.currentBoss
        : state.currentEnemyType
      : previewBoss || getEnemyForWave(state.nextEnemyFamily, nextWave);
    const modifier = state.waveActive
      ? state.waveModifier
      : WAVE_MODIFIERS[state.wave % WAVE_MODIFIERS.length];
    const iconUrl = assetUrls[type.image];
    if (waveEnemyIcon.src !== iconUrl) waveEnemyIcon.src = iconUrl;
    const activeBoss = state.enemies.find((enemy) => enemy.boss && !enemy.dead && !enemy.escaped);
    const activeBosses = state.enemies.filter((enemy) => enemy.boss && !enemy.dead && !enemy.escaped);
    canvas.dataset.bossCount = String(activeBosses.length);
    canvas.dataset.threatCount = String(activeBosses.filter((enemy) => enemy.strike).length);
    canvas.dataset.towerCount = String(state.towers.length);
    bossHealth.hidden = !activeBoss;
    if (activeBoss) {
      const healthPercent = Math.max(0, activeBosses.reduce((sum, enemy) => sum + enemy.health, 0) /
        activeBosses.reduce((sum, enemy) => sum + enemy.maxHealth, 0) * 100);
      bossHealthName.textContent = `${text("bossSquad", { count: activeBosses.length })} · ${text("bossHealthName", { name: activeBoss.name, types: activeBoss.bossData.weaknessLabel })}`;
      bossHealthStatus.textContent = activeBoss.abilityState
        ? activeBoss.abilityState
        : text("abilityCountdown", { seconds: Math.max(1, Math.ceil(activeBoss.abilityTimer)) });
      bossHealthFill.style.width = `${healthPercent}%`;
    }
    if (state.waveActive) {
      // The wave chip owns the numeric wave count; this row previews the enemy.
      waveEnemyName.textContent = state.isBossWave
        ? `${type.name} · ${text("bossSquad", { count: state.enemiesToSpawn })}`
        : `${type.name} · ${modifier.icon} ${modifier.name}`;
      waveStatus.textContent = state.isBossWave
        ? text("weakness", { types: type.weaknessLabel, mechanic: type.mechanic })
        : text("waveProgress", { completed: state.enemiesCompleted, total: state.enemiesToSpawn, composition: waveComposition(state.wavePlan) });
      const progress = activeBoss
        ? (1 - activeBoss.health / activeBoss.maxHealth) * 100
        : state.enemiesToSpawn
          ? (state.enemiesCompleted / state.enemiesToSpawn) * 100
          : 0;
      waveProgressFill.style.width = `${Math.min(100, progress)}%`;
      startWaveButton.hidden = true;
    } else {
      waveEnemyName.textContent = previewBoss
        ? text("nextBoss", { name: type.name })
        : text("nextWave", { name: type.name, modifier: `${modifier.icon} ${modifier.name}` });
      waveStatus.textContent = state.running
        ? previewBoss
          ? text("weakness", { types: type.weaknessLabel, mechanic: type.mechanic })
          : text("waveCountdown", { seconds: Math.max(1, Math.ceil(state.waveTimer)), composition: waveComposition(state.nextWavePlan) })
        : text("preparing");
      waveProgressFill.style.width = "0%";
      const canStartEarly = state.running && !state.over && state.wave > 0 && state.waveTimer > 0;
      startWaveButton.hidden = !canStartEarly;
      if (canStartEarly) {
        earlyWaveBonus.textContent = text("earlyBonus", { coins: Math.max(2, Math.ceil(state.waveTimer) * 2) });
      }
    }
  }

  function startWaveEarly() {
    if (!state.running || simulationPaused() || state.waveActive || state.wave <= 0 || state.waveTimer <= 0) return;
    const bonus = Math.max(2, Math.ceil(state.waveTimer) * 2);
    state.coins += bonus;
    state.waveTimer = 0;
    state.banner = { text: text("earlyWave", { coins: bonus }), time: 2 };
    playTone(620, 0.08, "sine", 0.035);
    updateHud();
    updateWaveUi();
  }

  function updateSpeedUi() {
    speedButton.textContent = `${state.gameSpeed}×`;
    speedButton.setAttribute("aria-pressed", String(state.gameSpeed === 2));
    speedButton.setAttribute(
      "aria-label",
      text(state.gameSpeed === 1 ? "doubleSpeedLabel" : "normalSpeedLabel"),
    );
  }

  function toggleGameSpeed() {
    state.gameSpeed = state.gameSpeed === 1 ? 2 : 1;
    profile.gameSpeed = state.gameSpeed;
    saveProfile();
    updateSpeedUi();
    showToast(text(state.gameSpeed === 2 ? "doubleSpeed" : "normalSpeed"));
    playTone(state.gameSpeed === 2 ? 720 : 480, 0.07, "sine", 0.025);
  }

  function updatePowerUi() {
    const ready = state.power >= 100 && state.running && !simulationPaused() && state.enemies.length > 0;
    powerButton.style.setProperty("--charge", `${state.power}%`);
    powerLabel.textContent = ready ? text("powerReady") : `${Math.round(state.power)}%`;
    powerButton.disabled = !ready;
    powerButton.classList.toggle("is-ready", ready);
    powerButton.setAttribute(
      "aria-label",
      ready ? text("activatePower") : text("powerCharge", { percent: Math.round(state.power) }),
    );
  }

  function usePokePower() {
    if (state.power < 100 || !state.running || simulationPaused() || state.enemies.length === 0) return;
    state.power = 0;
    state.combo = Math.max(2, state.combo);
    state.comboTimer = 3;
    state.shake = 13;
    state.banner = { text: text("pokePower"), time: 2.2 };
    state.effects.push({
      type: "pokePower",
      x: WIDTH / 2,
      y: HEIGHT / 2,
      life: 1.1,
      maxLife: 1.1,
      color: "#fff273",
    });
    for (const enemy of [...state.enemies]) {
      enemy.slow = Math.max(enemy.slow, 3.2);
      enemy.hit = 1;
      burst(enemy.x, enemy.y, "#fff273", enemy.boss ? 28 : 14, 190);
      damageEnemy(enemy, 31 + enemy.maxHealth * 0.36, false);
    }
    playTone(550, 0.25, "triangle", 0.055, "powerUp");
    updateHud();
  }

  function showToast(message, duration = 2100) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), duration);
  }

  function selectTower(type) {
    cancelPointerGesture();
    selectedTower = type;
    state.buildSelectionActive = true;
    state.selectedTowerId = null;
    state.movingTowerId = null;
    updateUpgradePanel();
    towerButtons.forEach((button) => {
      const selected = button.dataset.tower === type;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    updateSelectedTowerCard();
    renderTowerShop(activeShopFilter);
    saveRunCheckpoint();
    helperText.textContent = text("selected", { name: TOWER_TYPES[type].name });
    loadImage(`${type}Animated`, assetUrls[`${type}Animated`]);
    ensureAudio();
    playTone(type === "pikachu" ? 620 : 360, 0.06, "sine", 0.025);
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return GameData.screenToWorld({
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    }, state.camera);
  }

  function simulationPaused() {
    return state.paused || state.instructionsOpen || state.tutorialActive ||
      state.choosingEvolution || !towerShop.hidden || document.hidden;
  }

  function updatePauseUi() {
    pausePanel.hidden = !state.paused;
    pauseButton.disabled = !state.running || state.over;
    pauseButton.innerHTML = state.paused
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" fill="currentColor"/></svg>'
      : iconMarkup("pause");
    pauseButton.setAttribute("aria-label", text(state.paused ? "resume" : "pause"));
    pauseButton.setAttribute("aria-pressed", String(state.paused));
    updateUpgradePanel();
    updatePowerUi();
  }

  function togglePause() {
    if (!state.running || state.over) return;
    cancelPointerGesture();
    state.movingTowerId = null;
    state.paused = !state.paused;
    lastTime = performance.now();
    updatePauseUi();
  }

  function updateCameraUi() {
    canvas.dataset.zoom = String(state.camera.zoom);
    canvas.dataset.cameraX = String(Math.round(state.camera.x));
    canvas.dataset.cameraY = String(Math.round(state.camera.y));
  }

  function changeZoom(zoom) {
    const camera = state.camera;
    const center = { x: camera.x + WIDTH / camera.zoom / 2, y: camera.y + HEIGHT / camera.zoom / 2 };
    const next = Math.max(1, Math.min(3, zoom));
    state.camera = GameData.clampCamera({
      zoom: next, x: center.x - WIDTH / next / 2, y: center.y - HEIGHT / next / 2,
    }, activeMap);
    hoverCell = null;
    updateCameraUi();
    saveRunCheckpoint();
  }

  function movePlacementCursor(direction) {
    if (!state.running || state.over || simulationPaused()) return;
    const directions = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
    const [dx, dy] = directions[direction];
    keyboardCursor = snapToCell(
      Math.max(GRID / 2, Math.min(WIDTH - GRID / 2, keyboardCursor.x + dx * GRID)),
      Math.max(activeMap.buildTop + GRID / 2, Math.min(HEIGHT - GRID / 2, keyboardCursor.y + dy * GRID)),
    );
    hoverCell = keyboardCursor;
    const camera = state.camera;
    const viewWidth = WIDTH / camera.zoom;
    const viewHeight = HEIGHT / camera.zoom;
    state.camera = GameData.clampCamera({
      ...camera,
      x: Math.min(Math.max(camera.x, keyboardCursor.x + GRID - viewWidth), keyboardCursor.x - GRID),
      y: Math.min(Math.max(camera.y, keyboardCursor.y + GRID - viewHeight), keyboardCursor.y - GRID),
    }, activeMap);
    updateCameraUi();
    canvas.focus({ preventScroll: true });
  }

  function handleKeyboard(event) {
    const activeDialog = [towerShop, eeveeEvolutionChoices, tutorialPanel, pausePanel, startPanel, gameOverPanel]
      .find((panel) => !panel.hidden && !panel.classList.contains("is-hidden"));
    if (event.key === "Tab" && activeDialog) {
      const buttons = [...activeDialog.querySelectorAll("button:not(:disabled)")];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!first) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!activeDialog.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      const wasMoving = Boolean(state.movingTowerId || pointerDrag?.towerId);
      cancelPointerGesture();
      if (!towerShop.hidden) {
        towerShop.hidden = true;
        updatePowerUi();
        openShopButton.focus({ preventScroll: true });
      } else if (state.choosingEvolution) {
        state.choosingEvolution = false;
        updateUpgradePanel();
      } else if (state.movingTowerId) {
        toggleMoveTower();
      } else if (wasMoving) {
        showToast(text("moveCanceled"));
      } else {
        togglePause();
      }
      return;
    }
    if (event.target !== canvas) return;
    const keys = {
      ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right",
      ArrowUp: "up", w: "up", ArrowDown: "down", s: "down",
    };
    const direction = keys[event.key] || keys[event.key.toLowerCase()];
    if (direction) {
      event.preventDefault();
      movePlacementCursor(direction);
    } else if (event.key.toLowerCase() === "m" && !simulationPaused()) {
      event.preventDefault();
      toggleMoveTower();
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      handleFieldTap(keyboardCursor.x, keyboardCursor.y, true);
    }
  }

  function isSoundEnabled() {
    return soundEnabled && !portalSoundMuted;
  }

  function ensureAudio() {
    if (window.parent !== window) return;
    if (!isSoundEnabled() || audioContext) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext = new AudioContext();
  }

  function playTone(frequency, duration, wave = "sine", volume = 0.025, event = "click") {
    if (!isSoundEnabled()) return;
    if (window.parent !== window) {
      window.parent.postMessage({ source: "pokemon-tower-defense", type: "sound", event }, window.location.origin);
      return;
    }
    ensureAudio();
    if (!audioContext) return;
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  }

  function toggleSound() {
    soundEnabled = !isSoundEnabled();
    profile.soundEnabled = soundEnabled;
    saveProfile();
    updateSoundUi();
    if (window.parent !== window) {
      window.parent.postMessage({
        source: "pokemon-tower-defense", type: "sound-preference", enabled: soundEnabled,
      }, window.location.origin);
      return;
    }
    if (soundEnabled) {
      ensureAudio();
      playTone(620, 0.08, "sine", 0.03);
    }
  }

  function updateSoundUi() {
    const enabled = isSoundEnabled();
    soundButton.innerHTML = iconMarkup(enabled ? "sound" : "mute");
    soundButton.setAttribute("aria-label", text(enabled ? "mute" : "unmute"));
    soundButton.setAttribute("aria-pressed", String(!enabled));
  }

  function showTutorial(index) {
    tutorialIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, index));
    const [title, description] = TUTORIAL_STEPS[tutorialIndex];
    state.tutorialActive = true;
    tutorialPanel.hidden = false;
    tutorialStep.textContent = `${tutorialIndex + 1} / ${TUTORIAL_STEPS.length}`;
    tutorialTitle.textContent = title;
    tutorialText.textContent = description;
    document.getElementById("tutorialNext").textContent =
      text(tutorialIndex === TUTORIAL_STEPS.length - 1 ? "letsStart" : "next");
  }

  function finishTutorial() {
    tutorialPanel.hidden = true;
    state.tutorialActive = false;
    profile.tutorialComplete = true;
    saveProfile();
    state.banner = { text: text("adventureStarts"), time: 2 };
  }

  function advanceTutorial() {
    if (tutorialIndex >= TUTORIAL_STEPS.length - 1) {
      finishTutorial();
      return;
    }
    showTutorial(tutorialIndex + 1);
  }

  function cancelPointerGesture() {
    clearTimeout(holdTimer);
    holdTimer = null;
    const gesture = pointerDrag;
    pointerDrag = null;
    if (gesture?.lifted && state) {
      state.movingTowerId = null;
      updateUpgradePanel();
    }
    if (gesture && canvas.hasPointerCapture(gesture.id)) canvas.releasePointerCapture(gesture.id);
  }

  // X and battlefield right-click share one cancellation path. The remembered
  // species stays save-compatible, but is not an armed purchase after dismissal.
  function clearFieldSelection() {
    cancelPointerGesture();
    state.movingTowerId = null;
    state.selectedTowerId = null;
    state.choosingEvolution = false;
    state.buildSelectionActive = false;
    hoverCell = null;
    updateUpgradePanel();
    updateSelectedTowerCard();
    renderTowerShop(activeShopFilter);
    helperText.textContent = text("selectionCanceled");
    saveRunCheckpoint();
    canvas.focus({ preventScroll: true });
  }

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    clearFieldSelection();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (pointerDrag && event.pointerId === pointerDrag.id) {
      const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY);
      pointerDrag.lastX = event.clientX;
      pointerDrag.lastY = event.clientY;
      // Fingers drift while waiting. That must never turn a tower hold into pan.
      const threshold = pointerDrag.towerId && !pointerDrag.lifted ? 36 : 8;
      if (distance > threshold) {
        pointerDrag.moved = true;
        if (!pointerDrag.lifted) {
          clearTimeout(holdTimer);
          pointerDrag.holdCanceled = true;
        }
      }
      if (pointerDrag.lifted) {
        const point = pointerPosition(event);
        hoverCell = snapToCell(point.x + pointerDrag.offset.x, point.y + pointerDrag.offset.y);
        return;
      }
    }
    if (pointerDrag && event.pointerId === pointerDrag.id && pointerDrag.canPan) {
      const dx = event.clientX - pointerDrag.startX;
      const dy = event.clientY - pointerDrag.startY;
      if (Math.hypot(dx, dy) > 8) pointerDrag.moved = true;
      if (pointerDrag.moved) {
        const rect = canvas.getBoundingClientRect();
        state.camera = GameData.clampCamera({
          zoom: state.camera.zoom,
          x: pointerDrag.camera.x - dx * WIDTH / rect.width / state.camera.zoom,
          y: pointerDrag.camera.y - dy * HEIGHT / rect.height / state.camera.zoom,
        }, activeMap);
        hoverCell = null;
        updateCameraUi();
        return;
      }
    }
    const point = pointerPosition(event);
    hoverCell = snapToCell(point.x, point.y);
  });
  canvas.addEventListener("pointerleave", () => {
    if (!pointerDrag) hoverCell = null;
  });
  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (event.button === 2) {
      clearFieldSelection();
      return;
    }
    if (!event.isPrimary || event.button !== 0) return;
    cancelPointerGesture();
    ensureAudio();
    const point = pointerPosition(event);
    hoverCell = snapToCell(point.x, point.y);
    keyboardCursor = hoverCell;
    const tower = hitTower(point.x, point.y);
    pointerDrag = {
      id: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false,
      lastX: event.clientX, lastY: event.clientY,
      towerId: tower?.id, holdStarted: performance.now(), holdCanceled: false,
      offset: tower ? { x: tower.x - point.x, y: tower.y - point.y } : { x: 0, y: 0 },
      camera: { ...state.camera },
      canPan: state.camera.zoom > 1 && !tower && !state.movingTowerId,
      lifted: false,
    };
    if (tower && state.running && !state.over && !simulationPaused() && !state.movingTowerId) {
      holdTimer = setTimeout(() => {
        if (!pointerDrag || pointerDrag.id !== event.pointerId || pointerDrag.moved ||
            simulationPaused() || !state.towers.includes(tower)) return;
        selectPlacedTower(tower);
        toggleMoveTower();
        pointerDrag.lifted = true;
        const latest = pointerPosition({ clientX: pointerDrag.lastX, clientY: pointerDrag.lastY });
        hoverCell = snapToCell(latest.x + pointerDrag.offset.x, latest.y + pointerDrag.offset.y);
        showToast(text("moveReady"));
      }, 480);
    }
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener("pointerup", (event) => {
    if (event.button !== 0) return;
    if (!pointerDrag || event.pointerId !== pointerDrag.id) return;
    clearTimeout(holdTimer);
    const lifted = pointerDrag.lifted;
    const dragged = pointerDrag.moved;
    const offset = pointerDrag.offset;
    pointerDrag = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (lifted) {
      if (dragged && !simulationPaused()) {
        const point = pointerPosition(event);
        tryMoveTower(point.x + offset.x, point.y + offset.y);
        // Invalid drops always return safely to the original position.
        if (state.movingTowerId) {
          state.movingTowerId = null;
          helperText.textContent = text("moveCanceled");
        }
        updateUpgradePanel();
      }
      return;
    }
    if (dragged) {
      saveRunCheckpoint();
      return;
    }
    const point = pointerPosition(event);
    handleFieldTap(point.x, point.y);
  });
  canvas.addEventListener("pointercancel", () => {
    cancelPointerGesture();
    state.movingTowerId = null;
    updateUpgradePanel();
    hoverCell = null;
  });
  canvas.addEventListener("lostpointercapture", () => {
    if (pointerDrag) cancelPointerGesture();
  });
  document.addEventListener("keydown", handleKeyboard);
  difficultyButtons.forEach((button) =>
    button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty)),
  );
  mapButtons.forEach((button) =>
    button.addEventListener("click", () => selectMap(button.dataset.map)),
  );
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    if (pointerDrag || state.movingTowerId || !event.deltaY) return;
    changeZoom(state.camera.zoom + (event.deltaY < 0 ? 0.5 : -0.5));
  }, { passive: false });
  document.getElementById("resetViewButton").addEventListener("click", () => changeZoom(1));
  pauseButton.addEventListener("click", togglePause);
  document.getElementById("resumeButton").addEventListener("click", togglePause);
  document.getElementById("instructionsButton").addEventListener("click", () => {
    if (window.parent !== window) {
      window.parent.postMessage({ source: "pokemon-tower-defense", type: "instructions" }, window.location.origin);
    } else {
      showTutorial(0);
    }
  });
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent ||
        event.data?.source !== "pokemon-tower-defense-portal") return;
    if (event.data.type === "instructions-state") {
      cancelPointerGesture();
      state.movingTowerId = null;
      portalInstructionsOpen = event.data.open === true;
      state.instructionsOpen = portalInstructionsOpen;
      lastTime = performance.now();
      updatePauseUi();
    } else if (event.data.type === "sound-state" && typeof event.data.muted === "boolean") {
      portalSoundMuted = event.data.muted;
      updateSoundUi();
    }
  });
  abilityButtons.forEach((button) =>
    button.addEventListener("click", () => purchaseAbility(button.dataset.ability)),
  );
  powerButton.addEventListener("click", usePokePower);
  startWaveButton.addEventListener("click", startWaveEarly);
  document.getElementById("closeUpgradeButton").addEventListener("click", clearFieldSelection);
  sellTowerButton.addEventListener("click", sellSelectedTower);
  speedButton.addEventListener("click", toggleGameSpeed);
  openShopButton.addEventListener("click", () => {
    cancelPointerGesture();
    state.movingTowerId = null;
    updateUpgradePanel();
    renderTowerShop(activeShopFilter);
    towerShop.hidden = false;
    updatePowerUi();
    closeShopButton.focus({ preventScroll: true });
  });
  closeShopButton.addEventListener("click", () => {
    towerShop.hidden = true;
    updatePowerUi();
    openShopButton.focus({ preventScroll: true });
  });
  towerShop.addEventListener("click", (event) => {
    if (event.target === towerShop) {
      towerShop.hidden = true;
      updatePowerUi();
      openShopButton.focus({ preventScroll: true });
    }
  });
  document.getElementById("tutorialNext").addEventListener("click", advanceTutorial);
  document.getElementById("tutorialSkip").addEventListener("click", finishTutorial);
  document.getElementById("startButton").addEventListener("click", () => {
    clearRunCheckpoint();
    resetGame();
    startGame();
  });
  continueButton.addEventListener("click", restoreRunCheckpoint);
  document.getElementById("restartButton").addEventListener("click", () => {
    clearRunCheckpoint();
    renderTowerShop();
    resetGame();
    startPanel.classList.remove("is-hidden");
    gameOverPanel.classList.add("is-hidden");
  });
  soundButton.addEventListener("click", toggleSound);
  document.addEventListener("visibilitychange", () => {
    cancelPointerGesture();
    state.movingTowerId = null;
    updateUpgradePanel();
    lastTime = performance.now();
  });
  window.addEventListener("pagehide", saveRunCheckpoint);

  function frame(time) {
    const dt = Math.min(0.033, Math.max(0, (time - lastTime) / 1000));
    lastTime = time;
    update(dt * state.gameSpeed);
    draw();
    requestAnimationFrame(frame);
  }

  function iconMarkup(name) {
    const paths = {
      shop: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
      pause: '<path d="M8 5v14M16 5v14"/>',
      sound: '<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
      mute: '<path d="m11 5-5 4H3v6h3l5 4V5Z"/><path d="m16 9 6 6m0-6-6 6"/>',
      spark: '<path d="m13 2-8 12h6l-1 8 9-13h-6l0-7Z"/>',
      power: '<path d="m4 20 11-11M13 4l7 7-4 4-7-7 4-4Z"/>',
      range: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
      evolve: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"/>',
      expand: '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
      hand: '<path d="M8 13V6a2 2 0 0 1 4 0v6M12 10a2 2 0 0 1 4 0v3M16 11a2 2 0 0 1 4 0v6c0 4-3 6-6 6H9l-5-7a2 2 0 0 1 3-3l1 1M5 4 8 1l3 3"/>',
    };
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
  }

  // Original, filled toy-like illustrations. No tiny toolbar glyphs for upgrades.
  function upgradeIllustration(ability) {
    const art = {
      power: '<circle cx="40" cy="40" r="33" fill="#ffcb91"/><path d="m40 7 7 19 20-4-9 17 15 12-21 3-4 20-13-16-19 8 5-21L5 33l22-3Z" fill="#f46b43" stroke="#842f34" stroke-width="3"/><path d="m43 20-17 25h13l-3 17 19-28H42Z" fill="#fff4bd"/><circle cx="65" cy="13" r="5" fill="#fff4bd"/>',
      range: '<circle cx="40" cy="40" r="35" fill="#a8e6fb"/><circle cx="40" cy="40" r="28" fill="#438ad3"/><circle cx="40" cy="40" r="20" fill="#ecfaff"/><circle cx="40" cy="40" r="12" fill="#438ad3"/><circle cx="40" cy="40" r="5" fill="#ecfaff"/><path d="m41 39 24-25" stroke="#243b67" stroke-width="6" stroke-linecap="round"/><path d="m60 8 1 12 12 1-8-8Z" fill="#ffcc65" stroke="#243b67" stroke-width="2"/>',
      special: '<circle cx="40" cy="40" r="35" fill="#dbc9ff"/><path d="m15 51 24-25 26 25" fill="none" stroke="#7453be" stroke-width="9" stroke-linecap="round"/><circle cx="15" cy="51" r="12" fill="#fff3b6" stroke="#7453be" stroke-width="3"/><circle cx="39" cy="26" r="14" fill="#ffd25d" stroke="#7453be" stroke-width="3"/><circle cx="65" cy="51" r="12" fill="#fff3b6" stroke="#7453be" stroke-width="3"/><path d="m41 16-8 12h6l-2 9 9-14h-6Z" fill="#7453be"/><path d="m16 8 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#fff"/>',
      evolution: '<circle cx="40" cy="40" r="35" fill="#b9f3d6"/><path d="M23 67c-17-22-6-35 10-37-3-15 11-22 21-18-5 10-8 13-6 23 19 2 25 18 8 32Z" fill="#38aa8b" stroke="#216c65" stroke-width="3"/><path d="m40 23 5 12 13 2-10 9 3 13-11-7-11 7 3-13-10-9 13-2Z" fill="#fff1a3"/><circle cx="16" cy="18" r="5" fill="#fff1a3"/><circle cx="67" cy="25" r="4" fill="#fff1a3"/>',
    };
    return `<svg viewBox="0 0 80 80" aria-hidden="true">${art[ability] || art.special}</svg>`;
  }

  // Recompose the shell, with one stable command slot and no controls over roads.
  const commandDeck = document.getElementById("commandDeck");
  const header = document.querySelector(".title-bar");
  header.append(document.querySelector(".battle-status"));
  header.querySelector(".battle-status").append(document.querySelector(".hud"));
  const tray = document.createElement("div");
  tray.className = "team-workspace";
  tray.append(document.querySelector(".roster-dock"), upgradePanel);
  header.querySelector(".title-actions").append(document.querySelector(".view-toolbar"));
  const powerStation = document.createElement("div");
  powerStation.className = "power-station";
  const waveAction = document.createElement("div");
  waveAction.className = "wave-action";
  waveAction.append(startWaveButton);
  powerStation.append(powerButton, waveAction);
  commandDeck.append(tray, powerStation);
  const emptySelection = document.createElement("span");
  emptySelection.className = "empty-selection";
  emptySelection.textContent = text("selectionCanceled");
  document.querySelector(".selected-pokemon-card").append(emptySelection);
  document.querySelector(".game-stage").before(commandDeck);
  document.querySelector(".game-shell").append(startPanel, gameOverPanel, pausePanel, tutorialPanel);
  const sceneContext = document.createElement("div");
  sceneContext.className = "scene-context";
  sceneContext.innerHTML = `<small>${text("uiBattlefieldLabel")}</small><strong id="sceneTitle"></strong><span id="sceneDifficulty"></span>`;
  const sceneGuidance = document.createElement("div");
  sceneGuidance.className = "scene-guidance";
  sceneGuidance.innerHTML = `${iconMarkup("hand")}<p>${text("holdMove")}</p>`;
  document.querySelector(".game-stage").append(sceneContext, sceneGuidance);
  for (const [selector, icon] of [
    ["#pauseButton", "pause"], ["#soundButton", "sound"],
    ["#powerButton > span", "spark"], ["#resetViewButton > span:first-child", "expand"],
  ]) document.querySelector(selector).innerHTML = iconMarkup(icon);
  const statArt = {
    coins: '<circle cx="24" cy="24" r="20" fill="#f9b833" stroke="#ffe89c" stroke-width="3"/><circle cx="24" cy="24" r="14" fill="#ffd76b" stroke="#c58921" stroke-width="2"/><path d="m24 13 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#a96618"/>',
    lives: '<path d="M24 41C-5 24 7 3 20 10l4 4 4-4c13-7 25 14-4 31Z" fill="#f87696" stroke="#ffbdd0" stroke-width="3"/><path d="M11 19c0-4 3-6 6-5" fill="none" stroke="#fff0f5" stroke-width="3" stroke-linecap="round"/>',
    wave: '<rect x="4" y="4" width="40" height="40" rx="13" fill="#78dcd8"/><path d="M9 25c8 0 7-13 17-13-5 9 3 17 13 17-9 12-22 7-30-4Z" fill="#1d749c"/><path d="M9 34c7-3 10 5 18 1s9-2 12-1" fill="none" stroke="#d9ffff" stroke-width="3" stroke-linecap="round"/>',
  };
  for (const [kind, art] of Object.entries(statArt)) {
    document.querySelector(`.stat-${kind} > span`).innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">${art}</svg>`;
  }
  // Original commerce illustrations, distinct from the combat ability tiles.
  document.querySelector(".buy-art").innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true">
    <ellipse cx="32" cy="57" rx="27" ry="5" fill="#103b4455"/>
    <path d="M6 37 11 18h42l5 19v19H6Z" fill="#e9b766" stroke="#ffe7a6" stroke-width="2"/>
    <path d="M7 30h50l-3-12H10Z" fill="#68d9b3"/><path d="M16 18v12m12-12v12m12-12v12m12-12v12" stroke="#caffec" stroke-width="5"/>
    <circle cx="32" cy="36" r="18" fill="#fff5da" stroke="#253b56" stroke-width="3"/>
    <path d="M14 36a18 18 0 0 1 36 0Z" fill="#fa727c"/><path d="M14 36h36" stroke="#253b56" stroke-width="3"/>
    <circle cx="32" cy="36" r="7" fill="#a5f5ec" stroke="#253b56" stroke-width="3"/><circle cx="30" cy="34" r="2" fill="white"/>
    <path d="m54 3 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="#fff19c"/><path d="m8 5 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="#afffe7"/>
  </svg>`;
  document.querySelector(".sell-return-art").innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">
    <path d="M35 6c9 0 10 10 5 15" fill="none" stroke="#ffc89b" stroke-width="3" stroke-linecap="round"/>
    <path d="m35 19 5 5 4-6" fill="none" stroke="#ffc89b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="34" cy="35" r="11" fill="#efaf37" stroke="#ffe9a0" stroke-width="2"/><circle cx="34" cy="35" r="7" fill="#ffd76b"/>
    <path d="m34 29 2 4 4 1-3 3v4l-3-2-3 2v-4l-3-3 4-1Z" fill="#a9681a"/>
  </svg>`;
  document.querySelector(".refund-coin").innerHTML = `<svg viewBox="0 0 48 48" aria-hidden="true">${statArt.coins}</svg>`;
  abilityButtons.forEach((button) => {
    button.querySelector(".ability-icon").innerHTML = upgradeIllustration(button.dataset.ability);
    const status = document.createElement("span");
    status.className = "ability-state";
    status.setAttribute("aria-hidden", "true");
    button.append(status);
  });
  for (const button of mapButtons) {
    const img = document.createElement("img"); img.alt = ""; img.className = "map-preview";
    img.src = window.PokemonTDLandscape.preview(GameData.MAPS[button.dataset.map], button.dataset.map);
    button.querySelector(".map-choice-icon").replaceWith(img);
  }
  document.querySelectorAll(".difficulty-button > span:first-child").forEach((dot) => { dot.textContent = ""; dot.className = "difficulty-dot"; });
  document.querySelectorAll(".difficulty-badge small, .map-badge small").forEach((label) => label.hidden = true);
  document.querySelector(".buy-pokemon-button small").hidden = false;
  // DOM portraits must also report unavailable art, rather than broken icons.
  for (const portrait of [heroPortrait, document.getElementById("sellTowerPortrait"), selectedTowerPortrait, waveEnemyIcon, bossWarningImage]) {
    portrait.addEventListener("error", () => {
      portrait.hidden = true;
      showToast(text("artUnavailable", { name: portrait === heroPortrait ? upgradeName.textContent : selectedTowerName.textContent }));
    });
    portrait.addEventListener("load", () => { portrait.hidden = false; });
  }
  helperText.textContent = text("holdMove");
  updateProfileUi();
  resetGame();
  loadAssets();
  requestAnimationFrame(frame);
  if (window.parent !== window) {
    window.parent.postMessage({
      source: "pokemon-tower-defense", type: "sound-state-request",
    }, window.location.origin);
  }
})();

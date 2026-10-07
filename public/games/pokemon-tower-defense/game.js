(() => {
  "use strict";

  const WIDTH = 1600;
  const HEIGHT = 900;
  const GRID = 80;
  const PATH_WIDTH = 96;
  const SAVE_KEY = "mini-games:pokemon-tower-defense:profile";
  const RUN_SAVE_KEY = "mini-games:pokemon-tower-defense:run";
  const SAVE_VERSION = 1;
  const ASSET_ROOT = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
  const TERRAIN_ROOT = "https://raw.githubusercontent.com/shorepine/kenney/main/2d/Tower%20Defense/Retina";
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
  const PATH = [
    { x: -60, y: 185 },
    { x: 155, y: 185 },
    { x: 285, y: 300 },
    { x: 230, y: 520 },
    { x: 370, y: 735 },
    { x: 575, y: 800 },
    { x: 760, y: 705 },
    { x: 825, y: 500 },
    { x: 710, y: 340 },
    { x: 770, y: 185 },
    { x: 985, y: 150 },
    { x: 1140, y: 280 },
    { x: 1085, y: 500 },
    { x: 1205, y: 665 },
    { x: 1390, y: 600 },
    { x: 1490, y: 745 },
    { x: 1660, y: 780 },
  ];
  const TERRAIN_BLOCKERS = [
    { type: "lake", x: 1325, y: 255, rx: 185, ry: 105 },
    { type: "pond", x: 510, y: 325, rx: 115, ry: 72 },
    { type: "cliff", x: 1260, y: 790, rx: 145, ry: 62 },
    { type: "grove", x: 930, y: 760, rx: 105, ry: 72 },
  ];

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
  const moveTowerButton = document.getElementById("moveTowerButton");
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
  let towerButtons = [];

  const images = {};
  const terrainUrls = [
    `${TERRAIN_ROOT}/towerDefense_tile024.png`,
    `${TERRAIN_ROOT}/towerDefense_tile038.png`,
    `${TERRAIN_ROOT}/towerDefense_tile069.png`,
  ];
  const assetUrls = {
    pikachuAnimated: `${ASSET_ROOT}/other/showdown/25.gif`,
    charmanderAnimated: `${ASSET_ROOT}/other/showdown/4.gif`,
    raichuAnimated: `${ASSET_ROOT}/other/showdown/26.gif`,
    charmeleonAnimated: `${ASSET_ROOT}/other/showdown/5.gif`,
    charizardAnimated: `${ASSET_ROOT}/other/showdown/6.gif`,
    bulbasaurAnimated: `${ASSET_ROOT}/other/showdown/1.gif`,
    ivysaurAnimated: `${ASSET_ROOT}/other/showdown/2.gif`,
    venusaurAnimated: `${ASSET_ROOT}/other/showdown/3.gif`,
    squirtleAnimated: `${ASSET_ROOT}/other/showdown/7.gif`,
    wartortleAnimated: `${ASSET_ROOT}/other/showdown/8.gif`,
    blastoiseAnimated: `${ASSET_ROOT}/other/showdown/9.gif`,
    eeveeAnimated: `${ASSET_ROOT}/other/showdown/133.gif`,
    vaporeonAnimated: `${ASSET_ROOT}/other/showdown/134.gif`,
    magnemiteAnimated: `${ASSET_ROOT}/other/showdown/81.gif`,
    magnetonAnimated: `${ASSET_ROOT}/other/showdown/82.gif`,
    magnezoneAnimated: `${ASSET_ROOT}/other/showdown/462.gif`,
    shinxAnimated: `${ASSET_ROOT}/other/showdown/403.gif`,
    luxioAnimated: `${ASSET_ROOT}/other/showdown/404.gif`,
    luxrayAnimated: `${ASSET_ROOT}/other/showdown/405.gif`,
    vulpixAnimated: `${ASSET_ROOT}/other/showdown/37.gif`,
    ninetalesAnimated: `${ASSET_ROOT}/other/showdown/38.gif`,
    torchicAnimated: `${ASSET_ROOT}/other/showdown/255.gif`,
    combuskenAnimated: `${ASSET_ROOT}/other/showdown/256.gif`,
    blazikenAnimated: `${ASSET_ROOT}/other/showdown/257.gif`,
    mudkipAnimated: `${ASSET_ROOT}/other/showdown/258.gif`,
    marshtompAnimated: `${ASSET_ROOT}/other/showdown/259.gif`,
    swampertAnimated: `${ASSET_ROOT}/other/showdown/260.gif`,
    piplupAnimated: `${ASSET_ROOT}/other/showdown/393.gif`,
    prinplupAnimated: `${ASSET_ROOT}/other/showdown/394.gif`,
    empoleonAnimated: `${ASSET_ROOT}/other/showdown/395.gif`,
    chikoritaAnimated: `${ASSET_ROOT}/other/showdown/152.gif`,
    bayleefAnimated: `${ASSET_ROOT}/other/showdown/153.gif`,
    meganiumAnimated: `${ASSET_ROOT}/other/showdown/154.gif`,
    rowletAnimated: `${ASSET_ROOT}/other/showdown/722.gif`,
    dartrixAnimated: `${ASSET_ROOT}/other/showdown/723.gif`,
    decidueyeAnimated: `${ASSET_ROOT}/other/showdown/724.gif`,
    abraAnimated: `${ASSET_ROOT}/other/showdown/63.gif`,
    kadabraAnimated: `${ASSET_ROOT}/other/showdown/64.gif`,
    alakazamAnimated: `${ASSET_ROOT}/other/showdown/65.gif`,
    raltsAnimated: `${ASSET_ROOT}/other/showdown/280.gif`,
    kirliaAnimated: `${ASSET_ROOT}/other/showdown/281.gif`,
    gardevoirAnimated: `${ASSET_ROOT}/other/showdown/282.gif`,
    zubatAnimated: `${ASSET_ROOT}/other/showdown/41.gif`,
    pidgeyAnimated: `${ASSET_ROOT}/other/showdown/16.gif`,
    pidgeottoAnimated: `${ASSET_ROOT}/other/showdown/17.gif`,
    pidgeotAnimated: `${ASSET_ROOT}/other/showdown/18.gif`,
    rattataAnimated: `${ASSET_ROOT}/other/showdown/19.gif`,
    raticateAnimated: `${ASSET_ROOT}/other/showdown/20.gif`,
    caterpieAnimated: `${ASSET_ROOT}/other/showdown/10.gif`,
    metapodAnimated: `${ASSET_ROOT}/other/showdown/11.gif`,
    butterfreeAnimated: `${ASSET_ROOT}/other/showdown/12.gif`,
    weedleAnimated: `${ASSET_ROOT}/other/showdown/13.gif`,
    kakunaAnimated: `${ASSET_ROOT}/other/showdown/14.gif`,
    beedrillAnimated: `${ASSET_ROOT}/other/showdown/15.gif`,
    golbatAnimated: `${ASSET_ROOT}/other/showdown/42.gif`,
    crobatAnimated: `${ASSET_ROOT}/other/showdown/169.gif`,
    sentretAnimated: `${ASSET_ROOT}/other/showdown/161.gif`,
    furretAnimated: `${ASSET_ROOT}/other/showdown/162.gif`,
    hoothootAnimated: `${ASSET_ROOT}/other/showdown/163.gif`,
    noctowlAnimated: `${ASSET_ROOT}/other/showdown/164.gif`,
    poochyenaAnimated: `${ASSET_ROOT}/other/showdown/261.gif`,
    mightyenaAnimated: `${ASSET_ROOT}/other/showdown/262.gif`,
    bidoofAnimated: `${ASSET_ROOT}/other/showdown/399.gif`,
    bibarelAnimated: `${ASSET_ROOT}/other/showdown/400.gif`,
    starlyAnimated: `${ASSET_ROOT}/other/showdown/396.gif`,
    staraviaAnimated: `${ASSET_ROOT}/other/showdown/397.gif`,
    staraptorAnimated: `${ASSET_ROOT}/other/showdown/398.gif`,
    patratAnimated: `${ASSET_ROOT}/other/showdown/504.gif`,
    watchogAnimated: `${ASSET_ROOT}/other/showdown/505.gif`,
    fletchlingAnimated: `${ASSET_ROOT}/other/showdown/661.gif`,
    fletchinderAnimated: `${ASSET_ROOT}/other/showdown/662.gif`,
    talonflameAnimated: `${ASSET_ROOT}/other/showdown/663.gif`,
    yungoosAnimated: `${ASSET_ROOT}/other/showdown/734.gif`,
    gumshoosAnimated: `${ASSET_ROOT}/other/showdown/735.gif`,
    skwovetAnimated: `${ASSET_ROOT}/other/showdown/819.gif`,
    greedentAnimated: `${ASSET_ROOT}/other/showdown/820.gif`,
    lechonkAnimated: `${ASSET_ROOT}/other/showdown/915.gif`,
    oinkologneAnimated: `${ASSET_ROOT}/other/showdown/916.gif`,
    onixAnimated: `${ASSET_ROOT}/other/showdown/95.gif`,
    haunterAnimated: `${ASSET_ROOT}/other/showdown/93.gif`,
    snorlaxAnimated: `${ASSET_ROOT}/other/showdown/143.gif`,
    dragoniteAnimated: `${ASSET_ROOT}/other/showdown/149.gif`,
    pikachuArt: `${ASSET_ROOT}/other/official-artwork/25.png`,
    charmanderArt: `${ASSET_ROOT}/other/official-artwork/4.png`,
    bulbasaurArt: `${ASSET_ROOT}/other/official-artwork/1.png`,
    squirtleArt: `${ASSET_ROOT}/other/official-artwork/7.png`,
    eeveeArt: `${ASSET_ROOT}/other/official-artwork/133.png`,
    magnemiteArt: `${ASSET_ROOT}/other/official-artwork/81.png`,
    shinxArt: `${ASSET_ROOT}/other/official-artwork/403.png`,
    vulpixArt: `${ASSET_ROOT}/other/official-artwork/37.png`,
    torchicArt: `${ASSET_ROOT}/other/official-artwork/255.png`,
    mudkipArt: `${ASSET_ROOT}/other/official-artwork/258.png`,
    piplupArt: `${ASSET_ROOT}/other/official-artwork/393.png`,
    chikoritaArt: `${ASSET_ROOT}/other/official-artwork/152.png`,
    rowletArt: `${ASSET_ROOT}/other/official-artwork/722.png`,
    abraArt: `${ASSET_ROOT}/other/official-artwork/63.png`,
    raltsArt: `${ASSET_ROOT}/other/official-artwork/280.png`,
    zubatArt: `${ASSET_ROOT}/other/official-artwork/41.png`,
    grass: terrainUrls[0],
    grassFlowers: terrainUrls[1],
    grassDetails: terrainUrls[2],
  };

  let state;
  let selectedTower = "pikachu";
  let lastTime = performance.now();
  let toastTimer = 0;
  let audioContext = null;
  let soundEnabled = true;
  let hoverCell = null;
  let nextId = 1;
  let tutorialIndex = 0;
  let activeShopFilter = "all";
  let profile = loadProfile();

  const TUTORIAL_STEPS = [
    ["מציבים פוקימון", "בחרו פוקימון למטה ולחצו על משבצת דשא פנויה."],
    ["משדרגים גיבור", "לחצו על פוקימון שהצבתם וקנו עוצמה, טווח ויכולת מיוחדת."],
    ["מתכוננים לבוס", "כל גל חמישי הוא קרב בוס. חפשו את החולשה והאזהרה שלו."],
    ["מגיעים לצורה הסופית", "אחרי הבוס הראשון ושישה שדרוגים אפשר לפתוח צורה סופית!"],
  ];

  function defaultProfile() {
    return {
      version: SAVE_VERSION,
      bestWave: 0,
      bossStars: 0,
      discoveries: Object.keys(TOWER_TYPES),
      soundEnabled: true,
      gameSpeed: 1,
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
          ? [...new Set([...fallback.discoveries, ...saved.discoveries.filter((item) => typeof item === "string")])].slice(0, 100)
          : fallback.discoveries,
        soundEnabled: saved.soundEnabled !== false,
        gameSpeed: saved.gameSpeed === 2 ? 2 : 1,
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
      showToast("לא ניתן לשמור במכשיר הזה");
    }
    updateProfileUi();
  }

  function updateProfileUi() {
    bestWaveValue.textContent = String(profile.bestWave);
    bossStarsValue.textContent = String(profile.bossStars);
    dexValue.textContent = String(profile.discoveries.length);
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
    if (saved) continueButton.textContent = `המשך מגל ${Math.max(1, Number(saved.wave) + 1)}`;
  }

  function saveRunCheckpoint() {
    if (!state || !state.running || state.over || state.waveActive) return;
    const snapshot = {
      version: SAVE_VERSION,
      savedAt: Date.now(),
      coins: state.coins,
      lives: state.lives,
      wave: state.wave,
      power: state.power,
      bossesDefeated: state.bossesDefeated,
      finalEvolutionUnlocked: state.finalEvolutionUnlocked,
      selectedTower,
      nextEnemyFamilyId: state.nextEnemyFamily.id,
      towers: state.towers.map((tower) => ({
        type: tower.type,
        x: tower.x,
        y: tower.y,
        skills: { ...tower.skills },
        evolutionStage: tower.evolutionStage,
        spentCoins: tower.spentCoins,
      })),
    };
    try {
      localStorage.setItem(RUN_SAVE_KEY, JSON.stringify(snapshot));
      refreshContinueButton();
    } catch (error) {
      console.warn("Could not save the current run.", error);
      showToast("לא ניתן לשמור את הסיבוב במכשיר הזה");
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
      showToast("לא נמצא משחק שמור");
      refreshContinueButton();
      return;
    }
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
    selectedTower = TOWER_TYPES[saved.selectedTower] ? saved.selectedTower : "pikachu";
    const restoredCells = new Set();
    state.towers = saved.towers
      .filter((tower) => TOWER_TYPES[tower.type])
      .slice(0, 80)
      .map((tower) => {
        const type = TOWER_TYPES[tower.type];
        const x = Math.max(40, Math.min(WIDTH - 40, Number(tower.x) || 40));
        const y = Math.max(160, Math.min(HEIGHT - 40, Number(tower.y) || 160));
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
          spentCoins: Math.max(type.cost, Math.floor(Number(tower.spentCoins) || type.cost)),
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
        return valid;
      });
    for (const tower of state.towers) tower.level = getTowerLevel(tower);
    startPanel.classList.add("is-hidden");
    gameOverPanel.classList.add("is-hidden");
    state.running = true;
    state.waveTimer = 1.8;
    state.banner = { text: `חזרתם להרפתקה! גל ${state.wave + 1}`, time: 2.6 };
    updateSelectedTowerCard();
    renderTowerShop();
    updateHud();
    updateWaveUi();
    saveRunCheckpoint();
    playTone(640, 0.12, "sine", 0.04);
  }

  function loadImage(key, url) {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        images[key] = image;
        resolve(true);
      };
      image.onerror = () => {
        images[key] = null;
        resolve(false);
      };
      image.src = url;
    });
  }

  function loadAssets() {
    Object.entries(assetUrls).forEach(([key, url]) => loadImage(key, url));
    updateSelectedTowerCard();
  }

  function getTowerDetail(type) {
    const details = {
      lightning: "ברקים ושרשראות",
      fire: "אש ונזק אזורי",
      water: "מים, פיצוץ והאטה",
      seed: "זרעים ושליטה בשביל",
      star: "אנרגיה על-חושית",
    };
    return details[type.attack] || "מתקפה מיוחדת";
  }

  function updateSelectedTowerCard() {
    const type = TOWER_TYPES[selectedTower];
    const element = ELEMENT_TYPES[type.element];
    selectedTowerPortrait.src = assetUrls[`${selectedTower}Art`] || assetUrls[`${selectedTower}Animated`];
    selectedTowerType.textContent = `${element.icon} ${element.name}`;
    selectedTowerName.textContent = type.name;
    selectedTowerDetail.textContent = getTowerDetail(type);
    selectedTowerPrice.textContent = String(type.cost);
  }

  function renderTowerShop(filter = activeShopFilter) {
    activeShopFilter = filter;
    typeTabs.replaceChildren(
      ...Object.entries(ELEMENT_TYPES).map(([key, element]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.type = key;
        button.classList.toggle("is-selected", key === activeShopFilter);
        button.textContent = `${element.icon} ${element.name}`;
        button.addEventListener("click", () => renderTowerShop(key));
        return button;
      }),
    );
    const entries = Object.entries(TOWER_TYPES).filter(
      ([, type]) => activeShopFilter === "all" || type.element === activeShopFilter,
    );
    towerGrid.replaceChildren(
      ...entries.map(([key, type]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "shop-tower-card";
        button.dataset.tower = key;
        button.classList.toggle("is-selected", key === selectedTower);
        button.style.setProperty("--tower-color", type.color);
        button.innerHTML = `
          <img src="${assetUrls[`${key}Art`] || assetUrls[`${key}Animated`]}" alt="">
          <span><strong>${type.name}</strong><small>${getTowerDetail(type)}</small></span>
          <b>${type.cost}</b>
        `;
        button.addEventListener("click", () => {
          selectTower(key);
          towerShop.hidden = true;
        });
        return button;
      }),
    );
    towerButtons = [...towerGrid.querySelectorAll(".shop-tower-card")];
  }

  function pickEnemyFamily(excludeId = "") {
    const choices = ENEMY_FAMILIES.filter((family) => family.id !== excludeId);
    return choices[Math.floor(Math.random() * choices.length)] || ENEMY_FAMILIES[0];
  }

  function getEnemyForWave(family, wave, randomize = false) {
    const maxStage = Math.min(family.stages.length - 1, Math.floor((wave - 1) / 5));
    const stage =
      randomize && maxStage > 0 && Math.random() < 0.3 ? maxStage - 1 : maxStage;
    return family.stages[Math.max(0, stage)];
  }

  function resetGame() {
    soundEnabled = profile.soundEnabled;
    state = {
      running: false,
      over: false,
      coins: 160,
      lives: 10,
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
      nextEnemyFamily: pickEnemyFamily(),
      waveModifier: WAVE_MODIFIERS[0],
      currentBoss: null,
      isBossWave: false,
      bossesDefeated: 0,
      finalEvolutionUnlocked: false,
      bossShieldAvailable: false,
      bossDefeatedThisWave: false,
      bossWarningTime: 0,
      towers: [],
      enemies: [],
      projectiles: [],
      particles: [],
      effects: [],
      floats: [],
      shake: 0,
      banner: { text: "בחרו פוקימון!", time: 2.5 },
      elapsed: 0,
      selectedTowerId: null,
      movingTowerId: null,
      power: 0,
      combo: 0,
      comboTimer: 0,
      gameSpeed: profile.gameSpeed,
      newDiscoveries: 0,
      tutorialActive: false,
    };
    hoverCell = null;
    bossHealth.hidden = true;
    bossWarning.hidden = true;
    updateUpgradePanel();
    updateHud();
    updateWaveUi();
    updateSpeedUi();
    updateSoundUi();
    updateProfileUi();
    refreshContinueButton();
  }

  function startGame() {
    ensureAudio();
    startPanel.classList.add("is-hidden");
    gameOverPanel.classList.add("is-hidden");
    state.running = true;
    state.waveTimer = 0.6;
    state.banner = { text: "הגנו על סל הפירות!", time: 2.3 };
    if (!profile.tutorialComplete) showTutorial(0);
    saveRunCheckpoint();
    playTone(520, 0.09, "sine", 0.05);
    setTimeout(() => playTone(760, 0.12, "sine", 0.05), 80);
  }

  function beginWave() {
    state.wave += 1;
    state.waveLabel = state.wave;
    state.waveActive = true;
    state.isBossWave = state.wave % 5 === 0;
    state.currentBoss = state.isBossWave
      ? BOSS_STAGES[(state.wave / 5 - 1) % BOSS_STAGES.length]
      : null;
    if (!state.isBossWave) {
      state.currentEnemyFamily = state.nextEnemyFamily;
      state.currentEnemyType = getEnemyForWave(state.currentEnemyFamily, state.wave);
      state.nextEnemyFamily = pickEnemyFamily(state.currentEnemyFamily.id);
    }
    state.waveModifier = WAVE_MODIFIERS[(state.wave - 1) % WAVE_MODIFIERS.length];
    state.enemiesToSpawn = state.isBossWave
      ? 1
      : 5 + state.wave * 2 + state.waveModifier.count;
    state.enemiesSpawned = 0;
    state.enemiesCompleted = 0;
    state.spawnTimer = state.isBossWave ? 1.15 : 0;
    state.bossShieldAvailable = state.isBossWave;
    state.bossDefeatedThisWave = false;
    state.bossWarningTime = state.isBossWave ? 2.8 : 0;
    state.banner = {
      text: state.isBossWave
        ? `קרב בוס: ${state.currentBoss.name}!`
        : `גל ${state.wave}: ${state.currentEnemyType.name} · ${state.waveModifier.name}`,
      time: 2.4,
    };
    if (state.isBossWave) {
      bossWarningImage.src = assetUrls[state.currentBoss.image];
      bossWarningName.textContent = state.currentBoss.name;
      bossWarningDetail.textContent =
        `חלש ל${state.currentBoss.weaknessLabel} · ${state.currentBoss.mechanic}`;
      bossWarning.hidden = false;
      discoverPokemon(`boss-${state.currentBoss.image}`);
    } else {
      discoverPokemon(`enemy-${state.currentEnemyType.image}`);
    }
    updateHud();
    updateWaveUi();
    playTone(330, 0.08, "square", 0.025);
    setTimeout(() => playTone(440, 0.1, "square", 0.025), 90);
  }

  function completeWave() {
    state.waveActive = false;
    const bossVictory = state.isBossWave && state.bossDefeatedThisWave;
    const bonus = state.isBossWave
      ? bossVictory
        ? 45 + state.wave * 4
        : 12
      : 18 + state.wave * 3;
    state.coins += bonus;
    state.waveTimer = Math.max(4.5, 8 - state.wave * 0.14);
    state.banner = {
      text: state.isBossWave
        ? bossVictory
          ? `הבוס הובס! ⭐ ${bonus}+ מטבעות`
          : "הבוס עבר — מתחזקים וממשיכים!"
        : `הגל הושלם! ${bonus}+ מטבעות`,
      time: state.isBossWave ? 3 : 2.1,
    };
    burst(WIDTH / 2, HEIGHT / 2, "#ffe66c", 26, 150);
    profile.bestWave = Math.max(profile.bestWave, state.wave);
    saveProfile();
    updateHud();
    updateWaveUi();
    saveRunCheckpoint();
    playTone(660, 0.09, "sine", 0.04);
    setTimeout(() => playTone(880, 0.14, "sine", 0.04), 100);
  }

  function spawnEnemy() {
    const wave = state.wave;
    const isBoss = state.isBossWave;
    const enemyType = isBoss
      ? state.currentBoss
      : getEnemyForWave(state.currentEnemyFamily, wave, true);
    const baseHealth = 52 + wave * 18 + Math.pow(wave, 1.38) * 4;
    const health = Math.round(
      baseHealth *
        enemyType.health *
        (isBoss ? 7.2 : state.waveModifier.health),
    );
    state.enemies.push({
      id: nextId++,
      name: enemyType.name,
      image: enemyType.image,
      x: PATH[0].x,
      y: PATH[0].y,
      segment: 0,
      health,
      maxHealth: health,
      speed:
        Math.min(124, 55 + wave * 2.45 + Math.random() * 8) *
        enemyType.speed *
        (isBoss ? 0.78 : state.waveModifier.speed),
      baseSpeed:
        Math.min(124, 55 + wave * 2.45) *
        enemyType.speed *
        (isBoss ? 0.78 : state.waveModifier.speed),
      radius: enemyType.radius,
      rewardMultiplier: isBoss ? 6 : enemyType.reward,
      boss: isBoss,
      bossData: isBoss ? enemyType : null,
      modifier: isBoss ? "בוס" : state.waveModifier.name,
      abilityTimer: isBoss ? 4.2 : 0,
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
        state.spawnTimer = Math.max(0.38, 1.05 - state.wave * 0.025);
      }
    }

    updateEnemies(dt);
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
      if (enemy.boss) updateBossMechanic(enemy, dt);
      const target = PATH[enemy.segment + 1];
      if (!target) {
        if (enemy.boss && state.bossShieldAvailable) {
          state.bossShieldAvailable = false;
          enemy.segment = Math.max(0, PATH.length - 5);
          enemy.x = PATH[enemy.segment].x;
          enemy.y = PATH[enemy.segment].y;
          enemy.health = Math.max(1, enemy.health * 0.82);
          enemy.abilityState = "מגן הפירות הדף את הבוס!";
          enemy.abilityTime = 1.8;
          state.banner = { text: "🫐 מגן הפירות הציל את הסל!", time: 2.4 };
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
        addFloat(enemy.x, enemy.y - 20, enemy.boss ? "הבוס לקח 2 חיים!" : "פרי נגנב!", "#fff");
        playTone(130, 0.18, "sawtooth", 0.04);
        updateHud();
        if (state.lives <= 0) endGame();
        continue;
      }
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      const dashMultiplier = enemy.abilityState === "מסתער!" ? 2.15 : 1;
      const move = enemy.speed * dashMultiplier * (enemy.slow > 0 ? 0.65 : 1) * dt;
      if (distance <= move) {
        enemy.x = target.x;
        enemy.y = target.y;
        enemy.segment += 1;
      } else {
        enemy.x += (dx / distance) * move;
        enemy.y += (dy / distance) * move;
      }
    }

    function updateBossMechanic(enemy, dt) {
      if (enemy.abilityTime > 0) {
        enemy.abilityTime -= dt;
        if (enemy.abilityTime > 0) return;
        if (enemy.abilityState === "מגן אבנים פעיל") enemy.shielded = false;
        if (enemy.abilityState === "נעלם מהעין") enemy.phased = false;
        if (enemy.abilityState === "מרפא...") {
          enemy.health = Math.min(enemy.maxHealth, enemy.health + enemy.maxHealth * 0.1);
          addFloat(enemy.x, enemy.y - 45, "התאושש!", "#9dff9f");
        }
        enemy.abilityState = "";
        enemy.abilityTimer = 5.2 + Math.random() * 1.2;
      }
      enemy.abilityTimer -= dt;
      if (enemy.abilityTimer > 0) return;
      const ability = enemy.bossData.ability;
      if (ability === "shield") {
        enemy.shielded = true;
        enemy.abilityState = "מגן אבנים פעיל";
        enemy.abilityTime = 1.9;
      } else if (ability === "phase") {
        enemy.phased = true;
        enemy.abilityState = "נעלם מהעין";
        enemy.abilityTime = 1.45;
      } else if (ability === "heal") {
        enemy.abilityState = "מרפא...";
        enemy.abilityTime = 1.55;
        enemy.healInterruptDamage = 0;
      } else {
        enemy.abilityState = "מסתער!";
        enemy.abilityTime = 1.5;
      }
      state.shake = Math.max(state.shake, 4);
      addFloat(enemy.x, enemy.y - 50, enemy.abilityState, enemy.bossData.color);
    }
  }

  function getTowerStats(tower) {
    const type = TOWER_TYPES[tower.type];
    const skills = tower.skills || { power: 0, range: 0, special: 0 };
    const stage = tower.evolutionStage || 0;
    return {
      damage: Math.round(
        type.damage *
          (1 +
            skills.power * 0.27 +
            stage * 0.42 +
            (tower.type === "abra" ? skills.special * 0.1 : 0)),
      ),
      range:
        type.range +
        skills.range * 22 +
        stage * 24 +
        (tower.type === "piplup"
          ? skills.special * 10
          : tower.type === "rowlet"
            ? skills.special * 15
            : tower.type === "abra"
              ? skills.special * 12
              : 0),
      rate: Math.max(
        0.26,
        type.rate *
          (1 -
            skills.special * 0.065 -
            stage * 0.1 -
            (stage === 2 && tower.type === "eevee" ? 0.1 : 0)),
      ),
      splash: type.splash
        ? type.splash +
          skills.special * 14 +
          stage * 14 +
          (stage === 2 && ["charmander", "squirtle"].includes(tower.type) ? 24 : 0)
        : 0,
      slow: type.slow
        ? type.slow +
          skills.special * 0.35 +
          stage * 0.28 +
          (stage === 2 && tower.type === "bulbasaur" ? 0.55 : 0)
        : 0,
      attack: type.attack,
      projectileSpeed: type.projectileSpeed || 440,
      color: type.color,
      chains:
        type.attack === "lightning"
          ? 1 + skills.special + stage
          : 0,
      evolutionStage: stage,
    };
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
    return stage ? type.evolutions[stage - 1].name : type.name;
  }

  function getTowerImage(tower) {
    const type = TOWER_TYPES[tower.type];
    const stage = tower.evolutionStage || 0;
    const evolution = stage ? type.evolutions[stage - 1] : null;
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
    helperText.textContent = `${getTowerName(tower)} — ${stats.damage} כוח, ${stats.range} טווח. בחרו יכולת בלוח הגיבור!`;
  }

  function updateUpgradePanel() {
    if (!state) return;
    const tower = getSelectedPlacedTower();
    upgradePanel.hidden = !tower;
    if (!tower) return;
    const type = TOWER_TYPES[tower.type];
    const stats = getTowerStats(tower);
    tower.level = getTowerLevel(tower);
    upgradeBadge.textContent = `רמה ${tower.level}`;
    upgradeName.textContent = getTowerName(tower);
    upgradeStats.textContent = `${stats.damage} כוח · ${stats.range} טווח · ${(
      1 / stats.rate
    ).toFixed(1)} לשנייה`;
    const stage = tower.evolutionStage || 0;
    const nextEvolution = type.evolutions[stage];
    const portraitKey = stage ? type.evolutions[stage - 1].image : `${tower.type}Animated`;
    heroPortrait.src = assetUrls[portraitKey] || assetUrls[`${tower.type}Art`];
    specialAbilityIcon.textContent = type.special.icon;
    specialAbilityName.textContent = type.special.name;
    specialAbilityDetail.textContent = type.special.detail;
    const spent = getSpentAbilityPoints(tower);
    const requiredPoints = stage === 0 ? 3 : 6;
    evolutionDetail.textContent =
      stage >= 2
        ? "הצורה המרבית הושלמה"
        : stage === 1 && !state.finalEvolutionUnlocked
          ? "נצחו בוס לפתיחת הצורה הסופית"
          : spent >= requiredPoints
            ? `${nextEvolution.mastery ? "שליטה מלאה" : "התפתחות"}: ${nextEvolution.name}`
            : `דורש עוד ${requiredPoints - spent} שדרוגים`;

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
      button.disabled = maxed || locked || !affordable;
      button.classList.toggle("is-maxed", maxed);
      button.classList.toggle("is-locked", locked);
      button.classList.toggle("is-affordable", affordable);
      const ranks = button.querySelector(".ability-ranks");
      ranks.replaceChildren(
        ...Array.from({ length: maxRank }, (_, index) => {
          const pip = document.createElement("i");
          pip.classList.toggle("is-filled", index < rank);
          return pip;
        }),
      );
      const price = button.querySelector(".ability-price");
      price.textContent = maxed
        ? "מלא"
        : locked
          ? stage === 1 && !state.finalEvolutionUnlocked
            ? "דורש בוס"
            : `נעול ${spent}/${requiredPoints}`
          : String(cost);
      button.setAttribute(
        "aria-label",
        `${button.querySelector("strong").textContent}, דרגה ${rank} מתוך ${maxRank}${
          maxed ? ", מלא" : locked ? ", נעול" : `, מחיר ${cost} מטבעות`
        }`,
      );
    }
    const sellValue = Math.max(1, Math.floor((tower.spentCoins || type.cost) * 0.65));
    sellTowerValue.textContent = String(sellValue);
    moveTowerButton.classList.toggle("is-active", state.movingTowerId === tower.id);
    moveTowerButton.textContent =
      state.movingTowerId === tower.id ? "✕ ביטול הזזה" : "↔ הזזה";
  }

  function purchaseAbility(ability) {
    const tower = getSelectedPlacedTower();
    if (!tower || !state.running || state.over) return;
    const isEvolution = ability === "evolution";
    const spent = getSpentAbilityPoints(tower);
    const stage = tower.evolutionStage || 0;
    const requiredPoints = stage === 0 ? 3 : 6;
    if (isEvolution && stage >= 2) {
      showToast("הפוקימון כבר הגיע לצורה המרבית!");
      return;
    }
    if (isEvolution && stage === 1 && !state.finalEvolutionUnlocked) {
      showToast("צריך להביס את הבוס הראשון!");
      return;
    }
    if (isEvolution && spent < requiredPoints) {
      showToast(`צריך עוד ${requiredPoints - spent} שדרוגי יכולת`);
      return;
    }
    if (!isEvolution && tower.skills[ability] >= 3) {
      showToast("היכולת כבר בדרגה המרבית!");
      return;
    }
    const cost = getAbilityCost(tower, ability);
    if (state.coins < cost) {
      showToast(`חסרים ${cost - state.coins} מטבעות`);
      playTone(145, 0.07, "square", 0.018);
      return;
    }
    state.coins -= cost;
    tower.spentCoins += cost;
    if (isEvolution) tower.evolutionStage += 1;
    else tower.skills[ability] += 1;
    tower.level = getTowerLevel(tower);
    const maxEvolution = isEvolution && tower.evolutionStage === 2;
    tower.upgradeAnim = 1;
    tower.evolving = isEvolution ? 1 : 0;
    tower.cooldown = Math.min(tower.cooldown, 0.15);
    state.shake = Math.max(state.shake, maxEvolution ? 14 : isEvolution ? 9 : 2.5);
    state.effects.push({
      type: isEvolution ? "evolution" : "upgrade",
      x: tower.x,
      y: tower.y,
      life: maxEvolution ? 1.8 : isEvolution ? 1.35 : 0.85,
      maxLife: maxEvolution ? 1.8 : isEvolution ? 1.35 : 0.85,
      maxTier: maxEvolution,
      color: TOWER_TYPES[tower.type].color,
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
        text: maxed ? `צורה מרבית: ${evolvedName}!` : `הפוקימון התפתח ל${evolvedName}!`,
        time: maxed ? 3.2 : 2.6,
      };
      addFloat(tower.x, tower.y - 48, maxed ? "צורה מרבית!" : `התפתח ל${evolvedName}!`, "#fff27a");
    } else {
      const abilityNames = {
        power: "עוצמה",
        range: "טווח",
        special: TOWER_TYPES[tower.type].special.name,
      };
      addFloat(
        tower.x,
        tower.y - 48,
        `${abilityNames[ability]} ${tower.skills[ability]}`,
        "#fff27a",
      );
    }
    updateSelectedTowerHelper(tower);
    playTone(520, 0.08, "sine", 0.04);
    setTimeout(() => playTone(700, 0.09, "sine", 0.04), 70);
    setTimeout(() => playTone(900, 0.13, "sine", 0.04), 145);
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
      const progress = enemy.segment + distanceAlongCurrentSegment(enemy);
      if (progress > furthest) {
        furthest = progress;
        chosen = enemy;
      }
    }
    return chosen;
  }

  function distanceAlongCurrentSegment(enemy) {
    const start = PATH[enemy.segment];
    const end = PATH[enemy.segment + 1];
    if (!start || !end) return 1;
    const full = Math.hypot(end.x - start.x, end.y - start.y);
    const done = Math.hypot(enemy.x - start.x, enemy.y - start.y);
    return full ? done / full : 1;
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
      damageEnemy(enemy, stats.damage * (index === 0 ? 1 : 0.62), true, stats.attack);
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
    playTone(720 + Math.random() * 120, 0.045, "square", 0.018);
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
      color: stats.color,
      level: tower.level,
      evolutionStage: tower.evolutionStage || 0,
      life: 2,
      trail: 0,
    });
    playTone(230, 0.06, "sine", 0.018);
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
            damageEnemy(enemy, projectile.damage, true, projectile.style);
            enemy.slow = Math.max(enemy.slow, projectile.slow || 0);
          }
        }
        playTone(155, 0.09, "triangle", 0.027);
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
      if (Math.random() < 0.18) addFloat(enemy.x, enemy.y - 42, "סופר יעיל!", "#fff27a");
    }
    if (enemy.shielded) finalAmount *= 0.38;
    enemy.health -= finalAmount;
    enemy.hit = 1;
    if (enemy.abilityState === "מרפא...") {
      enemy.healInterruptDamage += finalAmount;
      if (enemy.healInterruptDamage >= enemy.maxHealth * 0.04) {
        enemy.abilityState = "הריפוי נעצר!";
        enemy.abilityTime = 0.8;
        addFloat(enemy.x, enemy.y - 44, "הריפוי נעצר!", "#fff27a");
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
      state.bossesDefeated += 1;
      state.finalEvolutionUnlocked = true;
      profile.bossStars += 1;
      saveProfile();
      state.banner = { text: `⭐ ${enemy.name} הובס! הצורות הסופיות נפתחו`, time: 3.2 };
      burst(enemy.x, enemy.y, "#fff27a", 58, 250);
    }
    addFloat(enemy.x, enemy.y - 18, `+${reward}`, "#ffe86b");
    if (state.combo >= 3) {
      addFloat(enemy.x, enemy.y - 42, `רצף x${state.combo}!`, "#9ff8ff");
    }
    burst(enemy.x, enemy.y, "#b991df", 14, 125);
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
    updateUpgradePanel();
    updatePowerUi();
    updateHud();
    updateWaveUi();
    profile.bestWave = Math.max(profile.bestWave, state.wave);
    saveProfile();
    clearRunCheckpoint();
    finalWave.textContent = String(state.wave);
    gameOverRewards.textContent =
      `אספתם ${state.bossesDefeated} כוכבי בוס וגיליתם ${state.newDiscoveries} פוקימונים חדשים בריצה הזאת.`;
    gameOverPanel.classList.remove("is-hidden");
    playTone(220, 0.18, "sine", 0.045);
    setTimeout(() => playTone(165, 0.28, "sine", 0.045), 160);
  }

  function placeTower(x, y) {
    if (!state.running || state.over) return;
    const cell = snapToCell(x, y);
    const type = TOWER_TYPES[selectedTower];
    if (!isInsideField(cell.x, cell.y)) {
      showToast("לחצו בתוך אזור הדשא");
      return;
    }
    if (distanceToPath(cell.x, cell.y) < PATH_WIDTH / 2 + 34) {
      rejectPlacement(cell.x, cell.y, "צריך להשאיר את השביל פנוי!");
      return;
    }
    if (isTerrainBlocked(cell.x, cell.y)) {
      rejectPlacement(cell.x, cell.y, "אי אפשר להציב על מים, עצים או צוקים");
      return;
    }
    const occupied = state.towers.find((tower) => tower.x === cell.x && tower.y === cell.y);
    if (occupied) {
      selectPlacedTower(occupied);
      return;
    }
    if (state.coins < type.cost) {
      rejectPlacement(cell.x, cell.y, `חסרים ${type.cost - state.coins} מטבעות`);
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
    state.selectedTowerId = tower.id;
    burst(cell.x, cell.y, type.color, 18, 115);
    addFloat(cell.x, cell.y - 36, type.name, "#fff");
    playTone(selectedTower === "pikachu" ? 640 : 390, 0.1, "sine", 0.035);
    updateHud();
    saveRunCheckpoint();
  }

  function selectPlacedTower(tower) {
    state.selectedTowerId = tower.id;
    updateSelectedTowerHelper(tower);
    updateUpgradePanel();
    saveRunCheckpoint();
    playTone(480 + tower.level * 80, 0.055, "sine", 0.02);
  }

  function toggleMoveTower() {
    const tower = getSelectedPlacedTower();
    if (!tower || !state.running || state.over) return;
    state.movingTowerId = state.movingTowerId === tower.id ? null : tower.id;
    helperText.textContent = state.movingTowerId
      ? "בחרו משבצת דשא חדשה — ההזזה בחינם."
      : "ההזזה בוטלה.";
    updateUpgradePanel();
  }

  function sellSelectedTower() {
    const tower = getSelectedPlacedTower();
    if (!tower || !state.running || state.over) return;
    const refund = Math.max(1, Math.floor((tower.spentCoins || TOWER_TYPES[tower.type].cost) * 0.65));
    state.coins += refund;
    state.towers = state.towers.filter((candidate) => candidate.id !== tower.id);
    state.selectedTowerId = null;
    state.movingTowerId = null;
    burst(tower.x, tower.y, "#ffe66c", 22, 150);
    addFloat(tower.x, tower.y - 35, `+${refund}`, "#ffe66c");
    showToast(`הפוקימון נמכר ב-${refund} מטבעות`);
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
      rejectPlacement(cell.x, cell.y, "בחרו משבצת דשא פנויה");
      return;
    }
    tower.x = cell.x;
    tower.y = cell.y;
    tower.placed = 1;
    state.movingTowerId = null;
    burst(cell.x, cell.y, TOWER_TYPES[tower.type].color, 20, 125);
    showToast("הפוקימון עבר למקום חדש!");
    updateSelectedTowerHelper(tower);
    updateUpgradePanel();
    saveRunCheckpoint();
  }

  function handleFieldTap(x, y) {
    if (!state.running || state.over) return;
    if (state.movingTowerId) {
      tryMoveTower(x, y);
      return;
    }
    const tappedTower = state.towers.find(
      (tower) => Math.hypot(tower.x - x, tower.y - y) <= 43,
    );
    if (tappedTower) {
      selectPlacedTower(tappedTower);
      return;
    }
    state.selectedTowerId = null;
    updateUpgradePanel();
    placeTower(x, y);
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
    return x >= 40 && x <= WIDTH - 40 && y >= 160 && y <= HEIGHT - 40;
  }

  function isTerrainBlocked(x, y) {
    return TERRAIN_BLOCKERS.some((area) => {
      const dx = (x - area.x) / (area.rx + 36);
      const dy = (y - area.y) / (area.ry + 36);
      return dx * dx + dy * dy < 1;
    });
  }

  function distanceToPath(x, y) {
    let minimum = Infinity;
    for (let i = 0; i < PATH.length - 1; i += 1) {
      minimum = Math.min(minimum, pointSegmentDistance(x, y, PATH[i], PATH[i + 1]));
    }
    return minimum;
  }

  function pointSegmentDistance(px, py, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared
      ? Math.max(0, Math.min(1, ((px - start.x) * dx + (py - start.y) * dy) / lengthSquared))
      : 0;
    return Math.hypot(px - (start.x + t * dx), py - (start.y + t * dy));
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

    const shakeX = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    const shakeY = state.shake ? (Math.random() - 0.5) * state.shake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawField();
    drawPath();
    drawScenery();
    drawPlacementPreview();
    drawGoal();
    drawTowers();
    drawEnemies();
    drawProjectiles();
    drawEffects();
    ctx.restore();
    drawBanner();
    drawCombo();
  }

  function drawField() {
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#77cf65");
    gradient.addColorStop(1, "#43a952");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const tiles = [images.grass, images.grassFlowers, images.grassDetails].filter(Boolean);
    if (tiles.length) {
      ctx.save();
      ctx.globalAlpha = 0.34;
      for (let y = 0; y < HEIGHT; y += 128) {
        for (let x = 0; x < WIDTH; x += 128) {
          const tile = tiles[(x / 128 + (y / 128) * 3) % tiles.length];
          ctx.drawImage(tile, x, y, 130, 130);
        }
      }
      ctx.restore();
    } else {
      ctx.fillStyle = "rgba(20, 112, 56, 0.12)";
      for (let y = 14; y < HEIGHT; y += 34) {
        for (let x = (y / 34) % 2 ? 12 : 28; x < WIDTH; x += 42) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    drawTerrainFeatures();
    if (state.waveActive && state.isBossWave) {
      const pulse = 0.07 + Math.sin(state.elapsed * 2.4) * 0.025;
      ctx.fillStyle = `rgba(91, 38, 98, ${pulse})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  function drawTerrainFeatures() {
    for (const area of TERRAIN_BLOCKERS) {
      ctx.save();
      ctx.translate(area.x, area.y);
      if (area.type === "lake" || area.type === "pond") {
        ctx.fillStyle = "rgba(25, 105, 100, .28)";
        ctx.beginPath();
        ctx.ellipse(0, 8, area.rx + 12, area.ry + 12, 0, 0, Math.PI * 2);
        ctx.fill();
        const water = ctx.createLinearGradient(0, -area.ry, 0, area.ry);
        water.addColorStop(0, "#7be4e6");
        water.addColorStop(1, "#3ba4c8");
        ctx.fillStyle = water;
        ctx.beginPath();
        ctx.ellipse(0, 0, area.rx, area.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.45)";
        ctx.lineWidth = 5;
        for (let i = -1; i <= 1; i += 1) {
          ctx.beginPath();
          ctx.ellipse(
            Math.sin(state.elapsed * 0.8 + i) * 10,
            i * area.ry * 0.34,
            area.rx * (0.42 + i * 0.06),
            8,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
      } else if (area.type === "cliff") {
        ctx.fillStyle = "#8d7555";
        ctx.beginPath();
        ctx.ellipse(0, 12, area.rx, area.ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#b89a6c";
        ctx.beginPath();
        ctx.ellipse(0, 0, area.rx, area.ry * 0.68, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(82, 61, 42, .38)";
        ctx.lineWidth = 6;
        for (let x = -90; x <= 90; x += 45) {
          ctx.beginPath();
          ctx.moveTo(x, 12);
          ctx.lineTo(x + 14, 48);
          ctx.stroke();
        }
      } else {
        for (let i = 0; i < 8; i += 1) {
          const angle = (i / 8) * Math.PI * 2;
          const radius = i % 2 ? area.rx * 0.62 : area.rx * 0.82;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * area.ry * 0.72;
          ctx.fillStyle = "#6b4b2d";
          ctx.fillRect(x - 6, y, 12, 35);
          ctx.fillStyle = i % 2 ? "#237d49" : "#2f9a51";
          ctx.beginPath();
          ctx.arc(x, y - 10, 28, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  function tracePath() {
    ctx.beginPath();
    ctx.moveTo(PATH[0].x, PATH[0].y);
    for (let i = 1; i < PATH.length - 1; i += 1) {
      const current = PATH[i];
      const next = PATH[i + 1];
      ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
    }
    const last = PATH[PATH.length - 1];
    ctx.lineTo(last.x, last.y);
  }

  function drawPath() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    tracePath();
    ctx.strokeStyle = "rgba(30, 83, 43, 0.28)";
    ctx.lineWidth = PATH_WIDTH + 22;
    ctx.stroke();
    tracePath();
    ctx.strokeStyle = "#e1b56a";
    ctx.lineWidth = PATH_WIDTH + 12;
    ctx.stroke();
    tracePath();
    const pathGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    pathGradient.addColorStop(0, "#f4d28a");
    pathGradient.addColorStop(0.52, "#e9bd72");
    pathGradient.addColorStop(1, "#f5d895");
    ctx.strokeStyle = pathGradient;
    ctx.lineWidth = PATH_WIDTH;
    ctx.stroke();
    tracePath();
    ctx.setLineDash([5, 24]);
    ctx.lineDashOffset = -state.elapsed * 11;
    ctx.strokeStyle = "rgba(150, 98, 45, 0.19)";
    ctx.lineWidth = PATH_WIDTH - 16;
    ctx.stroke();
    ctx.restore();
  }

  function drawScenery() {
    const flowers = [
      [77, 321, "#fff"], [336, 125, "#ffeb75"], [411, 581, "#ff92b5"],
      [680, 345, "#fff"], [695, 539, "#ffe275"], [893, 362, "#ff9ab9"],
      [317, 316, "#d9b6ff"], [608, 662, "#d9b6ff"], [116, 559, "#fff"],
      [1035, 255, "#fff"], [1102, 438, "#ffe275"], [798, 640, "#ff92b5"],
      [1220, 420, "#ff92b5"], [1450, 430, "#fff"], [1360, 840, "#ffe275"],
      [1030, 845, "#d9b6ff"], [1540, 190, "#ff92b5"], [620, 170, "#fff"],
    ];
    for (const [x, y, color] of flowers) {
      const sway = Math.sin(state.elapsed * 1.7 + x) * 1.6;
      ctx.save();
      ctx.translate(x + sway, y);
      ctx.strokeStyle = "#278c46";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(0, -3);
      ctx.stroke();
      ctx.fillStyle = color;
      for (let i = 0; i < 5; i += 1) {
        const angle = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 5, -6 + Math.sin(angle) * 5, 3.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#ffb52e";
      ctx.beginPath();
      ctx.arc(0, -6, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const pollenCount = 18;
    ctx.fillStyle = "rgba(255, 249, 167, 0.55)";
    for (let i = 0; i < pollenCount; i += 1) {
      const x = (i * 83 + state.elapsed * (6 + (i % 3))) % (WIDTH + 40) - 20;
      const y = 105 + ((i * 131 + Math.sin(state.elapsed + i) * 38) % 680);
      ctx.beginPath();
      ctx.arc(x, y, 1.8 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlacementPreview() {
    if (!state.running || state.over) return;
    const selected = getSelectedPlacedTower();
    if (selected) {
      const stats = getTowerStats(selected);
      const pulse = 0.5 + Math.sin(state.elapsed * 3.5) * 0.08;
      ctx.save();
      ctx.fillStyle = `rgba(83, 174, 255, ${pulse * 0.2})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulse + 0.3})`;
      ctx.lineWidth = 4;
      ctx.setLineDash([12, 7]);
      ctx.lineDashOffset = -state.elapsed * 18;
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
    const type = TOWER_TYPES[selectedTower];
    if (state.towers.some((tower) => tower.x === hoverCell.x && tower.y === hoverCell.y)) {
      return;
    }
    const valid =
      isInsideField(hoverCell.x, hoverCell.y) &&
      distanceToPath(hoverCell.x, hoverCell.y) >= PATH_WIDTH / 2 + 34 &&
      !isTerrainBlocked(hoverCell.x, hoverCell.y) &&
      !state.towers.some((tower) => tower.x === hoverCell.x && tower.y === hoverCell.y) &&
      state.coins >= type.cost;
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
    ctx.restore();
  }

  function drawGoal() {
    const x = 1535;
    const y = 770;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(29, 72, 51, 0.24)";
    ctx.beginPath();
    ctx.ellipse(0, 34, 48, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c67d32";
    roundRect(ctx, -36, -4, 72, 54, 12);
    ctx.fill();
    ctx.strokeStyle = "#824d24";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = "#f0b35c";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, 29, Math.PI, 0);
    ctx.stroke();
    const berryColors = ["#e84868", "#7d4cc7", "#edcf4e", "#e84868", "#7d4cc7"];
    berryColors.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(-24 + index * 12, -5 - (index % 2) * 6, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3d9b48";
      ctx.fillRect(-25 + index * 12, -17 - (index % 2) * 5, 3, 7);
    });
    ctx.restore();
  }

  function drawTowers() {
    for (const tower of state.towers) {
      const evolutionStage = tower.evolutionStage || 0;
      const bob = Math.sin(state.elapsed * 3 + tower.phase) * 2.5;
      const squash = tower.anim ? 1 + tower.anim * 0.16 : 1;
      const placementProgress = 1 - tower.placed;
      const placementScale =
        tower.placed > 0
          ? placementProgress + Math.sin(placementProgress * Math.PI) * 0.38
          : 1;
      const upgradeScale = 1 + Math.sin(tower.upgradeAnim * Math.PI * 4) * tower.upgradeAnim * 0.12;
      const evolutionScale =
        1 + Math.sin((1 - tower.evolving) * Math.PI * 7) * tower.evolving * 0.16;
      const image = getTowerImage(tower);
      ctx.save();
      ctx.translate(tower.x, tower.y + bob);
      if (tower.anim > 0) {
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
        const scale = (tower.type === "pikachu" ? 1.25 : 1.35) + evolutionStage * 0.1;
        drawContainedImage(image, -43 * scale, -52 * scale, 86 * scale, 86 * scale);
      } else {
        drawFallbackPokemon(tower.type);
      }
      ctx.restore();
      ctx.textAlign = "center";
      ctx.font = "900 16px Trebuchet MS, sans-serif";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(25, 66, 52, .72)";
      ctx.fillStyle = "#fff176";
      const stars = tower.level > 5 ? `★★★★★ ${tower.level}` : "★".repeat(tower.level);
      ctx.strokeText(stars, 0, -53);
      ctx.fillText(stars, 0, -53);
      ctx.restore();
    }
  }

  function drawEnemies() {
    for (const enemy of state.enemies) {
      const image = images[enemy.image] || images.zubatAnimated || images.zubatArt;
      const bob = Math.sin(state.elapsed * 7 + enemy.bob) * 5;
      const next = PATH[enemy.segment + 1] || PATH[enemy.segment];
      const lean = next ? Math.max(-0.22, Math.min(0.22, (next.x - enemy.x) / 350)) : 0;
      ctx.save();
      ctx.translate(enemy.x, enemy.y + bob);
      if (enemy.spawnAnim > 0) {
        const entrance = 1 - enemy.spawnAnim;
        const entranceScale = Math.max(0.15, entrance + Math.sin(entrance * Math.PI) * 0.35);
        ctx.scale(entranceScale, entranceScale);
      }
      if (enemy.phased) ctx.globalAlpha = 0.3;
      if (enemy.hit > 0) {
        ctx.translate(Math.sin(enemy.hit * 42) * enemy.hit * 5, 0);
        ctx.scale(1 + enemy.hit * 0.08, 1 - enemy.hit * 0.06);
      }
      ctx.rotate(lean);
      if (enemy.modifier === "מהיר") {
        ctx.strokeStyle = "rgba(134, 235, 255, .5)";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-enemy.radius * 1.8, -8);
        ctx.lineTo(-enemy.radius * 3.1, -8);
        ctx.moveTo(-enemy.radius * 1.5, 8);
        ctx.lineTo(-enemy.radius * 2.6, 8);
        ctx.stroke();
      }
      if (enemy.modifier === "משוריין") {
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
      ctx.ellipse(0, 27 - bob, 25, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      if (enemy.hit > 0) {
        ctx.globalAlpha = 0.68 + Math.sin(enemy.hit * 30) * 0.26;
      }
      if (image) {
        const spriteSize = Math.max(70, enemy.radius * 3.25);
        drawContainedImage(image, -spriteSize / 2, -spriteSize * 0.58, spriteSize, spriteSize);
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
          drawFallbackPokemon("zubat");
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

  function drawFallbackPokemon(type) {
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
    ctx.fillStyle = TOWER_TYPES[type]?.color || "#ef8241";
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
    const width = 52;
    ctx.fillStyle = "rgba(30, 42, 44, .72)";
    roundRect(ctx, -width / 2 - 2, -48, width + 4, 10, 5);
    ctx.fill();
    ctx.fillStyle = enemy.health / enemy.maxHealth > 0.45 ? "#66dc69" : "#ff705f";
    roundRect(ctx, -width / 2, -46, Math.max(0, width * (enemy.health / enemy.maxHealth)), 6, 3);
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
    ctx.translate(WIDTH / 2, 142);
    ctx.scale(scale, scale);
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
    ctx.translate(WIDTH / 2, HEIGHT - 38);
    ctx.scale(pulse, pulse);
    ctx.textAlign = "center";
    ctx.font = `900 ${28 + Math.min(16, state.combo * 1.5)}px Arial, sans-serif`;
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(27, 67, 61, .78)";
    ctx.fillStyle = state.combo >= 6 ? "#fff06b" : "#9ff8ff";
    const text = `רצף x${state.combo}`;
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
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
        ? BOSS_STAGES[(nextWave / 5 - 1) % BOSS_STAGES.length]
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
    bossHealth.hidden = !activeBoss;
    if (activeBoss) {
      const healthPercent = Math.max(0, (activeBoss.health / activeBoss.maxHealth) * 100);
      bossHealthName.textContent = `${activeBoss.name} · חלש ל${activeBoss.bossData.weaknessLabel}`;
      bossHealthStatus.textContent = activeBoss.abilityState
        ? activeBoss.abilityState
        : `יכולת בעוד ${Math.max(1, Math.ceil(activeBoss.abilityTimer))}`;
      bossHealthFill.style.width = `${healthPercent}%`;
    }
    if (state.waveActive) {
      waveEnemyName.textContent = state.isBossWave
        ? `גל ${state.wave}: בוס ${type.name}`
        : `גל ${state.wave}: ${type.name} · ${modifier.icon} ${modifier.name}`;
      waveStatus.textContent = state.isBossWave
        ? `חלש ל${type.weaknessLabel} · ${type.mechanic}`
        : `${state.enemiesCompleted}/${state.enemiesToSpawn} נעצרו`;
      const progress = activeBoss
        ? (1 - activeBoss.health / activeBoss.maxHealth) * 100
        : state.enemiesToSpawn
          ? (state.enemiesCompleted / state.enemiesToSpawn) * 100
          : 0;
      waveProgressFill.style.width = `${Math.min(100, progress)}%`;
      startWaveButton.hidden = true;
    } else {
      waveEnemyName.textContent = previewBoss
        ? `הגל הבא: בוס ${type.name}!`
        : `הגל הבא: ${type.name} · ${modifier.icon} ${modifier.name}`;
      waveStatus.textContent = state.running
        ? previewBoss
          ? `חלש ל${type.weaknessLabel} · ${type.mechanic}`
          : `מתחיל בעוד ${Math.max(1, Math.ceil(state.waveTimer))}...`
        : "מתכוננים...";
      waveProgressFill.style.width = "0%";
      const canStartEarly = state.running && !state.over && state.wave > 0 && state.waveTimer > 0;
      startWaveButton.hidden = !canStartEarly;
      if (canStartEarly) {
        earlyWaveBonus.textContent = `בונוס ${Math.max(2, Math.ceil(state.waveTimer) * 2)} מטבעות`;
      }
    }
  }

  function startWaveEarly() {
    if (!state.running || state.waveActive || state.wave <= 0 || state.waveTimer <= 0) return;
    const bonus = Math.max(2, Math.ceil(state.waveTimer) * 2);
    state.coins += bonus;
    state.waveTimer = 0;
    state.banner = { text: `הקדמתם את הגל! ${bonus}+ מטבעות`, time: 2 };
    playTone(620, 0.08, "sine", 0.035);
    updateHud();
    updateWaveUi();
  }

  function updateSpeedUi() {
    speedButton.textContent = `${state.gameSpeed}×`;
    speedButton.setAttribute("aria-pressed", String(state.gameSpeed === 2));
    speedButton.setAttribute(
      "aria-label",
      state.gameSpeed === 1 ? "מעבר למהירות משחק כפולה" : "חזרה למהירות משחק רגילה",
    );
  }

  function toggleGameSpeed() {
    state.gameSpeed = state.gameSpeed === 1 ? 2 : 1;
    profile.gameSpeed = state.gameSpeed;
    saveProfile();
    updateSpeedUi();
    showToast(state.gameSpeed === 2 ? "מהירות כפולה!" : "מהירות רגילה");
    playTone(state.gameSpeed === 2 ? 720 : 480, 0.07, "sine", 0.025);
  }

  function updatePowerUi() {
    const ready = state.power >= 100 && state.running && state.enemies.length > 0;
    powerButton.style.setProperty("--charge", `${state.power}%`);
    powerLabel.textContent = ready ? "מוכן!" : `${Math.round(state.power)}%`;
    powerButton.disabled = !ready;
    powerButton.classList.toggle("is-ready", ready);
    powerButton.setAttribute(
      "aria-label",
      ready ? "הפעלת כוח פוקימון" : `כוח פוקימון טעון ב-${Math.round(state.power)} אחוז`,
    );
  }

  function usePokePower() {
    if (state.power < 100 || !state.running || state.enemies.length === 0) return;
    state.power = 0;
    state.combo = Math.max(2, state.combo);
    state.comboTimer = 3;
    state.shake = 13;
    state.banner = { text: "כוח פוקימון!", time: 2.2 };
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
    playTone(330, 0.12, "sine", 0.055);
    setTimeout(() => playTone(550, 0.16, "triangle", 0.055), 90);
    setTimeout(() => playTone(880, 0.25, "sine", 0.05), 180);
    updateHud();
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1500);
  }

  function selectTower(type) {
    selectedTower = type;
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
    helperText.textContent = `${TOWER_TYPES[type].name} נבחר — לחצו על משבצת דשא כדי להציב אותו.`;
    ensureAudio();
    playTone(type === "pikachu" ? 620 : 360, 0.06, "sine", 0.025);
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    };
  }

  function ensureAudio() {
    if (!soundEnabled || audioContext) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audioContext = new AudioContext();
  }

  function playTone(frequency, duration, wave = "sine", volume = 0.025) {
    if (!soundEnabled) return;
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
    soundEnabled = !soundEnabled;
    profile.soundEnabled = soundEnabled;
    saveProfile();
    updateSoundUi();
    if (soundEnabled) {
      ensureAudio();
      playTone(620, 0.08, "sine", 0.03);
    }
  }

  function updateSoundUi() {
    soundButton.textContent = soundEnabled ? "🔊" : "🔇";
    soundButton.setAttribute("aria-label", soundEnabled ? "השתקת צלילים" : "הפעלת צלילים");
    soundButton.setAttribute("aria-pressed", String(!soundEnabled));
  }

  function showTutorial(index) {
    tutorialIndex = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, index));
    const [title, text] = TUTORIAL_STEPS[tutorialIndex];
    state.tutorialActive = true;
    tutorialPanel.hidden = false;
    tutorialStep.textContent = `${tutorialIndex + 1} / ${TUTORIAL_STEPS.length}`;
    tutorialTitle.textContent = title;
    tutorialText.textContent = text;
    document.getElementById("tutorialNext").textContent =
      tutorialIndex === TUTORIAL_STEPS.length - 1 ? "מתחילים!" : "הבא";
  }

  function finishTutorial() {
    tutorialPanel.hidden = true;
    state.tutorialActive = false;
    profile.tutorialComplete = true;
    saveProfile();
    state.banner = { text: "ההרפתקה מתחילה!", time: 2 };
  }

  function advanceTutorial() {
    if (tutorialIndex >= TUTORIAL_STEPS.length - 1) {
      finishTutorial();
      return;
    }
    showTutorial(tutorialIndex + 1);
  }

  canvas.addEventListener("pointermove", (event) => {
    const point = pointerPosition(event);
    hoverCell = snapToCell(point.x, point.y);
  });
  canvas.addEventListener("pointerleave", () => {
    hoverCell = null;
  });
  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    ensureAudio();
    const point = pointerPosition(event);
    hoverCell = snapToCell(point.x, point.y);
    handleFieldTap(point.x, point.y);
  });
  abilityButtons.forEach((button) =>
    button.addEventListener("click", () => purchaseAbility(button.dataset.ability)),
  );
  powerButton.addEventListener("click", usePokePower);
  startWaveButton.addEventListener("click", startWaveEarly);
  moveTowerButton.addEventListener("click", toggleMoveTower);
  sellTowerButton.addEventListener("click", sellSelectedTower);
  speedButton.addEventListener("click", toggleGameSpeed);
  openShopButton.addEventListener("click", () => {
    renderTowerShop(activeShopFilter);
    towerShop.hidden = false;
  });
  closeShopButton.addEventListener("click", () => {
    towerShop.hidden = true;
  });
  towerShop.addEventListener("click", (event) => {
    if (event.target === towerShop) towerShop.hidden = true;
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
    startGame();
  });
  soundButton.addEventListener("click", toggleSound);
  document.addEventListener("visibilitychange", () => {
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

  resetGame();
  loadAssets();
  requestAnimationFrame(frame);
})();

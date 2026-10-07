(() => {
  "use strict";

  const species = [
    ["bulbasaur", 1, "Bulbasaur", "בולבזור", "妙蛙种子"],
    ["ivysaur", 2, "Ivysaur", "אייביזור", "妙蛙草"],
    ["venusaur", 3, "Venusaur", "ונוסאור", "妙蛙花"],
    ["charmander", 4, "Charmander", "צ׳רמנדר", "小火龙"],
    ["charmeleon", 5, "Charmeleon", "צ׳רמיליון", "火恐龙"],
    ["charizard", 6, "Charizard", "צ׳ריזארד", "喷火龙"],
    ["squirtle", 7, "Squirtle", "סקווירטל", "杰尼龟"],
    ["wartortle", 8, "Wartortle", "וורטורטל", "卡咪龟"],
    ["blastoise", 9, "Blastoise", "בלסטויז", "水箭龟"],
    ["caterpie", 10, "Caterpie", "קטרפי", "绿毛虫"],
    ["metapod", 11, "Metapod", "מטפוד", "铁甲蛹"],
    ["butterfree", 12, "Butterfree", "באטרפרי", "巴大蝶"],
    ["weedle", 13, "Weedle", "וידל", "独角虫"],
    ["kakuna", 14, "Kakuna", "קקונה", "铁壳蛹"],
    ["beedrill", 15, "Beedrill", "בידריל", "大针蜂"],
    ["pidgey", 16, "Pidgey", "פידג׳י", "波波"],
    ["pidgeotto", 17, "Pidgeotto", "פידג׳וטו", "比比鸟"],
    ["pidgeot", 18, "Pidgeot", "פידג׳וט", "大比鸟"],
    ["rattata", 19, "Rattata", "רטטה", "小拉达"],
    ["raticate", 20, "Raticate", "רטיקייט", "拉达"],
    ["pikachu", 25, "Pikachu", "פיקאצ׳ו", "皮卡丘"],
    ["raichu", 26, "Raichu", "ראיצ׳ו", "雷丘"],
    ["vulpix", 37, "Vulpix", "וולפיקס", "六尾"],
    ["ninetales", 38, "Ninetales", "ניינטיילס", "九尾"],
    ["zubat", 41, "Zubat", "זובט", "超音蝠"],
    ["golbat", 42, "Golbat", "גולבט", "大嘴蝠"],
    ["psyduck", 54, "Psyduck", "פסיידאק", "可达鸭"],
    ["golduck", 55, "Golduck", "גולדאק", "哥达鸭"],
    ["growlithe", 58, "Growlithe", "גראולית׳", "卡蒂狗"],
    ["arcanine", 59, "Arcanine", "ארקניין", "风速狗"],
    ["poliwag", 60, "Poliwag", "פוליוואג", "蚊香蝌蚪"],
    ["poliwhirl", 61, "Poliwhirl", "פוליווירל", "蚊香君"],
    ["poliwrath", 62, "Poliwrath", "פוליראת׳", "蚊香泳士"],
    ["abra", 63, "Abra", "אברה", "凯西"],
    ["kadabra", 64, "Kadabra", "קדברה", "勇基拉"],
    ["alakazam", 65, "Alakazam", "אלאקזם", "胡地"],
    ["machop", 66, "Machop", "מאצ׳ופ", "腕力"],
    ["machoke", 67, "Machoke", "מאצ׳וק", "豪力"],
    ["machamp", 68, "Machamp", "מאצ׳אמפ", "怪力"],
    ["geodude", 74, "Geodude", "ג׳יאודוד", "小拳石"],
    ["graveler", 75, "Graveler", "גרבלר", "隆隆石"],
    ["golem", 76, "Golem", "גולם", "隆隆岩"],
    ["slowpoke", 79, "Slowpoke", "סלואופוק", "呆呆兽"],
    ["slowbro", 80, "Slowbro", "סלואוברו", "呆壳兽"],
    ["magnemite", 81, "Magnemite", "מגנמייט", "小磁怪"],
    ["magneton", 82, "Magneton", "מגנטון", "三合一磁怪"],
    ["gastly", 92, "Gastly", "גסטלי", "鬼斯"],
    ["haunter", 93, "Haunter", "האנטר", "鬼斯通"],
    ["gengar", 94, "Gengar", "גנגר", "耿鬼"],
    ["onix", 95, "Onix", "אוניקס", "大岩蛇"],
    ["rhyhorn", 111, "Rhyhorn", "רייהורן", "独角犀牛"],
    ["rhydon", 112, "Rhydon", "ריידון", "钻角犀兽"],
    ["scyther", 123, "Scyther", "סייטר", "飞天螳螂"],
    ["magikarp", 129, "Magikarp", "מג׳יקארפ", "鲤鱼王"],
    ["gyarados", 130, "Gyarados", "גיארדוס", "暴鲤龙"],
    ["lapras", 131, "Lapras", "לאפרס", "拉普拉斯"],
    ["eevee", 133, "Eevee", "איבי", "伊布"],
    ["vaporeon", 134, "Vaporeon", "ופוריאון", "水伊布"],
    ["jolteon", 135, "Jolteon", "ג׳ולטיאון", "雷伊布"],
    ["flareon", 136, "Flareon", "פלריאון", "火伊布"],
    ["snorlax", 143, "Snorlax", "סנורלקס", "卡比兽"],
    ["articuno", 144, "Articuno", "ארטיקונו", "急冻鸟"],
    ["zapdos", 145, "Zapdos", "זאפדוס", "闪电鸟"],
    ["moltres", 146, "Moltres", "מולטרס", "火焰鸟"],
    ["dratini", 147, "Dratini", "דרטיני", "迷你龙"],
    ["dragonair", 148, "Dragonair", "דרגונייר", "哈克龙"],
    ["dragonite", 149, "Dragonite", "דרגונייט", "快龙"],
    ["mewtwo", 150, "Mewtwo", "מיוטו", "超梦"],
    ["mew", 151, "Mew", "מיו", "梦幻"],
    ["chikorita", 152, "Chikorita", "צ׳יקוריטה", "菊草叶"],
    ["bayleef", 153, "Bayleef", "בייליף", "月桂叶"],
    ["meganium", 154, "Meganium", "מגניום", "大竺葵"],
    ["sentret", 161, "Sentret", "סנטרט", "尾立"],
    ["furret", 162, "Furret", "פיורט", "大尾立"],
    ["hoothoot", 163, "Hoothoot", "הוטהוט", "咕咕"],
    ["noctowl", 164, "Noctowl", "נוקטאול", "猫头夜鹰"],
    ["crobat", 169, "Crobat", "קרובט", "叉字蝠"],
    ["togepi", 175, "Togepi", "טוגפי", "波克比"],
    ["togetic", 176, "Togetic", "טוגטיק", "波克基古"],
    ["espeon", 196, "Espeon", "אספיאון", "太阳伊布"],
    ["umbreon", 197, "Umbreon", "אמבריאון", "月亮伊布"],
    ["steelix", 208, "Steelix", "סטיליקס", "大钢蛇"],
    ["scizor", 212, "Scizor", "סיזור", "巨钳螳螂"],
    ["raikou", 243, "Raikou", "ראיקו", "雷公"],
    ["entei", 244, "Entei", "אנטיי", "炎帝"],
    ["suicune", 245, "Suicune", "סוויקון", "水君"],
    ["larvitar", 246, "Larvitar", "לרוויטר", "幼基拉斯"],
    ["pupitar", 247, "Pupitar", "פיופיטר", "沙基拉斯"],
    ["tyranitar", 248, "Tyranitar", "טיירניטר", "班基拉斯"],
    ["lugia", 249, "Lugia", "לוגיה", "洛奇亚"],
    ["hooh", 250, "Ho-Oh", "הו־או", "凤王"],
    ["celebi", 251, "Celebi", "סלבי", "时拉比"],
    ["torchic", 255, "Torchic", "טורצ׳יק", "火稚鸡"],
    ["combusken", 256, "Combusken", "קומבסקן", "力壮鸡"],
    ["blaziken", 257, "Blaziken", "בלייזיקן", "火焰鸡"],
    ["mudkip", 258, "Mudkip", "מדקיפ", "水跃鱼"],
    ["marshtomp", 259, "Marshtomp", "מרשטומפ", "沼跃鱼"],
    ["swampert", 260, "Swampert", "סוואמפרט", "巨沼怪"],
    ["poochyena", 261, "Poochyena", "פוצ׳יינה", "土狼犬"],
    ["mightyena", 262, "Mightyena", "מייטיינה", "大狼犬"],
    ["ralts", 280, "Ralts", "ראלטס", "拉鲁拉丝"],
    ["kirlia", 281, "Kirlia", "קירליה", "奇鲁莉安"],
    ["gardevoir", 282, "Gardevoir", "גרדבואר", "沙奈朵"],
    ["bagon", 371, "Bagon", "בייגון", "宝贝龙"],
    ["shelgon", 372, "Shelgon", "שלגון", "甲壳龙"],
    ["salamence", 373, "Salamence", "סלמנס", "暴飞龙"],
    ["beldum", 374, "Beldum", "בלדום", "铁哑铃"],
    ["metang", 375, "Metang", "מטאנג", "金属怪"],
    ["metagross", 376, "Metagross", "מטגרוס", "巨金怪"],
    ["kyogre", 382, "Kyogre", "קיוגר", "盖欧卡"],
    ["groudon", 383, "Groudon", "גראודון", "固拉多"],
    ["rayquaza", 384, "Rayquaza", "רייקוואזה", "烈空坐"],
    ["jirachi", 385, "Jirachi", "ג׳יראצ׳י", "基拉祈"],
    ["piplup", 393, "Piplup", "פיפלאפ", "波加曼"],
    ["prinplup", 394, "Prinplup", "פרינפלאפ", "波皇子"],
    ["empoleon", 395, "Empoleon", "אמפוליאון", "帝王拿波"],
    ["starly", 396, "Starly", "סטארלי", "姆克儿"],
    ["staravia", 397, "Staravia", "סטארביה", "姆克鸟"],
    ["staraptor", 398, "Staraptor", "סטארפטור", "姆克鹰"],
    ["bidoof", 399, "Bidoof", "בידוף", "大牙狸"],
    ["bibarel", 400, "Bibarel", "ביבראל", "大尾狸"],
    ["shinx", 403, "Shinx", "שינקס", "小猫怪"],
    ["luxio", 404, "Luxio", "לוקסיו", "勒克猫"],
    ["luxray", 405, "Luxray", "לוקסריי", "伦琴猫"],
    ["gible", 443, "Gible", "גיבל", "圆陆鲨"],
    ["gabite", 444, "Gabite", "גבייט", "尖牙陆鲨"],
    ["garchomp", 445, "Garchomp", "גארצ׳ומפ", "烈咬陆鲨"],
    ["riolu", 447, "Riolu", "ריולו", "利欧路"],
    ["lucario", 448, "Lucario", "לוקאריו", "路卡利欧"],
    ["magnezone", 462, "Magnezone", "מגנזון", "自爆磁怪"],
    ["rhyperior", 464, "Rhyperior", "רייפריור", "超甲狂犀"],
    ["togekiss", 468, "Togekiss", "טוגקיס", "波克基斯"],
    ["leafeon", 470, "Leafeon", "ליפיאון", "叶伊布"],
    ["glaceon", 471, "Glaceon", "גלסיאון", "冰伊布"],
    ["dialga", 483, "Dialga", "דיאלגה", "帝牙卢卡"],
    ["palkia", 484, "Palkia", "פאלקיה", "帕路奇亚"],
    ["giratina", 487, "Giratina", "גיראטינה", "骑拉帝纳"],
    ["arceus", 493, "Arceus", "ארכאוס", "阿尔宙斯"],
    ["patrat", 504, "Patrat", "פטרט", "探探鼠"],
    ["watchog", 505, "Watchog", "ווצ׳וג", "步哨鼠"],
    ["reshiram", 643, "Reshiram", "רשיראם", "莱希拉姆"],
    ["zekrom", 644, "Zekrom", "זקרום", "捷克罗姆"],
    ["fletchling", 661, "Fletchling", "פלצ׳לינג", "小箭雀"],
    ["fletchinder", 662, "Fletchinder", "פלצ׳ינדר", "火箭雀"],
    ["talonflame", 663, "Talonflame", "טלונפליים", "烈箭鹰"],
    ["sylveon", 700, "Sylveon", "סילביאון", "仙子伊布"],
    ["rowlet", 722, "Rowlet", "ראולט", "木木枭"],
    ["dartrix", 723, "Dartrix", "דרטריקס", "投羽枭"],
    ["decidueye", 724, "Decidueye", "דסידואיי", "狙射树枭"],
    ["yungoos", 734, "Yungoos", "יונגוס", "猫鼬少"],
    ["gumshoos", 735, "Gumshoos", "גאמשוס", "猫鼬探长"],
    ["skwovet", 819, "Skwovet", "סקוובט", "贪心栗鼠"],
    ["greedent", 820, "Greedent", "גרידנט", "藏饱栗鼠"],
    ["lechonk", 915, "Lechonk", "לצ׳ונק", "爱吃豚"],
    ["oinkologne", 916, "Oinkologne", "אוינקולון", "飘香豚"],
  ];
  const POKEMON = Object.fromEntries(
    species.map(([id, dex, en, he, zh]) => [id, { dex, en, he, zh, es: en }]),
  );

  const ELEMENTS = {
    electric: { icon: "⚡", color: "#ffe052", attack: "lightning", range: 200, rate: 0.62, splash: 0 },
    fire: { icon: "🔥", color: "#ff8b4d", attack: "fire", range: 185, rate: 0.92, splash: 58 },
    water: { icon: "💧", color: "#68c9f2", attack: "water", range: 195, rate: 0.8, splash: 48, slow: 0.75 },
    grass: { icon: "🌿", color: "#70d87b", attack: "seed", range: 205, rate: 0.85, splash: 30, slow: 1.2 },
    psychic: { icon: "🔮", color: "#d9a6ed", attack: "star", range: 235, rate: 0.85, splash: 38 },
    normal: { icon: "⭐", color: "#e4ad67", attack: "star", range: 205, rate: 0.7, splash: 24 },
    dragon: { icon: "🐉", color: "#9b8bf5", attack: "star", range: 225, rate: 0.95, splash: 54 },
    ice: { icon: "❄️", color: "#a0edf5", attack: "water", range: 210, rate: 0.86, splash: 48, slow: 1.8 },
    ground: { icon: "⛰️", color: "#d6a66b", attack: "seed", range: 185, rate: 1.02, splash: 64, slow: 0.6 },
    steel: { icon: "⚙️", color: "#b7d6e3", attack: "star", range: 210, rate: 0.9, splash: 42 },
    ghost: { icon: "👻", color: "#b487df", attack: "star", range: 220, rate: 0.78, splash: 38, slow: 0.7 },
    dark: { icon: "🌙", color: "#8d88bf", attack: "star", range: 205, rate: 0.84, splash: 32, slow: 1.1 },
    fairy: { icon: "✨", color: "#ef9dd6", attack: "star", range: 215, rate: 0.8, splash: 66 },
    rock: { icon: "🪨", color: "#c9b697", attack: "seed", range: 180, rate: 1.08, splash: 68, slow: 0.45 },
    fighting: { icon: "🥊", color: "#eb9589", attack: "star", range: 155, rate: 0.5, splash: 22 },
    bug: { icon: "🐛", color: "#b3d85f", attack: "seed", range: 195, rate: 0.64, splash: 28, slow: 0.85 },
  };

  function makeTower(id, element, cost, damage, forms = [], overrides = {}) {
    const style = ELEMENTS[element];
    const stages = forms.length ? forms : [id];
    return {
      name: POKEMON[id].en,
      element,
      cost,
      damage,
      range: style.range,
      rate: style.rate,
      attack: style.attack,
      splash: style.splash,
      slow: style.slow || 0,
      projectileSpeed: 510,
      color: style.color,
      special: { key: element, icon: style.icon },
      upgradeCosts: [Math.round(cost * 0.95), Math.round(cost * 1.7)],
      evolutions: [
        { name: POKEMON[stages[0]].en, image: `${stages[0]}Animated`, mastery: stages[0] === id },
        { name: POKEMON[stages[1] || stages[0]].en, image: `${stages[1] || stages[0]}Animated`, mastery: !stages[1] },
      ],
      ...overrides,
    };
  }

  const ADDITIONAL_TOWERS = {
    mew: makeTower("mew", "psychic", 230, 62, [], { rate: 0.72, splash: 50 }),
    mewtwo: makeTower("mewtwo", "psychic", 340, 110, [], { range: 270, rate: 1.05, splash: 58 }),
    dragonite: makeTower("dragonite", "dragon", 250, 76, [], { splash: 62 }),
    lugia: makeTower("lugia", "psychic", 310, 85, [], { range: 265, slow: 1.4 }),
    zapdos: makeTower("zapdos", "electric", 265, 55, [], { range: 245, rate: 0.55 }),
    moltres: makeTower("moltres", "fire", 265, 83, [], { splash: 88 }),
    arceus: makeTower("arceus", "normal", 420, 125, [], { range: 280, rate: 0.88, splash: 72 }),
    articuno: makeTower("articuno", "ice", 265, 58, [], { range: 240, slow: 2.4 }),
    raikou: makeTower("raikou", "electric", 245, 48, [], { rate: 0.46 }),
    entei: makeTower("entei", "fire", 245, 78, [], { splash: 74 }),
    suicune: makeTower("suicune", "water", 245, 62, [], { slow: 1.6, splash: 68 }),
    hooh: makeTower("hooh", "fire", 320, 97, [], { range: 245, splash: 90 }),
    celebi: makeTower("celebi", "grass", 225, 48, [], { range: 250, slow: 2 }),
    jirachi: makeTower("jirachi", "psychic", 230, 55, [], { rate: 0.62, splash: 60 }),
    rayquaza: makeTower("rayquaza", "dragon", 365, 112, [], { range: 270, splash: 76 }),
    groudon: makeTower("groudon", "ground", 330, 115, [], { splash: 110, rate: 1.15 }),
    kyogre: makeTower("kyogre", "water", 330, 85, [], { splash: 100, slow: 1.5 }),
    dialga: makeTower("dialga", "steel", 350, 98, [], { range: 255, slow: 1.7 }),
    palkia: makeTower("palkia", "dragon", 350, 108, [], { range: 285, splash: 62 }),
    giratina: makeTower("giratina", "ghost", 350, 94, [], { splash: 72, slow: 1.5 }),
    zekrom: makeTower("zekrom", "electric", 325, 73, [], { rate: 0.64, range: 250 }),
    reshiram: makeTower("reshiram", "fire", 325, 105, [], { splash: 84, range: 245 }),
    vaporeon: makeTower("vaporeon", "water", 130, 32, [], { splash: 60 }),
    jolteon: makeTower("jolteon", "electric", 130, 24, [], { rate: 0.46 }),
    flareon: makeTower("flareon", "fire", 130, 46, [], { splash: 62 }),
    espeon: makeTower("espeon", "psychic", 140, 40, [], { range: 250 }),
    umbreon: makeTower("umbreon", "dark", 140, 32, [], { slow: 1.8 }),
    leafeon: makeTower("leafeon", "grass", 130, 29, [], { slow: 1.6 }),
    glaceon: makeTower("glaceon", "ice", 140, 32, [], { slow: 2 }),
    sylveon: makeTower("sylveon", "fairy", 150, 33, [], { splash: 80 }),
    dratini: makeTower("dratini", "dragon", 95, 29, ["dragonair", "dragonite"]),
    gastly: makeTower("gastly", "ghost", 78, 21, ["haunter", "gengar"]),
    geodude: makeTower("geodude", "rock", 75, 31, ["graveler", "golem"]),
    onix: makeTower("onix", "rock", 115, 46, ["steelix"], { range: 200 }),
    machop: makeTower("machop", "fighting", 72, 20, ["machoke", "machamp"]),
    growlithe: makeTower("growlithe", "fire", 82, 29, ["arcanine"], { rate: 0.78 }),
    psyduck: makeTower("psyduck", "water", 70, 18, ["golduck"]),
    poliwag: makeTower("poliwag", "water", 65, 16, ["poliwhirl", "poliwrath"], { rate: 0.7 }),
    slowpoke: makeTower("slowpoke", "psychic", 80, 32, ["slowbro"], { rate: 1.12, slow: 1.6 }),
    lapras: makeTower("lapras", "ice", 160, 45, [], { splash: 70, slow: 2 }),
    snorlax: makeTower("snorlax", "normal", 170, 74, [], { range: 175, rate: 1.2, splash: 50 }),
    scyther: makeTower("scyther", "bug", 92, 22, ["scizor"], { rate: 0.46 }),
    magikarp: makeTower("magikarp", "water", 40, 7, ["gyarados"], { evolutionDamage: 3.4, splash: 25 }),
    larvitar: makeTower("larvitar", "rock", 90, 34, ["pupitar", "tyranitar"]),
    rhyhorn: makeTower("rhyhorn", "ground", 85, 32, ["rhydon", "rhyperior"]),
    riolu: makeTower("riolu", "fighting", 80, 23, ["lucario"], { range: 175 }),
    bagon: makeTower("bagon", "dragon", 92, 28, ["shelgon", "salamence"]),
    gible: makeTower("gible", "dragon", 95, 29, ["gabite", "garchomp"], { slow: 0.65 }),
    beldum: makeTower("beldum", "steel", 90, 28, ["metang", "metagross"]),
    togepi: makeTower("togepi", "fairy", 70, 17, ["togetic", "togekiss"], { splash: 50 }),
  };

  const EEVEE_EVOLUTIONS = {
    vaporeon: { element: "water", attack: "water", damageMultiplier: 1.05, rangeBonus: 0, rateMultiplier: 1, splash: 58, slow: 1.1 },
    jolteon: { element: "electric", attack: "lightning", damageMultiplier: 0.95, rangeBonus: 10, rateMultiplier: 0.8, splash: 0, slow: 0 },
    flareon: { element: "fire", attack: "fire", damageMultiplier: 1.35, rangeBonus: -15, rateMultiplier: 1.12, splash: 62, slow: 0 },
    espeon: { element: "psychic", attack: "star", damageMultiplier: 1.22, rangeBonus: 35, rateMultiplier: 1, splash: 38, slow: 0 },
    umbreon: { element: "dark", attack: "star", damageMultiplier: 1.1, rangeBonus: 5, rateMultiplier: 1, splash: 28, slow: 1.8 },
    leafeon: { element: "grass", attack: "seed", damageMultiplier: 1.1, rangeBonus: 15, rateMultiplier: 0.95, splash: 36, slow: 1.4 },
    glaceon: { element: "ice", attack: "water", damageMultiplier: 1.05, rangeBonus: 15, rateMultiplier: 1.02, splash: 50, slow: 2.2 },
    sylveon: { element: "fairy", attack: "star", damageMultiplier: 1.12, rangeBonus: 20, rateMultiplier: 1, splash: 76, slow: 0 },
  };

  function enemyFamily(id, ids, health = 1, speed = 1) {
    return {
      id,
      stages: ids.map((speciesId, stage) => ({
        name: POKEMON[speciesId].en,
        image: `${speciesId}Animated`,
        health: health + stage * 0.48,
        speed: speed + stage * 0.04,
        radius: 23 + stage * 5,
        reward: 1 + stage * 0.35,
      })),
    };
  }

  const ADDITIONAL_ENEMY_FAMILIES = [
    enemyFamily("dratini", ["dratini", "dragonair", "dragonite"], 1.08, 0.98),
    enemyFamily("gastly", ["gastly", "haunter", "gengar"], 0.82, 1.2),
    enemyFamily("geodude", ["geodude", "graveler", "golem"], 1.4, 0.7),
    enemyFamily("machop", ["machop", "machoke", "machamp"], 1.1, 0.96),
    enemyFamily("growlithe", ["growlithe", "arcanine"], 0.95, 1.15),
    enemyFamily("psyduck", ["psyduck", "golduck"], 1.05, 0.94),
    enemyFamily("poliwag", ["poliwag", "poliwhirl", "poliwrath"], 0.92, 1.05),
    enemyFamily("slowpoke", ["slowpoke", "slowbro"], 1.45, 0.66),
    enemyFamily("scyther", ["scyther", "scizor"], 0.96, 1.22),
    enemyFamily("magikarp", ["magikarp", "gyarados"], 0.7, 0.88),
    enemyFamily("larvitar", ["larvitar", "pupitar", "tyranitar"], 1.25, 0.86),
    enemyFamily("rhyhorn", ["rhyhorn", "rhydon", "rhyperior"], 1.32, 0.82),
    enemyFamily("riolu", ["riolu", "lucario"], 0.9, 1.18),
    enemyFamily("bagon", ["bagon", "shelgon", "salamence"], 1.1, 0.95),
    enemyFamily("gible", ["gible", "gabite", "garchomp"], 1.12, 1.02),
    enemyFamily("beldum", ["beldum", "metang", "metagross"], 1.3, 0.85),
    enemyFamily("togepi", ["togepi", "togetic", "togekiss"], 0.92, 1.02),
  ];

  const ADDITIONAL_BOSSES = [
    { id: "articuno", tier: 1, weakness: ["fire", "electric", "rock", "steel"], ability: "storm", health: 1.22, speed: 0.82, radius: 48, color: "#a0edf5" },
    { id: "zapdos", tier: 1, weakness: ["ice", "rock"], ability: "storm", health: 1.16, speed: 1.02, radius: 48, color: "#ffe052" },
    { id: "moltres", tier: 1, weakness: ["water", "electric", "rock"], ability: "dash", health: 1.2, speed: 0.94, radius: 48, color: "#ff8b4d" },
    { id: "mew", tier: 2, weakness: ["bug", "ghost", "dark"], ability: "phase", health: 1.35, speed: 1.08, radius: 44, color: "#ef9dd6" },
    { id: "mewtwo", tier: 2, weakness: ["bug", "ghost", "dark"], ability: "storm", health: 1.75, speed: 0.9, radius: 54, color: "#d9a6ed" },
    { id: "lugia", tier: 2, weakness: ["electric", "ice", "rock", "ghost", "dark"], ability: "heal", health: 1.65, speed: 0.8, radius: 58, color: "#b7d6e3" },
    { id: "hooh", tier: 2, weakness: ["water", "electric", "rock"], ability: "heal", health: 1.6, speed: 0.85, radius: 58, color: "#ffb25f" },
    { id: "kyogre", tier: 2, weakness: ["electric", "grass"], ability: "storm", health: 1.75, speed: 0.72, radius: 60, color: "#68c9f2" },
    { id: "groudon", tier: 2, weakness: ["water", "grass", "ice"], ability: "shield", health: 1.9, speed: 0.68, radius: 60, color: "#f05b52" },
    { id: "rayquaza", tier: 3, weakness: ["ice", "dragon", "fairy", "rock"], ability: "dash", health: 2, speed: 1, radius: 60, color: "#70d87b" },
    { id: "dialga", tier: 3, weakness: ["ground", "fighting"], ability: "storm", health: 2.1, speed: 0.78, radius: 62, color: "#4c8ed9" },
    { id: "giratina", tier: 3, weakness: ["ghost", "dark", "ice", "dragon", "fairy"], ability: "phase", health: 2.15, speed: 0.84, radius: 62, color: "#b487df" },
    { id: "arceus", tier: 3, weakness: ["fighting"], ability: "enrage", health: 2.4, speed: 0.88, radius: 65, color: "#fff1a0" },
  ].map((boss) => ({
    ...boss,
    name: POKEMON[boss.id].en,
    image: `${boss.id}Animated`,
  }));

  const DIFFICULTIES = {
    easy: { coins: 220, lives: 15, health: 0.78, speed: 0.82, count: 0.85, spawnInterval: 1.18, bossHealth: 1.15, bossSize: 1.25, abilityInterval: 1.18, shieldDamage: 0.5, heal: 0.08, dash: 1.75, storm: 0.55, reward: 1.15, stageAdvance: 0, mixedFamiliesAt: 12 },
    medium: { coins: 180, lives: 10, health: 1, speed: 1, count: 1, spawnInterval: 1, bossHealth: 1.45, bossSize: 1.5, abilityInterval: 1, shieldDamage: 0.38, heal: 0.1, dash: 2.15, storm: 0.9, reward: 1, stageAdvance: 2, mixedFamiliesAt: 9 },
    hard: { coins: 150, lives: 7, health: 1.45, speed: 1.18, count: 1.25, spawnInterval: 0.78, bossHealth: 2.05, bossSize: 1.8, abilityInterval: 0.72, shieldDamage: 0.3, heal: 0.14, dash: 2.4, storm: 1.25, reward: 0.95, stageAdvance: 4, mixedFamiliesAt: 5 },
  };

  const MAPS = {
    classic: {
      width: 1600, height: 900, buildTop: 160, goal: { x: 1535, y: 770 },
      path: [
        [-60, 185], [155, 185], [285, 300], [230, 520], [370, 735], [575, 800],
        [760, 705], [825, 500], [710, 340], [770, 185], [985, 150], [1140, 280],
        [1085, 500], [1205, 665], [1390, 600], [1490, 745], [1660, 780],
      ],
      blockers: [
        { type: "lake", x: 1325, y: 255, rx: 185, ry: 105 },
        { type: "pond", x: 510, y: 325, rx: 115, ry: 72 },
        { type: "cliff", x: 1260, y: 790, rx: 145, ry: 62 },
        { type: "grove", x: 930, y: 760, rx: 105, ry: 72 },
      ],
      theme: {
        field: ["#77cf65", "#43a952"], texture: "rgba(20,112,56,.12)", grassTiles: true,
        pathEdge: "#e1b56a", path: ["#f4d28a", "#e9bd72", "#f5d895"],
        pathShadow: "rgba(30,83,43,.28)", pathMarks: "rgba(150,98,45,.19)",
        water: ["#7be4e6", "#3ba4c8"], waterShadow: "rgba(25,105,100,.28)", ripples: "rgba(255,255,255,.45)",
        cliff: ["#b89a6c", "#8d7555"], cliffMarks: "rgba(82,61,42,.38)",
        trunk: "#6b4b2d", leaves: ["#237d49", "#2f9a51"],
        decoration: "flowers", particles: "rgba(255,249,167,.55)",
      },
    },
    coast: {
      width: 2240, height: 1260, buildTop: 200, goal: { x: 2160, y: 1100 },
      path: [
        [-60, 250], [240, 250], [440, 440], [300, 700], [540, 980], [880, 1080],
        [1120, 880], [1060, 620], [830, 420], [1030, 230], [1360, 200], [1550, 420],
        [1440, 700], [1650, 1000], [1970, 940], [2120, 1100], [2300, 1100],
      ],
      blockers: [
        { type: "lake", x: 1850, y: 280, rx: 280, ry: 155 },
        { type: "pond", x: 660, y: 650, rx: 170, ry: 100 },
        { type: "cliff", x: 1390, y: 1130, rx: 180, ry: 70 },
        { type: "grove", x: 1260, y: 470, rx: 125, ry: 80 },
        { type: "grove", x: 190, y: 1060, rx: 115, ry: 75 },
        { type: "pond", x: 2060, y: 680, rx: 145, ry: 100 },
      ],
      theme: {
        field: ["#f5e6a9", "#d5c37d"], texture: "rgba(152,117,60,.12)", grassTiles: false,
        pathEdge: "#b98b51", path: ["#fff3ca", "#eed9a0", "#fff1c3"],
        pathShadow: "rgba(101,76,43,.25)", pathMarks: "rgba(160,125,64,.25)",
        water: ["#70f1ec", "#168bb2"], waterShadow: "rgba(11,127,142,.3)", ripples: "rgba(235,255,255,.7)",
        cliff: ["#e4ceb1", "#a58b7b"], cliffMarks: "rgba(87,69,67,.35)",
        trunk: "#947044", leaves: ["#238c75", "#38ac81"],
        decoration: "shells", particles: "rgba(220,255,255,.65)",
      },
    },
    volcano: {
      width: 2880, height: 1620, buildTop: 240, goal: { x: 2800, y: 1380 },
      path: [
        [-60, 280], [280, 280], [500, 540], [360, 850], [630, 1300], [1050, 1390],
        [1320, 1110], [1140, 830], [920, 600], [1140, 310], [1510, 220], [1780, 480],
        [1650, 840], [1900, 1240], [2290, 1350], [2500, 1070], [2310, 770],
        [2520, 510], [2740, 590], [2690, 1200], [2940, 1430],
      ],
      blockers: [
        { type: "lake", x: 2020, y: 250, rx: 230, ry: 120 },
        { type: "pond", x: 700, y: 430, rx: 175, ry: 115 },
        { type: "lake", x: 2090, y: 920, rx: 190, ry: 150 },
        { type: "cliff", x: 1550, y: 1370, rx: 180, ry: 85 },
        { type: "cliff", x: 220, y: 1330, rx: 120, ry: 85 },
        { type: "grove", x: 1480, y: 610, rx: 135, ry: 90 },
        { type: "grove", x: 780, y: 1030, rx: 155, ry: 100 },
        { type: "pond", x: 2700, y: 250, rx: 100, ry: 80 },
      ],
      theme: {
        field: ["#806878", "#443949"], texture: "rgba(255,183,131,.1)", grassTiles: false,
        pathEdge: "#b27052", path: ["#c79a7c", "#94715f", "#d3a086"],
        pathShadow: "rgba(18,12,29,.45)", pathMarks: "rgba(57,32,38,.35)",
        water: ["#ffcc5a", "#ef553c"], waterShadow: "rgba(255,79,38,.3)", ripples: "rgba(255,239,144,.8)",
        cliff: ["#6b657e", "#36364b"], cliffMarks: "rgba(20,17,39,.65)",
        trunk: "#51425e", leaves: ["#ac8bda", "#7f6ab9"],
        decoration: "crystals", particles: "rgba(255,175,80,.7)",
      },
    },
  };
  Object.values(MAPS).forEach((map) => {
    map.path = map.path.map(([x, y]) => ({ x, y }));
  });

  function clampCamera(camera, map) {
    const zoom = Math.max(1, Math.min(3, camera.zoom));
    return {
      zoom,
      x: Math.max(0, Math.min(map.width - map.width / zoom, camera.x)),
      y: Math.max(0, Math.min(map.height - map.height / zoom, camera.y)),
    };
  }

  function screenToWorld(point, camera) {
    return { x: camera.x + point.x / camera.zoom, y: camera.y + point.y / camera.zoom };
  }

  function shuffled(items, random = Math.random) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function waveCount(wave, difficulty, modifier) {
    return Math.max(5, Math.round((5 + wave * 2 + modifier.count) * DIFFICULTIES[difficulty].count));
  }

  function buildWavePlan({ family, secondaryFamily, wave, count, difficulty, random = Math.random }) {
    const settings = DIFFICULTIES[difficulty];
    const effectiveWave = wave + settings.stageAdvance;
    const secondaryCount = secondaryFamily && wave >= settings.mixedFamiliesAt
      ? Math.max(1, Math.round(count * 0.22))
      : 0;
    const plan = [];
    for (const [source, size] of [[family, count - secondaryCount], [secondaryFamily, secondaryCount]]) {
      if (!source || !size) continue;
      const maxStage = Math.min(source.stages.length - 1, Math.floor((effectiveWave - 1) / 5));
      const counts = Array.from({ length: maxStage + 1 }, () => 0);
      if (maxStage === 0) {
        counts[0] = size;
      } else if (maxStage === 1) {
        counts[1] = Math.max(1, Math.round(size * 0.3));
        counts[0] = size - counts[1];
      } else {
        const finalShare = Math.min(0.7, 0.3 + Math.max(0, effectiveWave - 11) * 0.025);
        counts[2] = Math.max(1, Math.round(size * finalShare));
        counts[0] = Math.max(0, Math.round(size * Math.max(0.1, 0.25 - (finalShare - 0.3) / 2)));
        counts[1] = size - counts[0] - counts[2];
      }
      counts.forEach((amount, stage) => {
        for (let index = 0; index < amount; index += 1) plan.push(source.stages[stage]);
      });
    }
    return shuffled(plan, random);
  }

  function enemyStats(type, wave, difficulty, modifier, boss = false, random = Math.random) {
    const settings = DIFFICULTIES[difficulty];
    const baseHealth = 52 + wave * 18 + Math.pow(wave, 1.38) * 4;
    const baseSpeed = Math.min(124, 55 + wave * 2.45);
    const speedMultiplier = type.speed * settings.speed * (boss ? 0.78 : modifier.speed);
    return {
      health: Math.round(baseHealth * type.health * settings.health * (boss ? 7.2 * settings.bossHealth : modifier.health)),
      speed: Math.min(132, baseSpeed + random() * 8) * speedMultiplier,
      baseSpeed: baseSpeed * speedMultiplier,
      radius: type.radius * (boss ? settings.bossSize * (1 + Math.min(10, Math.floor(wave / 5) - 1) * 0.02) : 1),
      rewardMultiplier: (boss ? 6 : type.reward) * settings.reward,
    };
  }

  function towerType(base, tower) {
    const branch = tower.type === "eevee" && tower.evolutionStage > 0
      ? EEVEE_EVOLUTIONS[tower.eeveeEvolution || "vaporeon"]
      : null;
    if (!branch) return base;
    return {
      ...base,
      ...branch,
      damage: base.damage * branch.damageMultiplier,
      range: base.range + branch.rangeBonus,
      rate: base.rate * branch.rateMultiplier,
      color: ELEMENTS[branch.element].color,
      special: { key: branch.element, icon: ELEMENTS[branch.element].icon },
    };
  }

  function towerStats(base, tower) {
    const type = towerType(base, tower);
    const skills = tower.skills || { power: 0, range: 0, special: 0 };
    const stage = tower.evolutionStage || 0;
    return {
      damage: Math.round(type.damage * (1 + skills.power * 0.27 + stage * (type.evolutionDamage || 0.42) + (tower.type === "abra" ? skills.special * 0.1 : 0))),
      range: type.range + skills.range * 22 + stage * 24 + (tower.type === "piplup" ? skills.special * 10 : tower.type === "rowlet" ? skills.special * 15 : tower.type === "abra" ? skills.special * 12 : 0),
      rate: Math.max(0.26, type.rate * (1 - skills.special * 0.065 - stage * 0.1 - (stage === 2 && tower.type === "eevee" ? 0.1 : 0))),
      splash: type.splash ? type.splash + skills.special * 14 + stage * 14 + (stage === 2 && ["charmander", "squirtle"].includes(tower.type) ? 24 : 0) : 0,
      slow: type.slow ? type.slow + skills.special * 0.35 + stage * 0.28 + (stage === 2 && tower.type === "bulbasaur" ? 0.55 : 0) : 0,
      attack: type.attack,
      element: type.element,
      projectileSpeed: type.projectileSpeed || 440,
      color: type.color,
      chains: type.attack === "lightning" ? 1 + skills.special + stage : 0,
      evolutionStage: stage,
    };
  }

  window.PokemonTDData = {
    POKEMON, ELEMENTS, ADDITIONAL_TOWERS, EEVEE_EVOLUTIONS, ADDITIONAL_ENEMY_FAMILIES,
    ADDITIONAL_BOSSES, DIFFICULTIES, MAPS, clampCamera, screenToWorld,
    shuffled, waveCount, buildWavePlan, enemyStats, towerType, towerStats,
  };
})();

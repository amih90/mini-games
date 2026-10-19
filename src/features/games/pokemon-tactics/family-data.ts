// Elements describe simplified tactical roles, not the official Pokémon type chart.
// Each form is [identifier, National Pokédex number, English/Spanish, Hebrew, Chinese].
export const additionalFamilies = [
  { element: 'grass', forms: [
    ['caterpie', 10, 'Caterpie', 'קטרפי', '绿毛虫'],
    ['metapod', 11, 'Metapod', 'מטפוד', '铁甲蛹'],
    ['butterfree', 12, 'Butterfree', 'באטרפרי', '巴大蝶'],
  ] },
  { element: 'grass', forms: [
    ['weedle', 13, 'Weedle', 'ווידל', '独角虫'],
    ['kakuna', 14, 'Kakuna', 'קקונה', '铁壳蛹'],
    ['beedrill', 15, 'Beedrill', 'בידריל', '大针蜂'],
  ] },
  { element: 'normal', forms: [
    ['pidgey', 16, 'Pidgey', "פידג'י", '波波'],
    ['pidgeotto', 17, 'Pidgeotto', "פידג'יוטו", '比比鸟'],
    ['pidgeot', 18, 'Pidgeot', "פידג'יוט", '大比鸟'],
  ] },
  { element: 'normal', forms: [
    ['rattata', 19, 'Rattata', 'רטטה', '小拉达'],
    ['raticate', 20, 'Raticate', 'רטיקייט', '拉达'],
  ] },
  { element: 'normal', forms: [
    ['spearow', 21, 'Spearow', 'ספירו', '烈雀'],
    ['fearow', 22, 'Fearow', 'פירו', '大嘴雀'],
  ] },
  { element: 'ghost', forms: [
    ['ekans', 23, 'Ekans', 'אקנס', '阿柏蛇'],
    ['arbok', 24, 'Arbok', 'ארבוק', '阿柏怪'],
  ] },
  { element: 'rock', forms: [
    ['sandshrew', 27, 'Sandshrew', 'סנדשרו', '穿山鼠'],
    ['sandslash', 28, 'Sandslash', 'סנדסלאש', '穿山王'],
  ] },
  { element: 'rock', forms: [
    ['nidoran-f', 29, 'Nidoran♀', 'נידורן♀', '尼多兰'],
    ['nidorina', 30, 'Nidorina', 'נידורינה', '尼多娜'],
    ['nidoqueen', 31, 'Nidoqueen', 'נידוקווין', '尼多后'],
  ] },
  { element: 'rock', forms: [
    ['nidoran-m', 32, 'Nidoran♂', 'נידורן♂', '尼多朗'],
    ['nidorino', 33, 'Nidorino', 'נידורינו', '尼多力诺'],
    ['nidoking', 34, 'Nidoking', 'נידוקינג', '尼多王'],
  ] },
  { element: 'normal', forms: [
    ['cleffa', 173, 'Cleffa', 'קלפה', '皮宝宝'],
    ['clefairy', 35, 'Clefairy', 'קלפיירי', '皮皮'],
    ['clefable', 36, 'Clefable', 'קלפייבל', '皮可西'],
  ] },
  { element: 'fire', forms: [
    ['vulpix', 37, 'Vulpix', 'וולפיקס', '六尾'],
    ['ninetales', 38, 'Ninetales', 'ניינטיילס', '九尾'],
  ] },
  { element: 'normal', forms: [
    ['igglybuff', 174, 'Igglybuff', 'איגליבאף', '宝宝丁'],
    ['jigglypuff', 39, 'Jigglypuff', "ג'יגליפאף", '胖丁'],
    ['wigglytuff', 40, 'Wigglytuff', 'ויגליטאף', '胖可丁'],
  ] },
  { element: 'ghost', forms: [
    ['zubat', 41, 'Zubat', 'זובאט', '超音蝠'],
    ['golbat', 42, 'Golbat', 'גולבאט', '大嘴蝠'],
    ['crobat', 169, 'Crobat', 'קרובאט', '叉字蝠'],
  ] },
  { element: 'grass', forms: [
    ['paras', 46, 'Paras', 'פאראס', '派拉斯'],
    ['parasect', 47, 'Parasect', 'פאראסקט', '派拉斯特'],
  ] },
  { element: 'grass', forms: [
    ['venonat', 48, 'Venonat', 'ונונאט', '毛球'],
    ['venomoth', 49, 'Venomoth', 'ונומות', '摩鲁蛾'],
  ] },
  { element: 'rock', forms: [
    ['diglett', 50, 'Diglett', 'דיגלט', '地鼠'],
    ['dugtrio', 51, 'Dugtrio', 'דאגטריו', '三地鼠'],
  ] },
  { element: 'normal', forms: [
    ['meowth', 52, 'Meowth', 'מיאו', '喵喵'],
    ['persian', 53, 'Persian', 'פרסיאן', '猫老大'],
  ] },
  { element: 'water', forms: [
    ['psyduck', 54, 'Psyduck', 'פסיידאק', '可达鸭'],
    ['golduck', 55, 'Golduck', 'גולדאק', '哥达鸭'],
  ] },
  { element: 'normal', forms: [
    ['mankey', 56, 'Mankey', 'מאנקי', '猴怪'],
    ['primeape', 57, 'Primeape', 'פריימייפ', '火暴猴'],
    ['annihilape', 979, 'Annihilape', 'אנייהילייפ', '弃世猴'],
  ] },
  { element: 'fire', forms: [
    ['growlithe', 58, 'Growlithe', 'גראולית', '卡蒂狗'],
    ['arcanine', 59, 'Arcanine', 'ארקניין', '风速狗'],
  ] },
  { element: 'ghost', forms: [
    ['abra', 63, 'Abra', 'אברה', '凯西'],
    ['kadabra', 64, 'Kadabra', 'קדברה', '勇基拉'],
    ['alakazam', 65, 'Alakazam', 'אלאקזם', '胡地'],
  ] },
  { element: 'normal', forms: [
    ['machop', 66, 'Machop', "מאצ'ופ", '腕力'],
    ['machoke', 67, 'Machoke', "מאצ'וק", '豪力'],
    ['machamp', 68, 'Machamp', "מאצ'אמפ", '怪力'],
  ] },
  { element: 'grass', forms: [
    ['bellsprout', 69, 'Bellsprout', 'בלספראוט', '喇叭芽'],
    ['weepinbell', 70, 'Weepinbell', 'וויפינבל', '口呆花'],
    ['victreebel', 71, 'Victreebel', 'ויקטריבל', '大食花'],
  ] },
  { element: 'water', forms: [
    ['tentacool', 72, 'Tentacool', 'טנטקול', '玛瑙水母'],
    ['tentacruel', 73, 'Tentacruel', 'טנטקרול', '毒刺水母'],
  ] },
  { element: 'fire', forms: [
    ['ponyta', 77, 'Ponyta', 'פוניטה', '小火马'],
    ['rapidash', 78, 'Rapidash', 'רפידאש', '烈焰马'],
  ] },
  { element: 'electric', forms: [
    ['magnemite', 81, 'Magnemite', 'מגנמייט', '小磁怪'],
    ['magneton', 82, 'Magneton', 'מגנטון', '三合一磁怪'],
    ['magnezone', 462, 'Magnezone', 'מגנזון', '自爆磁怪'],
  ] },
  { element: 'normal', forms: [
    ['doduo', 84, 'Doduo', 'דודואו', '嘟嘟'],
    ['dodrio', 85, 'Dodrio', 'דודריו', '嘟嘟利'],
  ] },
  { element: 'ice', forms: [
    ['seel', 86, 'Seel', 'סיל', '小海狮'],
    ['dewgong', 87, 'Dewgong', 'דיוגונג', '白海狮'],
  ] },
  { element: 'ghost', forms: [
    ['grimer', 88, 'Grimer', 'גריימר', '臭泥'],
    ['muk', 89, 'Muk', 'מאק', '臭臭泥'],
  ] },
  { element: 'ice', forms: [
    ['shellder', 90, 'Shellder', 'שלדר', '大舌贝'],
    ['cloyster', 91, 'Cloyster', 'קלויסטר', '刺甲贝'],
  ] },
  { element: 'rock', forms: [
    ['onix', 95, 'Onix', 'אוניקס', '大岩蛇'],
    ['steelix', 208, 'Steelix', 'סטיליקס', '大钢蛇'],
  ] },
  { element: 'ghost', forms: [
    ['drowzee', 96, 'Drowzee', 'דראוזי', '催眠貘'],
    ['hypno', 97, 'Hypno', 'היפנו', '引梦貘人'],
  ] },
  { element: 'water', forms: [
    ['krabby', 98, 'Krabby', 'קראבי', '大钳蟹'],
    ['kingler', 99, 'Kingler', 'קינגלר', '巨钳蟹'],
  ] },
  { element: 'electric', forms: [
    ['voltorb', 100, 'Voltorb', 'וולטורב', '霹雳电球'],
    ['electrode', 101, 'Electrode', 'אלקטרוד', '顽皮雷弹'],
  ] },
  { element: 'grass', forms: [
    ['exeggcute', 102, 'Exeggcute', 'אקזגקיוט', '蛋蛋'],
    ['exeggutor', 103, 'Exeggutor', 'אקזגיוטור', '椰蛋树'],
  ] },
  { element: 'rock', forms: [
    ['cubone', 104, 'Cubone', 'קיובון', '卡拉卡拉'],
    ['marowak', 105, 'Marowak', 'מרוואק', '嘎啦嘎啦'],
  ] },
  { element: 'ghost', forms: [
    ['koffing', 109, 'Koffing', 'קופינג', '瓦斯弹'],
    ['weezing', 110, 'Weezing', 'וויזינג', '双弹瓦斯'],
  ] },
  { element: 'rock', forms: [
    ['rhyhorn', 111, 'Rhyhorn', 'רייהורן', '独角犀牛'],
    ['rhydon', 112, 'Rhydon', 'ריידון', '钻角犀兽'],
    ['rhyperior', 464, 'Rhyperior', 'רייפריור', '超甲狂犀'],
  ] },
  { element: 'water', forms: [
    ['horsea', 116, 'Horsea', 'הורסי', '墨海马'],
    ['seadra', 117, 'Seadra', 'סידרה', '海刺龙'],
    ['kingdra', 230, 'Kingdra', 'קינגדרה', '刺龙王'],
  ] },
  { element: 'water', forms: [
    ['goldeen', 118, 'Goldeen', 'גולדין', '角金鱼'],
    ['seaking', 119, 'Seaking', 'סיקינג', '金鱼王'],
  ] },
  { element: 'water', forms: [
    ['staryu', 120, 'Staryu', 'סטאריו', '海星星'],
    ['starmie', 121, 'Starmie', 'סטארמי', '宝石海星'],
  ] },
  { element: 'water', forms: [
    ['magikarp', 129, 'Magikarp', "מג'יקארפ", '鲤鱼王'],
    ['gyarados', 130, 'Gyarados', 'גיאראדוס', '暴鲤龙'],
  ] },
  { element: 'normal', forms: [
    ['porygon', 137, 'Porygon', 'פוריגון', '多边兽'],
    ['porygon2', 233, 'Porygon2', 'פוריגון 2', '多边兽Ⅱ'],
    ['porygon-z', 474, 'Porygon-Z', 'פוריגון Z', '多边兽Ｚ'],
  ] },
  { element: 'rock', forms: [
    ['omanyte', 138, 'Omanyte', 'אומנייט', '菊石兽'],
    ['omastar', 139, 'Omastar', 'אומסטאר', '多刺菊石兽'],
  ] },
  { element: 'rock', forms: [
    ['kabuto', 140, 'Kabuto', 'קבוטו', '化石盔'],
    ['kabutops', 141, 'Kabutops', 'קבוטופס', '镰刀盔'],
  ] },
  { element: 'normal', forms: [
    ['dratini', 147, 'Dratini', 'דרטיני', '迷你龙'],
    ['dragonair', 148, 'Dragonair', 'דרגונייר', '哈克龙'],
    ['dragonite', 149, 'Dragonite', 'דרגונייט', '快龙'],
  ] },
  { element: 'grass', forms: [
    ['chikorita', 152, 'Chikorita', "צ'יקוריטה", '菊草叶'],
    ['bayleef', 153, 'Bayleef', 'בייליף', '月桂叶'],
    ['meganium', 154, 'Meganium', 'מגניום', '大竺葵'],
  ] },
  { element: 'fire', forms: [
    ['cyndaquil', 155, 'Cyndaquil', 'סינדקוויל', '火球鼠'],
    ['quilava', 156, 'Quilava', 'קווילאבה', '火岩鼠'],
    ['typhlosion', 157, 'Typhlosion', "טייפלוז'ן", '火暴兽'],
  ] },
  { element: 'water', forms: [
    ['totodile', 158, 'Totodile', 'טוטודייל', '小锯鳄'],
    ['croconaw', 159, 'Croconaw', 'קרוקונו', '蓝鳄'],
    ['feraligatr', 160, 'Feraligatr', 'פראליגייטר', '大力鳄'],
  ] },
  { element: 'grass', forms: [
    ['treecko', 252, 'Treecko', 'טריקו', '木守宫'],
    ['grovyle', 253, 'Grovyle', 'גרובייל', '森林蜥蜴'],
    ['sceptile', 254, 'Sceptile', 'ספטייל', '蜥蜴王'],
  ] },
] as const;

export type AdditionalBaseSpeciesId = typeof additionalFamilies[number]['forms'][0][0];
export type AdditionalSpeciesId = typeof additionalFamilies[number]['forms'][number][0];

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
    ["cyndaquil", 155, "Cyndaquil", "סינדקוויל", "火球鼠"],
    ["quilava", 156, "Quilava", "קווילאבה", "火岩鼠"],
    ["typhlosion", 157, "Typhlosion", "טייפלוז׳ן", "火暴兽"],
    ["totodile", 158, "Totodile", "טוטודייל", "小锯鳄"],
    ["croconaw", 159, "Croconaw", "קרוקונאו", "蓝鳄"],
    ["feraligatr", 160, "Feraligatr", "פראליגייטר", "大力鳄"],
    ["sentret", 161, "Sentret", "סנטרט", "尾立"],
    ["furret", 162, "Furret", "פיורט", "大尾立"],
    ["hoothoot", 163, "Hoothoot", "הוטהוט", "咕咕"],
    ["noctowl", 164, "Noctowl", "נוקטאול", "猫头夜鹰"],
    ["crobat", 169, "Crobat", "קרובט", "叉字蝠"],
    ["chinchou", 170, "Chinchou", "צ׳ינצ׳או", "灯笼鱼"],
    ["lanturn", 171, "Lanturn", "לנטרן", "电灯怪"],
    ["togepi", 175, "Togepi", "טוגפי", "波克比"],
    ["togetic", 176, "Togetic", "טוגטיק", "波克基古"],
    ["mareep", 179, "Mareep", "מריפ", "咩利羊"],
    ["flaaffy", 180, "Flaaffy", "פלאפי", "茸茸羊"],
    ["ampharos", 181, "Ampharos", "אמפארוס", "电龙"],
    ["marill", 183, "Marill", "מריל", "玛力露"],
    ["azumarill", 184, "Azumarill", "אזומריל", "玛力露丽"],
    ["hoppip", 187, "Hoppip", "הופיפ", "毽子草"],
    ["skiploom", 188, "Skiploom", "סקיפלום", "毽子花"],
    ["jumpluff", 189, "Jumpluff", "ג׳אמפלאף", "毽子棉"],
    ["sunkern", 191, "Sunkern", "סאנקרן", "向日种子"],
    ["sunflora", 192, "Sunflora", "סאנפלורה", "向日花怪"],
    ["wooper", 194, "Wooper", "וופר", "乌波"],
    ["quagsire", 195, "Quagsire", "קוואגסייר", "沼王"],
    ["espeon", 196, "Espeon", "אספיאון", "太阳伊布"],
    ["umbreon", 197, "Umbreon", "אמבריאון", "月亮伊布"],
    ["steelix", 208, "Steelix", "סטיליקס", "大钢蛇"],
    ["shuckle", 213, "Shuckle", "שאקל", "壶壶"],
    ["teddiursa", 216, "Teddiursa", "טדיאורסה", "熊宝宝"],
    ["ursaring", 217, "Ursaring", "אורסרינג", "圈圈熊"],
    ["slugma", 218, "Slugma", "סלאגמה", "熔岩虫"],
    ["magcargo", 219, "Magcargo", "מגקרגו", "熔岩蜗牛"],
    ["swinub", 220, "Swinub", "סווינאב", "小山猪"],
    ["piloswine", 221, "Piloswine", "פילוסוויין", "长毛猪"],
    ["skarmory", 227, "Skarmory", "סקארמורי", "盔甲鸟"],
    ["houndour", 228, "Houndour", "האונדאור", "戴鲁比"],
    ["houndoom", 229, "Houndoom", "האונדום", "黑鲁加"],
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
    ["treecko", 252, "Treecko", "טריקו", "木守宫"],
    ["grovyle", 253, "Grovyle", "גרובייל", "森林蜥蜴"],
    ["sceptile", 254, "Sceptile", "ספטייל", "蜥蜴王"],
    ["turtwig", 387, "Turtwig", "טרטוויג", "草苗龟"],
    ["grotle", 388, "Grotle", "גרוטל", "树林龟"],
    ["torterra", 389, "Torterra", "טורטרה", "土台龟"],
    ["chimchar", 390, "Chimchar", "צ׳ימצ׳אר", "小火焰猴"],
    ["monferno", 391, "Monferno", "מונפרנו", "猛火猴"],
    ["infernape", 392, "Infernape", "אינפרנייפ", "烈焰猴"],
    ["snivy", 495, "Snivy", "סניבי", "藤藤蛇"],
    ["servine", 496, "Servine", "סרוויין", "青藤蛇"],
    ["serperior", 497, "Serperior", "סרפריור", "君主蛇"],
    ["tepig", 498, "Tepig", "טפיג", "暖暖猪"],
    ["pignite", 499, "Pignite", "פיגנייט", "炒炒猪"],
    ["emboar", 500, "Emboar", "אמבור", "炎武王"],
    ["oshawott", 501, "Oshawott", "אושוואוט", "水水獭"],
    ["dewott", 502, "Dewott", "דיוואוט", "双刃丸"],
    ["samurott", 503, "Samurott", "סמורוט", "大剑鬼"],
    ["chespin", 650, "Chespin", "צ׳ספין", "哈力栗"],
    ["quilladin", 651, "Quilladin", "קווילדין", "胖胖哈力"],
    ["chesnaught", 652, "Chesnaught", "צ׳סנאוט", "布里卡隆"],
    ["fennekin", 653, "Fennekin", "פנאקין", "火狐狸"],
    ["braixen", 654, "Braixen", "ברייסן", "长尾火狐"],
    ["delphox", 655, "Delphox", "דלפוקס", "妖火红狐"],
    ["froakie", 656, "Froakie", "פרוקי", "呱呱泡蛙"],
    ["frogadier", 657, "Frogadier", "פרוגדייר", "呱头蛙"],
    ["greninja", 658, "Greninja", "גרנינג׳ה", "甲贺忍蛙"],
    ["litten", 725, "Litten", "ליטן", "火斑喵"],
    ["torracat", 726, "Torracat", "טורקאט", "炎热喵"],
    ["incineroar", 727, "Incineroar", "אינסינרור", "炽焰咆哮虎"],
    ["popplio", 728, "Popplio", "פופליו", "球球海狮"],
    ["brionne", 729, "Brionne", "בריונה", "花漾海狮"],
    ["primarina", 730, "Primarina", "פרימרינה", "西狮海壬"],
    ["grookey", 810, "Grookey", "גרוקי", "敲音猴"],
    ["thwackey", 811, "Thwackey", "ת׳וואקי", "啪咚猴"],
    ["rillaboom", 812, "Rillaboom", "רילאבום", "轰擂金刚猩"],
    ["scorbunny", 813, "Scorbunny", "סקובאני", "炎兔儿"],
    ["raboot", 814, "Raboot", "רבוט", "腾蹴小将"],
    ["cinderace", 815, "Cinderace", "סינדראס", "闪焰王牌"],
    ["sobble", 816, "Sobble", "סובל", "泪眼蜥"],
    ["drizzile", 817, "Drizzile", "דריזיל", "变涩蜥"],
    ["inteleon", 818, "Inteleon", "אינטלאון", "千面避役"],
    ["sprigatito", 906, "Sprigatito", "ספריגטיטו", "新叶喵"],
    ["floragato", 907, "Floragato", "פלורגטו", "蒂蕾喵"],
    ["meowscarada", 908, "Meowscarada", "מיוסקרדה", "魔幻假面喵"],
    ["fuecoco", 909, "Fuecoco", "פואקוקו", "呆火鳄"],
    ["crocalor", 910, "Crocalor", "קרוקלור", "炙烫鳄"],
    ["skeledirge", 911, "Skeledirge", "סקלטידרג׳", "骨纹巨声鳄"],
    ["quaxly", 912, "Quaxly", "קוואקסלי", "润水鸭"],
    ["quaxwell", 913, "Quaxwell", "קוואקסוול", "涌跃鸭"],
    ["quaquaval", 914, "Quaquaval", "קוואקוואל", "狂欢浪舞鸭"],
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
  const expansionSpecies = [
    ["bellsprout", 69, "Bellsprout", "בלספרוט", "喇叭芽", "Bellsprout"],
    ["weepinbell", 70, "Weepinbell", "וויפינבל", "口呆花", "Weepinbell"],
    ["victreebel", 71, "Victreebel", "ויקטיריבל", "大食花", "Victreebel"],
    ["tentacool", 72, "Tentacool", "טנטקול", "玛瑙水母", "Tentacool"],
    ["tentacruel", 73, "Tentacruel", "טנטקרואל", "毒刺水母", "Tentacruel"],
    ["doduo", 84, "Doduo", "דודואו", "嘟嘟", "Doduo"],
    ["dodrio", 85, "Dodrio", "דודריו", "嘟嘟利", "Dodrio"],
    ["drowzee", 96, "Drowzee", "דרוזי", "催眠貘", "Drowzee"],
    ["hypno", 97, "Hypno", "היפנו", "引梦貘人", "Hypno"],
    ["krabby", 98, "Krabby", "קראבי", "大钳蟹", "Krabby"],
    ["kingler", 99, "Kingler", "קינגלר", "巨钳蟹", "Kingler"],
    ["horsea", 116, "Horsea", "הורסי", "墨海马", "Horsea"],
    ["seadra", 117, "Seadra", "סידרה", "海刺龙", "Seadra"],
    ["kingdra", 230, "Kingdra", "קינגדרה", "刺龙王", "Kingdra"],
    ["spinarak", 167, "Spinarak", "ספינאראק", "圆丝蛛", "Spinarak"],
    ["ariados", 168, "Ariados", "אריאדוס", "阿利多斯", "Ariados"],
    ["aipom", 190, "Aipom", "אייפום", "长尾怪手", "Aipom"],
    ["ambipom", 424, "Ambipom", "אמביפום", "双尾怪手", "Ambipom"],
    ["gligar", 207, "Gligar", "גלייגר", "天蝎", "Gligar"],
    ["gliscor", 472, "Gliscor", "גלייסקור", "天蝎王", "Gliscor"],
    ["lotad", 270, "Lotad", "לוטאד", "莲叶童子", "Lotad"],
    ["lombre", 271, "Lombre", "לומברה", "莲帽小童", "Lombre"],
    ["ludicolo", 272, "Ludicolo", "לודיקולו", "乐天河童", "Ludicolo"],
    ["seedot", 273, "Seedot", "סידוט", "橡实果", "Seedot"],
    ["nuzleaf", 274, "Nuzleaf", "נוזליף", "长鼻叶", "Nuzleaf"],
    ["shiftry", 275, "Shiftry", "שיפטרי", "狡猾天狗", "Shiftry"],
    ["aron", 304, "Aron", "ארון", "可可多拉", "Aron"],
    ["lairon", 305, "Lairon", "ליירון", "可多拉", "Lairon"],
    ["aggron", 306, "Aggron", "אגרון", "波士可多拉", "Aggron"],
    ["electrike", 309, "Electrike", "אלקטרייק", "落雷兽", "Electrike"],
    ["manectric", 310, "Manectric", "מאנקטריק", "雷电兽", "Manectric"],
    ["trapinch", 328, "Trapinch", "טראפינץ׳", "大颚蚁", "Trapinch"],
    ["vibrava", 329, "Vibrava", "ויבראבה", "超音波幼虫", "Vibrava"],
    ["flygon", 330, "Flygon", "פלייגון", "沙漠蜻蜓", "Flygon"],
    ["shroomish", 286, "Shroomish", "שרומיש", "蘑蘑菇", "Shroomish"],
    ["breloom", 287, "Breloom", "ברלום", "斗笠菇", "Breloom"],
    ["cranidos", 408, "Cranidos", "קרנידוס", "头盖龙", "Cranidos"],
    ["rampardos", 409, "Rampardos", "רמפארדוס", "战槌龙", "Rampardos"],
    ["shieldon", 410, "Shieldon", "שילדון", "盾甲龙", "Shieldon"],
    ["bastiodon", 411, "Bastiodon", "בסטיודון", "护城龙", "Bastiodon"],
    ["shellos", 422, "Shellos", "שלוס", "无壳海兔", "Shellos"],
    ["gastrodon", 423, "Gastrodon", "גסטרודון", "海兔兽", "Gastrodon"],
    ["drifloon", 425, "Drifloon", "דריפלון", "飘飘球", "Drifloon"],
    ["drifblim", 426, "Drifblim", "דריפבלים", "随风球", "Drifblim"],
    ["snover", 459, "Snover", "סנובר", "雪笠怪", "Snover"],
    ["abomasnow", 460, "Abomasnow", "אבומסנואו", "暴雪王", "Abomasnow"],
    ["stunky", 434, "Stunky", "סטאנקי", "臭鼬噗", "Stunky"],
    ["skuntank", 435, "Skuntank", "סקאנטנק", "坦克臭鼬", "Skuntank"],
    ["sandile", 551, "Sandile", "סנדייל", "黑眼鳄", "Sandile"],
    ["krokorok", 552, "Krokorok", "קרוקורוק", "混混鳄", "Krokorok"],
    ["krookodile", 553, "Krookodile", "קרוקודייל", "流氓鳄", "Krookodile"],
    ["darumaka", 554, "Darumaka", "דרומקה", "火红不倒翁", "Darumaka"],
    ["darmanitan", 555, "Darmanitan", "דרמניטן", "达摩狒狒", "Darmanitan"],
    ["joltik", 595, "Joltik", "ג׳ולטיק", "电电虫", "Joltik"],
    ["galvantula", 596, "Galvantula", "גאלוונטולה", "电蜘蛛", "Galvantula"],
    ["litwick", 607, "Litwick", "ליטוויק", "烛光灵", "Litwick"],
    ["lampent", 608, "Lampent", "למפנט", "灯火幽灵", "Lampent"],
    ["chandelure", 609, "Chandelure", "שנדלור", "水晶灯火灵", "Chandelure"],
    ["axew", 610, "Axew", "אקסיו", "牙牙", "Axew"],
    ["fraxure", 611, "Fraxure", "פרקסור", "斧牙龙", "Fraxure"],
    ["haxorus", 612, "Haxorus", "הקסורוס", "双斧战龙", "Haxorus"],
    ["golett", 622, "Golett", "גולט", "泥偶小人", "Golett"],
    ["golurk", 623, "Golurk", "גולורק", "泥偶巨人", "Golurk"],
    ["honedge", 679, "Honedge", "הונדג׳", "独剑鞘", "Honedge"],
    ["doublade", 680, "Doublade", "דובלייד", "双剑鞘", "Doublade"],
    ["aegislash", 681, "Aegislash", "איגיסלש", "坚盾剑怪", "Aegislash"],
    ["skiddo", 672, "Skiddo", "סקידו", "坐骑小羊", "Skiddo"],
    ["gogoat", 673, "Gogoat", "גוגואט", "坐骑山羊", "Gogoat"],
    ["goomy", 704, "Goomy", "גומי", "黏黏宝", "Goomy"],
    ["sliggoo", 705, "Sliggoo", "סליגו", "黏美儿", "Sliggoo"],
    ["goodra", 706, "Goodra", "גודרה", "黏美龙", "Goodra"],
    ["phantump", 708, "Phantump", "פאנטמפ", "小木灵", "Phantump"],
    ["trevenant", 709, "Trevenant", "טרבננט", "朽木妖", "Trevenant"],
    ["bergmite", 712, "Bergmite", "ברגמייט", "冰宝", "Bergmite"],
    ["avalugg", 713, "Avalugg", "אבלוג", "冰岩怪", "Avalugg"],
    ["grubbin", 736, "Grubbin", "גרבין", "强颚鸡母虫", "Grubbin"],
    ["charjabug", 737, "Charjabug", "צ׳רג׳אבאג", "虫电宝", "Charjabug"],
    ["vikavolt", 738, "Vikavolt", "ויקאבולט", "锹农炮虫", "Vikavolt"],
    ["salandit", 757, "Salandit", "סלנדיט", "夜盗火蜥", "Salandit"],
    ["salazzle", 758, "Salazzle", "סלאזל", "焰后蜥", "Salazzle"],
    ["mareanie", 747, "Mareanie", "מריאני", "好坏星", "Mareanie"],
    ["toxapex", 748, "Toxapex", "טוקספקס", "超坏星", "Toxapex"],
    ["jangmo-o", 782, "Jangmo-o", "ג׳אנגמו־או", "心鳞宝", "Jangmo-o"],
    ["hakamo-o", 783, "Hakamo-o", "האקאמו־או", "鳞甲龙", "Hakamo-o"],
    ["kommo-o", 784, "Kommo-o", "קומו־או", "杖尾鳞甲龙", "Kommo-o"],
    ["morelull", 755, "Morelull", "מורלול", "睡睡菇", "Morelull"],
    ["shiinotic", 756, "Shiinotic", "שינוטיק", "灯罩夜菇", "Shiinotic"],
    ["rookidee", 821, "Rookidee", "רוקידי", "稚山雀", "Rookidee"],
    ["corvisquire", 822, "Corvisquire", "קורוויסקוויר", "蓝鸦", "Corvisquire"],
    ["corviknight", 823, "Corviknight", "קורוויקנייט", "钢铠鸦", "Corviknight"],
    ["blipbug", 824, "Blipbug", "בליפבאג", "索侦虫", "Blipbug"],
    ["dottler", 825, "Dottler", "דוטלר", "天罩虫", "Dottler"],
    ["orbeetle", 826, "Orbeetle", "אורביטל", "以欧路普", "Orbeetle"],
    ["toxel", 848, "Toxel", "טוקסל", "毒电婴", "Toxel"],
    ["toxtricity", 849, "Toxtricity", "טוקסטריסיטי", "颤弦蝾螈", "Toxtricity"],
    ["impidimp", 859, "Impidimp", "אימפידימפ", "捣蛋小妖", "Impidimp"],
    ["morgrem", 860, "Morgrem", "מורגרם", "诈唬魔", "Morgrem"],
    ["grimmsnarl", 861, "Grimmsnarl", "גרימסנארל", "长毛巨魔", "Grimmsnarl"],
    ["silicobra", 843, "Silicobra", "סיליקוברה", "沙包蛇", "Silicobra"],
    ["sandaconda", 844, "Sandaconda", "סנדקונדה", "沙螺蟒", "Sandaconda"],
    ["cufant", 878, "Cufant", "קיופנט", "铜象", "Cufant"],
    ["copperajah", 879, "Copperajah", "קופראג׳ה", "大王铜象", "Copperajah"],
    ["sizzlipede", 850, "Sizzlipede", "סיזליפיד", "烧火蚣", "Sizzlipede"],
    ["centiskorch", 851, "Centiskorch", "סנטיסקורץ׳", "焚焰蚣", "Centiskorch"],
    ["pawmi", 921, "Pawmi", "פאומי", "布拨", "Pawmi"],
    ["pawmo", 922, "Pawmo", "פאומו", "布土拨", "Pawmo"],
    ["pawmot", 923, "Pawmot", "פאומוט", "巴布土拨", "Pawmot"],
    ["tarountula", 917, "Tarountula", "טרונטולה", "团珠蛛", "Tarountula"],
    ["spidops", 918, "Spidops", "ספיידופס", "操陷蛛", "Spidops"],
    ["nacli", 932, "Nacli", "נאקלי", "盐石宝", "Nacli"],
    ["naclstack", 933, "Naclstack", "נאקלאקסטאק", "盐石垒", "Naclstack"],
    ["garganacl", 934, "Garganacl", "גרגנאקל", "盐石巨灵", "Garganacl"],
    ["tadbulb", 938, "Tadbulb", "טדבולב", "光蚪仔", "Tadbulb"],
    ["bellibolt", 939, "Bellibolt", "בליבולט", "电肚蛙", "Bellibolt"],
    ["shroodle", 944, "Shroodle", "שרודל", "滋汁鼹", "Shroodle"],
    ["grafaiai", 945, "Grafaiai", "גרפאיאי", "涂标客", "Grafaiai"],
    ["frigibax", 996, "Frigibax", "פריגיבקס", "凉脊龙", "Frigibax"],
    ["arctibax", 997, "Arctibax", "ארקטיבקס", "冻脊龙", "Arctibax"],
    ["baxcalibur", 998, "Baxcalibur", "באקסקליבר", "戟脊龙", "Baxcalibur"],
  ];
  const POKEMON = Object.fromEntries(
    [...species, ...expansionSpecies].map(([id, dex, en, he, zh, es]) => [
      id, { dex, en, he, zh, es: es || en },
    ]),
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
    // Johto species remain in the tower catalog so old saved placements of
    // evolved forms can still be restored. The shop derives its base-only
    // choices from the evolution paths below.
    totodile: makeTower("totodile", "water", 68, 20, ["croconaw", "feraligatr"], { range: 180, splash: 36 }),
    croconaw: makeTower("croconaw", "water", 108, 34, ["feraligatr"], { range: 185, splash: 44 }),
    feraligatr: makeTower("feraligatr", "water", 175, 58, [], { range: 190, splash: 62 }),
    cyndaquil: makeTower("cyndaquil", "fire", 68, 24, ["quilava", "typhlosion"], { rate: 0.8, splash: 40 }),
    quilava: makeTower("quilava", "fire", 108, 38, ["typhlosion"], { rate: 0.78, splash: 52 }),
    typhlosion: makeTower("typhlosion", "fire", 175, 64, [], { range: 200, splash: 78 }),
    mareep: makeTower("mareep", "electric", 62, 17, ["flaaffy", "ampharos"], { range: 185, rate: 0.68 }),
    flaaffy: makeTower("flaaffy", "electric", 100, 26, ["ampharos"], { range: 205, rate: 0.64 }),
    ampharos: makeTower("ampharos", "electric", 165, 40, [], { range: 240, rate: 0.6 }),
    chinchou: makeTower("chinchou", "electric", 66, 16, ["lanturn"], { range: 195, slow: 0.6 }),
    lanturn: makeTower("lanturn", "electric", 125, 30, [], { range: 220, slow: 0.9, rate: 0.72 }),
    marill: makeTower("marill", "water", 60, 16, ["azumarill"], { range: 180, rate: 0.7 }),
    azumarill: makeTower("azumarill", "water", 120, 35, [], { range: 185, splash: 64 }),
    hoppip: makeTower("hoppip", "grass", 48, 12, ["skiploom", "jumpluff"], { range: 215, slow: 1.3 }),
    skiploom: makeTower("skiploom", "grass", 78, 20, ["jumpluff"], { range: 225, slow: 1.5 }),
    jumpluff: makeTower("jumpluff", "grass", 125, 29, [], { range: 240, rate: 0.72, slow: 1.8 }),
    sunkern: makeTower("sunkern", "grass", 42, 13, ["sunflora"], { range: 175, rate: 0.95 }),
    sunflora: makeTower("sunflora", "grass", 100, 33, [], { range: 210, splash: 46 }),
    wooper: makeTower("wooper", "ground", 58, 22, ["quagsire"], { range: 175, splash: 40, slow: 0.9 }),
    quagsire: makeTower("quagsire", "ground", 118, 46, [], { range: 180, splash: 72, slow: 1.2 }),
    teddiursa: makeTower("teddiursa", "normal", 65, 23, ["ursaring"], { range: 170, rate: 0.76 }),
    ursaring: makeTower("ursaring", "normal", 145, 58, [], { range: 175, rate: 0.85, splash: 42 }),
    slugma: makeTower("slugma", "fire", 62, 26, ["magcargo"], { range: 170, rate: 1.05, splash: 54 }),
    magcargo: makeTower("magcargo", "fire", 130, 52, [], { range: 180, rate: 1.08, splash: 80 }),
    swinub: makeTower("swinub", "ice", 60, 18, ["piloswine"], { range: 180, splash: 32, slow: 1.5 }),
    piloswine: makeTower("piloswine", "ice", 125, 39, [], { range: 190, splash: 62, slow: 2 }),
    houndour: makeTower("houndour", "dark", 74, 23, ["houndoom"], { rate: 0.76, slow: 1.2 }),
    houndoom: makeTower("houndoom", "dark", 145, 46, [], { range: 215, rate: 0.78, splash: 46 }),
    skarmory: makeTower("skarmory", "steel", 145, 38, [], { range: 225, rate: 0.74, splash: 34 }),
    shuckle: makeTower("shuckle", "bug", 80, 15, [], { range: 180, rate: 0.9, slow: 2.1, splash: 42 }),
    treecko: makeTower("treecko", "grass", 68, 20, ["grovyle", "sceptile"], { range: 210, slow: 0.7 }),
    turtwig: makeTower("turtwig", "grass", 66, 19, ["grotle", "torterra"], { range: 190, slow: 1.1 }),
    chimchar: makeTower("chimchar", "fire", 70, 24, ["monferno", "infernape"], { rate: 0.78, splash: 42 }),
    snivy: makeTower("snivy", "grass", 72, 19, ["servine", "serperior"], { range: 225, rate: 0.78, slow: 0.9 }),
    tepig: makeTower("tepig", "fire", 72, 25, ["pignite", "emboar"], { range: 175, splash: 58 }),
    oshawott: makeTower("oshawott", "water", 72, 21, ["dewott", "samurott"], { range: 195, splash: 44, slow: 0.5 }),
    chespin: makeTower("chespin", "grass", 74, 20, ["quilladin", "chesnaught"], { range: 185, slow: 1.1 }),
    fennekin: makeTower("fennekin", "fire", 74, 27, ["braixen", "delphox"], { range: 225, rate: 0.88, splash: 48 }),
    froakie: makeTower("froakie", "water", 74, 19, ["frogadier", "greninja"], { range: 220, rate: 0.62, slow: 0.6 }),
    litten: makeTower("litten", "fire", 76, 27, ["torracat", "incineroar"], { range: 175, rate: 0.76, splash: 48 }),
    popplio: makeTower("popplio", "water", 76, 21, ["brionne", "primarina"], { range: 210, splash: 58, slow: 0.7 }),
    grookey: makeTower("grookey", "grass", 78, 22, ["thwackey", "rillaboom"], { range: 190, slow: 0.8 }),
    scorbunny: makeTower("scorbunny", "fire", 78, 25, ["raboot", "cinderace"], { range: 185, rate: 0.68, splash: 38 }),
    sobble: makeTower("sobble", "water", 78, 20, ["drizzile", "inteleon"], { range: 235, rate: 0.76, slow: 0.6 }),
    sprigatito: makeTower("sprigatito", "grass", 82, 23, ["floragato", "meowscarada"], { range: 220, rate: 0.72, slow: 0.9 }),
    fuecoco: makeTower("fuecoco", "fire", 82, 29, ["crocalor", "skeledirge"], { range: 180, splash: 62 }),
    quaxly: makeTower("quaxly", "water", 82, 22, ["quaxwell", "quaquaval"], { range: 195, rate: 0.68, splash: 44 }),
  };

  const EXPANSION_TOWER_SPECS = [
    ["bellsprout", "grass", 56, 15, ["weepinbell", "victreebel"], { range: 208, slow: 1.15, splash: 30 }],
    ["tentacool", "water", 64, 18, ["tentacruel"], { range: 210, slow: 1, splash: 45 }],
    ["doduo", "normal", 58, 17, ["dodrio"], { range: 188, rate: 0.56, splash: 20 }],
    ["drowzee", "psychic", 65, 19, ["hypno"], { range: 245, slow: 1.1, splash: 38 }],
    ["krabby", "water", 62, 22, ["kingler"], { range: 175, rate: 0.72, splash: 60 }],
    ["horsea", "water", 66, 18, ["seadra", "kingdra"], { range: 215, rate: 0.68, slow: 0.5, splash: 32 }],
    ["spinarak", "bug", 52, 13, ["ariados"], { range: 205, slow: 1.1, splash: 30 }],
    ["aipom", "normal", 65, 17, ["ambipom"], { range: 195, rate: 0.6, splash: 26 }],
    ["gligar", "ground", 78, 24, ["gliscor"], { range: 190, slow: 1.2, splash: 45 }],
    ["lotad", "water", 61, 16, ["lombre", "ludicolo"], { range: 200, slow: 1.1, splash: 34 }],
    ["seedot", "grass", 53, 15, ["nuzleaf", "shiftry"], { range: 192, slow: 0.7, splash: 30 }],
    ["aron", "steel", 82, 28, ["lairon", "aggron"], { range: 185, splash: 58 }],
    ["electrike", "electric", 68, 21, ["manectric"], { range: 210, rate: 0.55 }],
    ["trapinch", "ground", 72, 25, ["vibrava", "flygon"], { range: 180, splash: 68, slow: 0.4 }],
    ["shroomish", "grass", 58, 16, ["breloom"], { range: 210, slow: 1.6, splash: 24 }],
    ["cranidos", "rock", 78, 28, ["rampardos"], { range: 180, splash: 75, rate: 1.1 }],
    ["shieldon", "rock", 75, 14, ["bastiodon"], { range: 200, slow: 0.8, splash: 32 }],
    ["shellos", "water", 66, 18, ["gastrodon"], { range: 195, slow: 1, splash: 55 }],
    ["drifloon", "ghost", 68, 19, ["drifblim"], { range: 230, slow: 1.1, splash: 48 }],
    ["snover", "grass", 68, 21, ["abomasnow"], { range: 210, slow: 1.6, splash: 55 }],
    ["stunky", "dark", 63, 20, ["skuntank"], { range: 200, slow: 1, splash: 42 }],
    ["sandile", "ground", 70, 22, ["krokorok", "krookodile"], { range: 185, slow: 0.7, splash: 58 }],
    ["darumaka", "fire", 66, 30, ["darmanitan"], { range: 175, rate: 0.84, splash: 58 }],
    ["joltik", "bug", 60, 18, ["galvantula"], { range: 210, rate: 0.54, slow: 0.6 }],
    ["litwick", "ghost", 76, 25, ["lampent", "chandelure"], { range: 235, slow: 1.3, splash: 45 }],
    ["axew", "dragon", 78, 27, ["fraxure", "haxorus"], { range: 205, rate: 0.78, splash: 48 }],
    ["golett", "ground", 77, 24, ["golurk"], { range: 180, splash: 76, slow: 0.5 }],
    ["honedge", "steel", 75, 22, ["doublade", "aegislash"], { range: 215, rate: 0.62, splash: 42 }],
    ["skiddo", "grass", 65, 19, ["gogoat"], { range: 205, slow: 1.1, splash: 30 }],
    ["goomy", "dragon", 74, 15, ["sliggoo", "goodra"], { range: 235, slow: 1.2, splash: 45 }],
    ["phantump", "ghost", 64, 19, ["trevenant"], { range: 215, slow: 1.3, splash: 46 }],
    ["bergmite", "ice", 65, 18, ["avalugg"], { range: 185, slow: 1.7, splash: 64 }],
    ["grubbin", "bug", 60, 16, ["charjabug", "vikavolt"], { range: 190, rate: 0.7, splash: 28 }],
    ["salandit", "fire", 76, 25, ["salazzle"], { range: 215, rate: 0.78, splash: 56 }],
    ["mareanie", "water", 68, 18, ["toxapex"], { range: 205, slow: 1.1, splash: 48 }],
    ["jangmo-o", "dragon", 82, 24, ["hakamo-o", "kommo-o"], { range: 210, rate: 0.8, splash: 54 }],
    ["morelull", "grass", 62, 14, ["shiinotic"], { range: 210, slow: 1.5, splash: 65 }],
    ["rookidee", "normal", 70, 19, ["corvisquire", "corviknight"], { range: 215, rate: 0.68, splash: 34 }],
    ["blipbug", "bug", 55, 14, ["dottler", "orbeetle"], { range: 205, slow: 0.8, splash: 36 }],
    ["toxel", "electric", 82, 20, ["toxtricity"], { range: 210, rate: 0.67 }],
    ["impidimp", "dark", 75, 23, ["morgrem", "grimmsnarl"], { range: 215, slow: 1.1, splash: 42 }],
    ["silicobra", "ground", 70, 22, ["sandaconda"], { range: 180, slow: 0.9, splash: 62 }],
    ["cufant", "steel", 75, 24, ["copperajah"], { range: 190, splash: 66 }],
    ["sizzlipede", "fire", 66, 25, ["centiskorch"], { range: 190, splash: 70 }],
    ["pawmi", "electric", 68, 18, ["pawmo", "pawmot"], { range: 205, rate: 0.58 }],
    ["tarountula", "bug", 55, 15, ["spidops"], { range: 205, slow: 0.9, splash: 30 }],
    ["nacli", "rock", 70, 22, ["naclstack", "garganacl"], { range: 185, slow: 0.5, splash: 70 }],
    ["tadbulb", "electric", 65, 18, ["bellibolt"], { range: 195, rate: 0.7, splash: 28 }],
    ["shroodle", "normal", 60, 16, ["grafaiai"], { range: 205, slow: 1.1, splash: 36 }],
    ["frigibax", "dragon", 80, 26, ["arctibax", "baxcalibur"], { range: 220, slow: 1.7, splash: 54 }],
  ];
  const EXPANSION_BASE_IDS = EXPANSION_TOWER_SPECS.map(([id]) => id);
  Object.assign(ADDITIONAL_TOWERS, Object.fromEntries(
    EXPANSION_TOWER_SPECS.map(([id, element, cost, damage, forms, overrides]) => [
      id, makeTower(id, element, cost, damage, forms, overrides),
    ]),
  ));

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
  // Compact routes change the tactics, not just the size of the original trail.
  MAPS.switchback = {
    ...MAPS.classic,
    buildTop: 80, goal: { x: 1535, y: 730 },
    path: [
      [-60, 130], [1400, 130], [1400, 330], [200, 330],
      [200, 530], [1400, 530], [1400, 730], [1660, 730],
    ],
    blockers: [
      { type: "pond", x: 720, y: 230, rx: 95, ry: 25 },
      { type: "grove", x: 1050, y: 430, rx: 65, ry: 25 },
      { type: "cliff", x: 580, y: 630, rx: 80, ry: 25 },
      { type: "grove", x: 340, y: 810, rx: 75, ry: 30 },
    ],
    theme: { ...MAPS.classic.theme, field: ["#b8de91", "#669951"] },
  };
  MAPS.spiral = {
    ...MAPS.coast, width: 1600, height: 900, buildTop: 80,
    goal: { x: 760, y: 460 },
    path: [
      [-60, 140], [1420, 140], [1420, 780], [180, 780],
      [180, 350], [1170, 350], [1170, 600], [540, 600],
      [540, 460], [760, 460],
    ],
    blockers: [
      { type: "pond", x: 850, y: 690, rx: 120, ry: 22 },
      { type: "grove", x: 720, y: 245, rx: 95, ry: 28 },
      { type: "cliff", x: 330, y: 520, rx: 35, ry: 65 },
      { type: "grove", x: 1290, y: 570, rx: 30, ry: 60 },
    ],
    theme: { ...MAPS.coast.theme, field: ["#91cda3", "#398783"], leaves: ["#235e62", "#388e70"] },
  };
  // A single rounded polyline is the contract for paint, motion, targeting and
  // build exclusion. Quadratic corners stay within their adjacent segments and
  // are sampled deterministically, never dependent on frame rate or camera.
  function sampleRoute(waypoints) {
    const points = [{ ...waypoints[0] }];
    const append = (point) => {
      const previous = points[points.length - 1];
      const steps = Math.max(1, Math.ceil(Math.hypot(point.x - previous.x, point.y - previous.y) / 12));
      for (let i = 1; i <= steps; i++) {
        points.push({ x: previous.x + (point.x - previous.x) * i / steps, y: previous.y + (point.y - previous.y) * i / steps });
      }
    };
    for (let i = 1; i < waypoints.length - 1; i++) {
      const a = waypoints[i - 1], b = waypoints[i], c = waypoints[i + 1];
      const before = Math.hypot(b.x - a.x, b.y - a.y), after = Math.hypot(c.x - b.x, c.y - b.y);
      const radius = Math.min(90, before * 0.3, after * 0.3);
      const entry = { x: b.x + (a.x - b.x) * radius / before, y: b.y + (a.y - b.y) * radius / before };
      const exit = { x: b.x + (c.x - b.x) * radius / after, y: b.y + (c.y - b.y) * radius / after };
      append(entry);
      for (let n = 1, steps = Math.ceil(radius / 5); n <= steps; n++) {
        const t = n / steps, u = 1 - t;
        append({ x: u * u * entry.x + 2 * u * t * b.x + t * t * exit.x, y: u * u * entry.y + 2 * u * t * b.y + t * t * exit.y });
      }
    }
    append(waypoints[waypoints.length - 1]);
    let distance = 0;
    return points.map((point, i) => {
      if (i) distance += Math.hypot(point.x - points[i - 1].x, point.y - points[i - 1].y);
      return { ...point, distance };
    });
  }
  function routeDistance(route, x, y) {
    let minimum = Infinity;
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1], b = route[i], dx = b.x - a.x, dy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      minimum = Math.min(minimum, Math.hypot(x - a.x - t * dx, y - a.y - t * dy));
    }
    return minimum;
  }
  function advanceRoute(route, traveler, distance) {
    let remaining = distance;
    while (traveler.segment < route.length - 1) {
      const next = route[traveler.segment + 1];
      const dx = next.x - traveler.x, dy = next.y - traveler.y, length = Math.hypot(dx, dy);
      if (length > remaining) {
        traveler.x += dx / length * remaining;
        traveler.y += dy / length * remaining;
        return;
      }
      traveler.x = next.x;
      traveler.y = next.y;
      traveler.segment++;
      remaining -= length;
      if (remaining <= 0) return;
    }
  }
  function routeProgress(route, traveler) {
    const start = route[traveler.segment];
    return start.distance + Math.hypot(traveler.x - start.x, traveler.y - start.y);
  }
  Object.values(MAPS).forEach((map) => {
    map.path = map.path.map(([x, y]) => ({ x, y }));
    map.route = sampleRoute(map.path);
    // The visible sanctuary sits on the road, not beside an unrelated endpoint.
    if (map !== MAPS.spiral) {
      const last = map.route[map.route.length - 1], before = map.route[map.route.length - 12];
      map.goal = { x: before.x + (last.x - before.x) * 0.15, y: before.y + (last.y - before.y) * 0.15 };
    }
  });

  function bossCount(wave, difficulty) {
    if (difficulty === "easy") return 1;
    const round = Math.max(1, Math.floor(wave / 5));
    return Math.min(5, (difficulty === "hard" ? 3 : 2) + Math.floor((round - 1) / 2));
  }

  function bossWaveReward(wave, defeated, total) {
    return total > 0 && defeated === total ? 45 + wave * 4 : 12;
  }

  // Easy only briefly stuns. Other tiers need three warned hits to knock out a
  // defender; relocating out of the marked circle avoids the hit altogether.
  function towerStrike(durability, difficulty) {
    return {
      durability: difficulty === "easy" ? durability : Math.max(0, durability - 1),
      stun: difficulty === "easy" ? 1.2 : difficulty === "hard" ? 3 : 2,
    };
  }

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

  function shopTowerIds(towerTypes, eeveeEvolutions = EEVEE_EVOLUTIONS) {
    const evolvedForms = new Set();
    for (const [id, tower] of Object.entries(towerTypes)) {
      for (const form of tower.evolutions || []) {
        const formId = form.image.replace(/Animated$/, "");
        if (formId !== id && !form.mastery) evolvedForms.add(formId);
      }
    }
    if (towerTypes.eevee) {
      for (const formId of Object.keys(eeveeEvolutions)) evolvedForms.add(formId);
    }
    return Object.keys(towerTypes).filter((id) => !evolvedForms.has(id));
  }

  window.PokemonTDData = {
    POKEMON, ELEMENTS, ADDITIONAL_TOWERS, EXPANSION_BASE_IDS, EEVEE_EVOLUTIONS, ADDITIONAL_ENEMY_FAMILIES,
    ADDITIONAL_BOSSES, DIFFICULTIES, MAPS, sampleRoute, routeDistance, advanceRoute, routeProgress, clampCamera, screenToWorld, bossCount, bossWaveReward, towerStrike,
    shuffled, waveCount, buildWavePlan, enemyStats, towerType, towerStats, shopTowerIds,
  };
})();

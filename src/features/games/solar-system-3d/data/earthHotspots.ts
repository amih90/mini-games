// 20 curated Earth hotspots with kid-friendly facts in 4 locales
// Lat/lon in degrees — converted to 3D sphere coords at render time

export type HotspotCategory = 'nature' | 'geography' | 'history' | 'science' | 'monument' | 'ocean' | 'wildlife';

export interface EarthHotspot {
  id: string;
  name: string;
  emoji: string;
  lat: number;  // degrees, -90 to 90
  lon: number;  // degrees, -180 to 180
  category: HotspotCategory;
  facts: Record<string, string>;
}

export const EARTH_HOTSPOTS: EarthHotspot[] = [
  {
    id: 'amazon',
    name: 'Amazon Rainforest', emoji: '🌿',
    lat: -3.5, lon: -60.0, category: 'nature',
    facts: {
      en: 'The Amazon is home to 10% of ALL species on Earth! It produces 20% of the world\'s oxygen — that\'s why it\'s called the "lungs of the Earth".',
      he: 'האמזון הוא בית ל-10% מכל המינים על כדור הארץ! הוא מייצר 20% מהחמצן בעולם — לכן הוא נקרא "ריאות כדור הארץ".',
      zh: '亚马逊雨林是地球上10%所有物种的家园！它产生全球20%的氧气——这就是为什么它被称为"地球之肺"。',
      es: '¡La Amazonia es hogar del 10% de TODAS las especies de la Tierra! Produce el 20% del oxígeno del mundo — por eso se llama "los pulmones de la Tierra".',
    },
  },
  {
    id: 'great-wall',
    name: 'Great Wall of China', emoji: '🏯',
    lat: 40.4, lon: 116.6, category: 'history',
    facts: {
      en: 'The Great Wall stretches 21,196 km — that\'s longer than the distance from the North Pole to the South Pole! It took over 2,000 years and millions of workers to build.',
      he: 'החומה הגדולה משתרעת 21,196 ק"מ — זה יותר ממרחק הקוטב הצפוני לדרומי! בניית החומה ארכה יותר מ-2,000 שנה.',
      zh: '长城绵延21196公里——比从北极到南极的距离还长！建造它花了2000多年，动用了数百万工人。',
      es: '¡La Gran Muralla se extiende 21,196 km — ¡más que la distancia del Polo Norte al Sur! Tardó más de 2,000 años y millones de trabajadores en construirse.',
    },
  },
  {
    id: 'everest',
    name: 'Mount Everest', emoji: '🏔️',
    lat: 27.9881, lon: 86.9250, category: 'geography',
    facts: {
      en: 'Mount Everest is so tall (8,849 m) that if you stacked 9 Eiffel Towers on top of each other, you\'d barely reach the summit! It still grows about 4mm per year.',
      he: 'הר אוורסט גבוה כל כך (8,849 מ\') שאם היית מסדר 9 מגדלי אייפל, בקושי הגעת לפסגה! הוא עדיין גדל כ-4 מ"מ בשנה.',
      zh: '珠穆朗玛峰高达8849米——如果把9座埃菲尔铁塔叠在一起，才勉强到达顶峰！它每年仍然生长约4毫米。',
      es: '¡El Everest es tan alto (8,849 m) que si apiláramos 9 Torres Eiffel, apenas llegaríamos a la cima! Todavía crece unos 4 mm al año.',
    },
  },
  {
    id: 'sahara',
    name: 'Sahara Desert', emoji: '🏜️',
    lat: 23.0, lon: 12.0, category: 'geography',
    facts: {
      en: 'The Sahara is bigger than the entire United States! Despite being the hottest desert, ice and frost can sometimes form at night. 6,000 years ago it was a lush, green landscape.',
      he: 'הסהרה גדולה יותר מארצות הברית כולה! למרות שהיא המדבר החם ביותר, לפעמים נוצר קרח בלילה. לפני 6,000 שנה היה כאן נוף ירוק ושופע.',
      zh: '撒哈拉沙漠比整个美国还大！尽管是最热的沙漠，夜晚有时会形成冰霜。6000年前它是一片郁郁葱葱的绿色景观。',
      es: '¡El Sahara es más grande que todo Estados Unidos! A pesar de ser el desierto más caliente, el hielo puede formarse por las noches. Hace 6,000 años era un paisaje verde y exuberante.',
    },
  },
  {
    id: 'great-barrier-reef',
    name: 'Great Barrier Reef', emoji: '🐠',
    lat: -18.0, lon: 147.0, category: 'nature',
    facts: {
      en: 'The Great Barrier Reef is the world\'s largest living structure — so big it\'s visible from space! It\'s home to over 9,000 species including 1,500 types of fish and 4,000 types of mollusk.',
      he: 'שונית המחסום הגדולה היא המבנה החי הגדול ביותר בעולם — גדולה כל כך שניתן לראותה מהחלל! יש בה מעל 9,000 מינים.',
      zh: '大堡礁是世界上最大的生命体——大到可以从太空看到！它是9000多种生物的家园，包括1500种鱼和4000种软体动物。',
      es: '¡La Gran Barrera de Coral es la estructura viva más grande del mundo — tan grande que es visible desde el espacio! Es hogar de más de 9,000 especies.',
    },
  },
  {
    id: 'antarctica',
    name: 'Antarctica', emoji: '🧊',
    lat: -90.0, lon: 0.0, category: 'science',
    facts: {
      en: 'Antarctica holds 90% of Earth\'s fresh water! It\'s technically a desert (less rain than the Sahara) and the coldest, windiest, driest continent. Scientists have found over 400 lakes hidden under 4 km of ice!',
      he: 'אנטארקטיקה מחזיקה 90% ממים המתוקים של כדור הארץ! היא טכנית מדבר (פחות גשם מהסהרה) והיבשת הקרה, הסוערת והיבשה ביותר.',
      zh: '南极洲储存着地球90%的淡水！它在技术上是一片沙漠（降雨量比撒哈拉还少），是最寒冷、风最大、最干燥的大陆。科学家发现了4公里冰层下隐藏着400多个湖泊！',
      es: '¡La Antártida contiene el 90% del agua dulce de la Tierra! Técnicamente es un desierto (menos lluvia que el Sahara) y el continente más frío, ventoso y seco. ¡Los científicos han encontrado más de 400 lagos bajo 4 km de hielo!',
    },
  },
  {
    id: 'mariana-trench',
    name: 'Mariana Trench', emoji: '🌊',
    lat: 11.35, lon: 142.2, category: 'science',
    facts: {
      en: 'The Mariana Trench is the deepest place on Earth at 11 km — that\'s 29 stacked Eiffel Towers! The pressure at the bottom is 1,000 times greater than at sea level, yet creatures still live there.',
      he: 'תעלת מריאנה היא המקום העמוק ביותר על כדור הארץ ב-11 ק"מ — זה 29 מגדלי אייפל מוערמים! לחץ המים בתחתית גבוה פי 1,000.',
      zh: '马里亚纳海沟是地球上最深的地方，深达11公里——相当于叠放29座埃菲尔铁塔！底部的压力是海平面的1000倍，但那里仍有生物生存。',
      es: '¡La Fosa de las Marianas es el lugar más profundo de la Tierra a 11 km — eso es 29 Torres Eiffel apiladas! La presión en el fondo es 1,000 veces mayor que al nivel del mar.',
    },
  },
  {
    id: 'nile',
    name: 'Nile River', emoji: '🐊',
    lat: 15.0, lon: 32.5, category: 'history',
    facts: {
      en: 'The Nile is one of the longest rivers on Earth at 6,650 km! Ancient Egyptian civilization was entirely built around it. Without the Nile\'s annual floods, the pyramids could never have been built.',
      he: 'הנילוס הוא אחד הנהרות הארוכים ביותר על כדור הארץ ב-6,650 ק"מ! הציוויליזציה המצרית העתיקה נבנתה כולה סביבו.',
      zh: '尼罗河全长6650公里，是地球上最长的河流之一！古埃及文明完全建立在它周围。没有尼罗河的年度洪水，金字塔根本无法建造。',
      es: '¡El Nilo es uno de los ríos más largos de la Tierra con 6,650 km! La civilización egipcia antigua fue construida enteramente alrededor de él. Sin las inundaciones anuales del Nilo, las pirámides nunca habrían podido construirse.',
    },
  },
  {
    id: 'northern-lights',
    name: 'Northern Lights', emoji: '🌌',
    lat: 70.0, lon: 25.0, category: 'science',
    facts: {
      en: 'The Northern Lights (Aurora Borealis) happen when solar particles slam into Earth\'s magnetic field at 45 million mph! These collisions create curtains of green, pink, and purple light dancing across the Arctic sky.',
      he: 'הזוהר הצפוני נוצר כאשר חלקיקים סולאריים פוגעים בשדה המגנטי של כדור הארץ במהירות של 70 מיליון קמ"ש!',
      zh: '北极光（极光）是当太阳粒子以每小时7200万公里的速度撞击地球磁场时产生的！这些碰撞在北极天空中创造出绿色、粉红色和紫色的光帘。',
      es: '¡Las Auroras Boreales ocurren cuando partículas solares golpean el campo magnético de la Tierra a 72 millones km/h! Estas colisiones crean cortinas de luz verde, rosa y morada danzando sobre el cielo ártico.',
    },
  },
  {
    id: 'grand-canyon',
    name: 'Grand Canyon', emoji: '🏜️',
    lat: 36.1, lon: -112.1, category: 'geography',
    facts: {
      en: 'The Grand Canyon is 446 km long, up to 29 km wide, and over 1.6 km deep! The Colorado River carved it over 5-6 million years, exposing rocks that are nearly 2 billion years old.',
      he: 'הגרנד קניון ארוך 446 ק"מ, רחב עד 29 ק"מ ועמוק יותר מ-1.6 ק"מ! נהר קולורדו חצב אותו במשך 5-6 מיליון שנה.',
      zh: '大峡谷长446公里，宽达29公里，深超过1.6公里！科罗拉多河花了500-600万年将其切割，露出了近20亿年前的岩石。',
      es: '¡El Gran Cañón tiene 446 km de largo, hasta 29 km de ancho y más de 1.6 km de profundidad! El río Colorado lo esculpió durante 5-6 millones de años, exponiendo rocas de casi 2 mil millones de años.',
    },
  },
  {
    id: 'victoria-falls',
    name: 'Victoria Falls', emoji: '💦',
    lat: -17.9, lon: 25.85, category: 'geography',
    facts: {
      en: 'Victoria Falls is the world\'s largest waterfall — its spray can be seen from 50 km away! Local tribes called it "Mosi-oa-Tunya" which means "The Smoke That Thunders".',
      he: '\'מפל ויקטוריה הוא המפל הגדול בעולם — הריסוס שלו נראה מ-50 ק"מ! שבטי המקום קראו לו "מוסי-אוא-טוניה" שפירושו "העשן שמרעים".',
      zh: '维多利亚瀑布是世界上最大的瀑布——它的水雾可以从50公里外看到！当地部落称它为"莫西奥图尼亚"，意为"惊雷之烟"。',
      es: '¡Las Cataratas Victoria son la cascada más grande del mundo — su rociado puede verse desde 50 km! Las tribus locales la llamaban "Mosi-oa-Tunya" que significa "El Humo que Truena".',
    },
  },
  {
    id: 'himalaya',
    name: 'Himalayas', emoji: '⛰️',
    lat: 29.0, lon: 84.0, category: 'geography',
    facts: {
      en: 'The Himalayas have 10 of the 14 mountains taller than 8,000 m! They were formed when India crashed into Asia 50 million years ago and are still growing today at about 5 mm per year.',
      he: 'להימלאיה יש 10 מתוך 14 ההרים הגבוהים מ-8,000 מ\'! הם נוצרו כאשר הודו התנגשה באסיה לפני 50 מיליון שנה.',
      zh: '喜马拉雅山脉拥有14座超过8000米高山中的10座！它们是5000万年前印度板块与亚洲碰撞时形成的，今天仍以每年约5毫米的速度增长。',
      es: '¡El Himalaya tiene 10 de las 14 montañas más altas de 8,000 m! Se formaron cuando India chocó con Asia hace 50 millones de años y todavía crecen hoy unos 5 mm al año.',
    },
  },
  {
    id: 'dead-sea',
    name: 'Dead Sea', emoji: '🌊',
    lat: 31.5, lon: 35.5, category: 'science',
    facts: {
      en: 'The Dead Sea is the lowest place on Earth at 430 m below sea level! Its water is 10 times saltier than the ocean — you can float without swimming. No fish can live in it.',
      he: 'ים המלח הוא המקום הנמוך ביותר על כדור הארץ ב-430 מ\' מתחת לפני הים! מימיו מלוחים פי 10 מהאוקיינוס — אתה יכול לצוף בלי לשחות.',
      zh: '死海是地球上最低的地方，海拔低于海平面430米！其水的盐度是海洋的10倍——你可以不游泳就漂浮。没有鱼能在里面生存。',
      es: '¡El Mar Muerto es el lugar más bajo de la Tierra a 430 m bajo el nivel del mar! Su agua es 10 veces más salada que el océano — puedes flotar sin nadar. Ningún pez puede vivir en él.',
    },
  },
  {
    id: 'sahara-eye',
    name: 'Eye of the Sahara', emoji: '👁️',
    lat: 21.12, lon: -11.4, category: 'science',
    facts: {
      en: 'The "Eye of the Sahara" (Richat Structure) is a massive 50 km wide bulls-eye in the Mauritanian desert — visible from space! Scientists think it was created by erosion of a rock dome, not a meteor.',
      he: '"עיין הסהרה" היא עיגול ענק של 50 ק"מ רוחב במדבר מוריטניה — נראה מהחלל! מדענים חושבים שנוצר משחיקה של כיפת סלע.',
      zh: '"撒哈拉之眼"（Richat构造）是毛里塔尼亚沙漠中直径50公里的巨大靶心——从太空可见！科学家认为它是由岩石圆顶被侵蚀形成的，而非陨石撞击。',
      es: '¡El "Ojo del Sahara" (Estructura Richat) es una enorme diana de 50 km de ancho en el desierto mauritano — ¡visible desde el espacio! Los científicos creen que fue creado por la erosión de una cúpula rocosa.',
    },
  },
  {
    id: 'yellowstone',
    name: 'Yellowstone', emoji: '🌋',
    lat: 44.6, lon: -110.5, category: 'science',
    facts: {
      en: 'Yellowstone sits on top of a supervolcano! Its last full eruption 640,000 years ago was 1,000 times bigger than Mt. St. Helens. Today it has over 10,000 geysers and hot springs.',
      he: 'ילוסטון יושב על גבי קל-וולקנו! ההתפרצות האחרונה שלו לפני 640,000 שנה הייתה גדולה פי 1,000 ממק. סנט הלנס. כיום יש בו מעל 10,000 גייזרים.',
      zh: '黄石公园坐落在一座超级火山之上！64万年前的最后一次全面喷发比圣海伦斯火山大1000倍。今天它拥有超过10000个间歇泉和温泉。',
      es: '¡Yellowstone se asienta sobre un supervolcán! Su última erupción completa hace 640,000 años fue 1,000 veces más grande que el Monte St. Helens. Hoy tiene más de 10,000 géiseres y manantiales calientes.',
    },
  },
  {
    id: 'aurora-australis',
    name: 'Aurora Australis', emoji: '🌠',
    lat: -67.0, lon: -60.0, category: 'science',
    facts: {
      en: 'The Aurora Australis is the "Southern Lights" — occurring near Earth\'s South Pole. Unlike the Northern Lights, very few people see it because it dances over the remote Antarctic skies!',
      he: 'הזוהר האוסטראלי הוא "האורות הדרומיים" — מתרחש ליד הקוטב הדרומי של כדור הארץ. מאוד מעט אנשים רואים אותו כי הוא רוקד מעל שמי אנטארקטיקה הנידחת!',
      zh: '南极光是"南方之光"——发生在地球南极附近。与北极光不同，很少有人看到它，因为它在偏远的南极天空中舞动！',
      es: '¡La Aurora Australis son las "Luces del Sur" — ocurren cerca del Polo Sur de la Tierra. A diferencia de las Boreales, muy pocas personas la ven porque danza sobre los remotos cielos antárticos!',
    },
  },
  {
    id: 'congo-rainforest',
    name: 'Congo Rainforest', emoji: '🦍',
    lat: -1.0, lon: 24.0, category: 'nature',
    facts: {
      en: 'The Congo Rainforest is the world\'s second-largest rainforest and home to gorillas, okapis, and forest elephants found nowhere else on Earth! The Congo River is the world\'s deepest river.',
      he: 'יערות הגשם של קונגו הם יערות הגשם השניים בגודלם בעולם ובית לגורילות, אוקאפים ופילי יערות.',
      zh: '刚果雨林是世界第二大热带雨林，是大猩猩、霍加狓和森林象的家园，这些动物在地球其他地方找不到！刚果河是世界上最深的河流。',
      es: '¡La Selva del Congo es la segunda selva tropical más grande del mundo y hogar de gorilas, okapis y elefantes forestales que no se encuentran en ningún otro lugar! El río Congo es el más profundo del mundo.',
    },
  },
  {
    id: 'galapagos',
    name: 'Galápagos Islands', emoji: '🐢',
    lat: -0.6, lon: -90.3, category: 'science',
    facts: {
      en: 'The Galápagos Islands inspired Charles Darwin\'s theory of evolution! The giant tortoises can live over 150 years. The islands are home to animals that exist nowhere else — like the marine iguana, the only lizard that swims in the ocean.',
      he: 'האיים גלפגוס השפיעו על תיאורית האבולוציה של צ\'ארלס דרווין! הצבים הענקיים can חיים מעל 150 שנה.',
      zh: '加拉帕戈斯群岛启发了查尔斯·达尔文的进化论！巨龟可以活150多年。这些岛屿是只在这里才有的动物的家园——比如海鬣蜥，唯一在海洋中游泳的蜥蜴。',
      es: '¡Las Islas Galápagos inspiraron la teoría de la evolución de Darwin! Las tortugas gigantes viven más de 150 años. Son hogar de animales que no existen en ningún otro lugar — como la iguana marina, el único lagarto que nada en el océano.',
    },
  },
  {
    id: 'sahara-dunes',
    name: 'Erg Chebbi Dunes', emoji: '🌅',
    lat: 31.2, lon: -3.96, category: 'geography',
    facts: {
      en: 'The Erg Chebbi sand dunes in Morocco reach up to 150 meters tall — taller than a 50-floor skyscraper! Sand dunes move like slow waves: they can travel up to 30 meters per year blown by wind.',
      he: 'חולות ארג\'  שבי במרוקו מגיעות לגובה של עד 150 מטר — גבוה יותר מבניין 50 קומות! גבעות חול נעות כגלים איטיים.',
      zh: '摩洛哥厄尔格切比沙丘高达150米——比50层摩天大楼还高！沙丘像慢波一样移动：被风吹动，每年可移动30米。',
      es: '¡Las dunas de Erg Chebbi en Marruecos alcanzan 150 metros de alto — más que un rascacielos de 50 pisos! Las dunas se mueven como olas lentas: pueden avanzar hasta 30 metros al año empujadas por el viento.',
    },
  },
  {
    id: 'barrier-ice-shelf',
    name: 'Ross Ice Shelf', emoji: '🧊',
    lat: -81.5, lon: -175.0, category: 'science',
    facts: {
      en: 'The Ross Ice Shelf is a floating platform of ice the size of France! It\'s 600 meters thick. If it melted, global sea levels would rise by about 3 meters — flooding coastal cities worldwide.',
      he: 'מדף הקרח רוס הוא פלטפורמת קרח צפה בגודל צרפת! עובה 600 מ\'. אם יימס, רמות הים ירדו בכ-3 מ\'.',
      zh: '罗斯冰架是一块大小如法国的漂浮冰架！厚达600米。如果它融化，全球海平面将上升约3米——淹没全球沿海城市。',
      es: '¡La Plataforma de Hielo de Ross es una plataforma flotante de hielo del tamaño de Francia! Tiene 600 metros de grosor. Si se derritiera, los niveles del mar subirían unos 3 metros — inundando ciudades costeras.',
    },
  },
];

// ─── Monuments (10) ──────────────────────────────────────────────────────────

EARTH_HOTSPOTS.push(
  {
    id: 'pyramids',
    name: 'Pyramids of Giza', emoji: '🏺',
    lat: 29.98, lon: 31.13, category: 'monument',
    facts: {
      en: 'Built over 4,500 years ago with 2.3 million stone blocks — the Great Pyramid was the tallest structure on Earth for 3,800 years!',
      he: 'נבנו לפני יותר מ-4,500 שנה עם 2.3 מיליון אבני בניין — הפירמידה הגדולה הייתה הבנייה הגבוהה ביותר על כדור הארץ למשך 3,800 שנה!',
      zh: '4500多年前用230万块石块建造——大金字塔在3800年间是地球上最高的建筑！',
      es: '¡Construidas hace más de 4,500 años con 2.3 millones de bloques — la Gran Pirámide fue la estructura más alta de la Tierra durante 3,800 años!',
    },
  },
  {
    id: 'eiffel-tower',
    name: 'Eiffel Tower', emoji: '🗼',
    lat: 48.86, lon: 2.29, category: 'monument',
    facts: {
      en: 'Originally built as a temporary structure for the 1889 World Fair! It sways 12 cm in strong winds and grows 15 cm taller in summer heat due to metal expansion.',
      he: 'נבנה כמבנה זמני לתערוכת 1889! מתנדנד 12 ס"מ ברוחות וגדל 15 ס"מ בקיץ בגלל התפשטות מתכת.',
      zh: '原作为1889年博览会临时建筑建造！在强风中摇摆12厘米，夏天由于金属膨胀会长高15厘米。',
      es: '¡Construida como temporal para la Feria de 1889! Se balancea 12 cm con vientos fuertes y crece 15 cm en verano por expansión del metal.',
    },
  },
  {
    id: 'machu-picchu',
    name: 'Machu Picchu', emoji: '🏔️',
    lat: -13.16, lon: -72.54, category: 'monument',
    facts: {
      en: 'This hidden Inca citadel sits 2,430 m above sea level. Built without mortar, its stones fit so perfectly that a knife blade cannot slide between them — and it survived 500 years of earthquakes!',
      he: 'המצודה הנסתרת של האינקה יושבת 2,430 מטר מעל פני הים. נבנתה בלי טיח, אבניה מתאימות כל כך שסכין לא יכולה להיכנס ביניהן — ושרדה 500 שנות רעידות אדמה!',
      zh: '这座隐藏的印加城堡坐落在海拔2430米处。无砂浆建造，石块契合如此完美，刀片无法插入——经历了500年地震！',
      es: '¡Esta ciudadela inca a 2,430 m sin mortero — sus piedras encajan tan perfectamente que un cuchillo no puede deslizarse entre ellas — ¡y sobrevivió 500 años de terremotos!',
    },
  },
  {
    id: 'colosseum',
    name: 'Colosseum', emoji: '🏛️',
    lat: 41.89, lon: 12.49, category: 'monument',
    facts: {
      en: 'The Roman Colosseum could hold 50,000–80,000 spectators and had 80 entrances — it could empty in minutes! The retractable sailcloth roof was operated by Roman sailors.',
      he: 'הקולוסיאום הרומי יכול היה להכיל 50,000 עד 80,000 צופים. הגג הנשלף היה עשוי פקעי מפרש ומופעל על ידי מלחים רומיים.',
      zh: '罗马斗兽场可容纳50,000到80,000名观众，有80个入口！可伸缩的帆布屋顶由罗马水手操作。',
      es: '¡El Coliseo podía albergar 50,000 a 80,000 espectadores y tenía 80 entradas! El techo retráctil de lonas era operado por marineros romanos.',
    },
  },
  {
    id: 'taj-mahal',
    name: 'Taj Mahal', emoji: '🕌',
    lat: 27.17, lon: 78.04, category: 'monument',
    facts: {
      en: "Emperor Shah Jahan built the Taj Mahal as a tomb for his beloved wife. It took 22 years and 20,000 workers! The white marble changes color — pink at dawn, white at noon, golden at night.",
      he: "הקיסר שאה ג'האן בנה את טאג' מהאל כקבר לאשתו. לקח 22 שנים ו-20,000 פועלים! השיש הלבן משנה צבע — ורוד בשחר, לבן בצהריים, זהב בלילה.",
      zh: '沙贾汗皇帝为爱妻建造了泰姬陵。历时22年，动用20000名工人！白色大理石会变色——黎明粉红，正午白色，夜晚金色。',
      es: '¡El Taj Mahal tardó 22 años y 20,000 trabajadores! El mármol blanco cambia de color — rosa al amanecer, blanco al mediodía, dorado de noche.',
    },
  },
  {
    id: 'stonehenge',
    name: 'Stonehenge', emoji: '🪨',
    lat: 51.18, lon: -1.83, category: 'monument',
    facts: {
      en: 'Stonehenge is 5,000 years old — older than the pyramids! Its largest stones weigh 25 tons and were brought from 250 km away. During summer solstice, the Sun rises perfectly aligned with the central stone.',
      he: 'סטונהנגה בת 5,000 שנה — ישנה מהפירמידות! אבניה הגדולות שוקלות 25 טון והובאו מ-250 ק"מ. בסולסטיס הקיץ השמש זורחת בקו עם אבן המרכז.',
      zh: '巨石阵已有5000年历史——比金字塔还古老！最大石块重25吨，从250公里外运来。夏至时太阳与中心石正好对齐。',
      es: '¡Stonehenge tiene 5,000 años — más antiguo que las pirámides! Sus piedras más grandes pesan 25 toneladas, traídas desde 250 km. En el solsticio de verano, el Sol sale alineado con la piedra central.',
    },
  },
  {
    id: 'chichen-itza',
    name: 'Chichen Itza', emoji: '🏯',
    lat: 20.68, lon: -88.57, category: 'monument',
    facts: {
      en: 'During spring equinox, the setting sun creates a snake of light that slithers down the main pyramid steps! The Mayan astronomers could predict eclipses 500 years in advance.',
      he: 'בשיוויון האביב השמש יוצרת נחש אור שמשתרך במורד מדרגות הפירמידה! אסטרונומים מאיה יכלו לנבא ליקויים 500 שנה מראש.',
      zh: '春分时，落日在金字塔台阶上创造出滑行的光蛇！玛雅天文学家能提前500年预测日食。',
      es: '¡En el equinoccio de primavera, el sol crea una serpiente de luz en los escalones! Los astrónomos mayas predecían eclipses con 500 años de antelación.',
    },
  },
  {
    id: 'angkor-wat',
    name: 'Angkor Wat', emoji: '⛩️',
    lat: 13.41, lon: 103.87, category: 'monument',
    facts: {
      en: "Angkor Wat is the world's largest religious monument, built 900 years ago! The jungle swallowed it for 400 years until rediscovered in 1860. It required moving more stone than Egypt's pyramids.",
      he: "אנגקור וואט הוא האנדרטה הדתית הגדולה ביותר בעולם! הג'ונגל בלע אותו 400 שנה עד לגילויו מחדש ב-1860.",
      zh: '吴哥窟是世界最大宗教建筑，建于900年前！丛林将其吞噬400年，直到1860年被重新发现。移动石料比埃及金字塔还多。',
      es: '¡Angkor Wat es el monumento religioso más grande, construido hace 900 años! La jungla lo ocultó 400 años hasta su redescubrimiento en 1860.',
    },
  },
  {
    id: 'easter-island',
    name: 'Easter Island Moai', emoji: '🗿',
    lat: -27.12, lon: -109.37, category: 'monument',
    facts: {
      en: 'Easter Island has nearly 1,000 giant stone statues called moai — the tallest is 10 meters! Scientists cracked the mystery: moai were walked upright using ropes, rocking side to side!',
      he: 'לאי הפסחא יש כמעט 1,000 פסלי מואי ענקיים — הגבוה ביותר הוא 10 מטר! מדענים פצחו את הסוד: המואי הלכו ישר תוך כדי נדנוד באמצעות חבלים!',
      zh: '复活节岛有近1000座摩艾石像——最高10米！科学家破解了谜题：摩艾用绳索像钟摆一样竖立行走！',
      es: '¡Isla de Pascua tiene casi 1,000 moai — el más alto mide 10 metros! ¡Los científicos descifraron el misterio: los moai caminaban erguidos balanceándose con cuerdas!',
    },
  },
  {
    id: 'statue-of-liberty',
    name: 'Statue of Liberty', emoji: '🗽',
    lat: 40.69, lon: -74.04, category: 'monument',
    facts: {
      en: "The Statue of Liberty was France's gift in 1886 — it arrived in 350 pieces! Its copper skin turned green (patina) over the years. On a windy day the torch sways 30 cm!",
      he: 'פסל החירות היה מתנת צרפת ב-1886 — הגיע ב-350 חלקים! עורו הנחושת הפך לירוק עם השנים. ביום סוער הלפיד מתנדנד 30 ס"מ!',
      zh: '自由女神像是1886年法国赠送——分350件运抵！铜皮多年来变绿（铜绿）。在风大的日子火炬摇摆30厘米！',
      es: '¡La Estatua de la Libertad fue regalo de Francia en 1886 — llegó en 350 piezas! La piel de cobre se volvió verde con los años. ¡En un día ventoso la antorcha se balancea 30 cm!',
    },
  },
);

// ─── Oceans (5) ───────────────────────────────────────────────────────────────

EARTH_HOTSPOTS.push(
  {
    id: 'pacific-ocean',
    name: 'Pacific Ocean', emoji: '🌊',
    lat: 0.0, lon: -160.0, category: 'ocean',
    facts: {
      en: "The Pacific Ocean covers 30% of Earth's entire surface — bigger than ALL land combined! It holds the deepest point on Earth: the Mariana Trench at 11 km down.",
      he: 'האוקיינוס השקט מכסה 30% מפני כדור הארץ — גדול מכל האדמה ביחד! הוא מחזיק את הנקודה העמוקה ביותר: תעלת מריאנה ב-11 ק"מ.',
      zh: '太平洋覆盖地球表面的30%——比所有陆地加起来还大！拥有地球最深点：深达11公里的马里亚纳海沟。',
      es: '¡El Océano Pacífico cubre el 30% de la superficie terrestre — más grande que TODA la tierra! Alberga el punto más profundo: la Fosa de las Marianas a 11 km.',
    },
  },
  {
    id: 'atlantic-ocean',
    name: 'Atlantic Ocean', emoji: '🌊',
    lat: 0.0, lon: -25.0, category: 'ocean',
    facts: {
      en: 'The Atlantic Ocean gets 2.5 cm wider every year as the continents drift apart — in 200 million years it will be wider than the Pacific! It was the first ocean crossed by airplane.',
      he: 'האוקיינוס האטלנטי מתרחב ב-2.5 ס"מ בכל שנה ככל שהיבשות מתרחקות — בעוד 200 מיליון שנה יהיה רחב יותר מהשקט!',
      zh: '大西洋每年随大陆漂移扩大2.5厘米——2亿年后将比太平洋还宽！它是第一个被飞机横越的大洋。',
      es: '¡El Atlántico se ensancha 2.5 cm cada año — en 200 millones de años será más ancho que el Pacífico! Fue el primer océano cruzado en avión.',
    },
  },
  {
    id: 'indian-ocean',
    name: 'Indian Ocean', emoji: '🌊',
    lat: -20.0, lon: 75.0, category: 'ocean',
    facts: {
      en: "The Indian Ocean is the world's warmest ocean — crucial for the monsoon rains that feed 2 billion people! Its currents uniquely reverse direction with the seasons.",
      he: 'האוקיינוס ההודי הוא החם ביותר בעולם — חיוני לגשמי מונסון שמאכיל 2 מיליארד אנשים! זרמיו משנים כיוון עם העונות.',
      zh: '印度洋是世界上最温暖的大洋——对给20亿人带来降雨的季风至关重要！其洋流独特地随季节改变方向。',
      es: '¡El Océano Índico es el más cálido — crucial para los monzones que alimentan a 2 mil millones de personas! Sus corrientes invierten dirección con las estaciones.',
    },
  },
  {
    id: 'arctic-ocean',
    name: 'Arctic Ocean', emoji: '🧊',
    lat: 88.0, lon: 0.0, category: 'ocean',
    facts: {
      en: "The Arctic Ocean is the smallest and shallowest ocean — much of it covered in sea ice. The ice reflects sunlight back into space, acting like Earth's air conditioner. Climate change is melting it 13% per decade.",
      he: 'האוקיינוס הארקטי הוא הקטן והרדוד ביותר — חלק גדול ממנו מכוסה קרח ים. הקרח מחזיר אור לחלל ומשמש כמזגן של כדור הארץ. שינוי האקלים ממיס אותו ב-13% לעשור.',
      zh: '北冰洋是最小最浅的大洋——大部分被海冰覆盖。冰层将阳光反射回太空，起到地球空调的作用。气候变化每十年融化13%。',
      es: '¡El Ártico es el océano más pequeño — cubierto de hielo marino. El hielo refleja la luz solar, actuando como el aire acondicionado de la Tierra. El cambio climático lo derrite un 13% por década.',
    },
  },
  {
    id: 'southern-ocean',
    name: 'Southern Ocean', emoji: '🌀',
    lat: -72.0, lon: 0.0, category: 'ocean',
    facts: {
      en: "The Southern Ocean was only officially recognized as Earth's 5th ocean in 2000! It completely encircles Antarctica and contains the Antarctic Circumpolar Current — moving 150 times more water than all rivers combined.",
      he: 'האוקיינוס הדרומי הוכר כאוקיינוס החמישי של כדור הארץ רק ב-2000! הוא מקיף לחלוטין את אנטארקטיקה ומכיל את הזרם הסובב-אנטארקטי.',
      zh: '南冰洋直到2000年才被正式认定为第五大洋！完全环绕南极洲，包含南极绕极流——流量是所有河流总和的150倍。',
      es: '¡El Océano Austral fue reconocido como el 5º océano en 2000! Rodea la Antártida y contiene la Corriente Circumpolar — mueve 150 veces más agua que todos los ríos juntos.',
    },
  },
);

// ─── Wildlife (5) ─────────────────────────────────────────────────────────────

EARTH_HOTSPOTS.push(
  {
    id: 'serengeti',
    name: 'Serengeti', emoji: '🦁',
    lat: -2.3, lon: 34.8, category: 'wildlife',
    facts: {
      en: 'The Serengeti hosts the Great Migration: 1.5 million wildebeest, 700,000 zebras, and 500,000 gazelles moving in a giant circle every year — the largest overland animal migration on Earth!',
      he: 'סרנגטי מארח את ההגירה הגדולה: 1.5 מיליון ויילדביסט, 700,000 זברות ו-500,000 גזלים נעים בעיגול ענק בכל שנה!',
      zh: '塞伦盖蒂举办了大迁徙：每年150万只角马、70万只斑马和50万只瞪羚形成巨大圆环迁移——地球上最大的陆地动物迁徙！',
      es: '¡El Serengeti alberga la Gran Migración: 1.5 millones de ñus, 700,000 cebras y 500,000 gacelas en un gran círculo anual — la mayor migración terrestre de la Tierra!',
    },
  },
  {
    id: 'sichuan-pandas',
    name: 'Sichuan Panda Reserve', emoji: '🐼',
    lat: 30.5, lon: 103.6, category: 'wildlife',
    facts: {
      en: "China's Sichuan Giant Panda Sanctuaries protect fewer than 1,900 wild giant pandas! Pandas eat 12 to 15 hours a day consuming 45 kg of bamboo. Conservation efforts have pulled them back from extinction.",
      he: "מקלטי הפנדה הענקיים בסצ'ואן מגנים על פחות מ-1,900 פנדות בטבע! פנדות אוכלות 12 עד 15 שעות ביום. מאמצי שימור הצילו אותן מהכחדה.",
      zh: '四川大熊猫栖息地保护着野外仅剩不到1900只大熊猫！熊猫每天进食12到15小时，消耗45公斤竹子。保护工作使它们从灭绝边缘回归。',
      es: '¡Los santuarios de Sichuan protegen a menos de 1,900 pandas gigantes salvajes! Los pandas comen de 12 a 15 horas al día consumiendo 45 kg de bambú. La conservación los alejó de la extinción.',
    },
  },
  {
    id: 'monarch-butterfly',
    name: 'Monarch Butterfly Reserve', emoji: '🦋',
    lat: 19.6, lon: -100.3, category: 'wildlife',
    facts: {
      en: "Every year, 100 million monarch butterflies migrate 4,500 km from Canada to a tiny forest in Mexico! They navigate without a map using Earth's magnetic field and the position of the Sun.",
      he: 'בכל שנה 100 מיליון פרפרי מונרך נודדים 4,500 ק"מ מקנדה ליער קטן במקסיקו! הם מנווטים ללא מפה באמצעות השדה המגנטי ומיקום השמש.',
      zh: '每年1亿只黑脉金斑蝶从加拿大迁徙4500公里到墨西哥的小森林！它们利用地球磁场和太阳位置在没有地图的情况下导航。',
      es: '¡Cada año, 100 millones de mariposas monarca migran 4,500 km desde Canadá a México! Navegan sin mapa usando el campo magnético de la Tierra y la posición del Sol.',
    },
  },
  {
    id: 'bioluminescent-bay',
    name: 'Bioluminescent Bay', emoji: '✨',
    lat: 17.9, lon: -66.9, category: 'wildlife',
    facts: {
      en: "Mosquito Bay in Puerto Rico glows electric blue at night — caused by billions of microscopic organisms called dinoflagellates that glow when disturbed! It's one of only 5 bioluminescent bays in the world.",
      he: 'מפרץ מוסקיטו בפורטו ריקו זוהר כחול חשמלי בלילה — נגרם על ידי מיליארדי מיקרואורגניזמים שזוהרים כאשר נמשכים! זהו אחד מ-5 מפרצים ביולומינסנטיים בעולם.',
      zh: '波多黎各蚊子湾夜晚发出电蓝色光芒——由数十亿甲藻受扰动时发光引起！这是世界上仅有的5个生物发光海湾之一。',
      es: '¡La Bahía Mosquito en Puerto Rico brilla de azul eléctrico — causado por miles de millones de dinoflagelados que brillan al perturbarse! Es una de solo 5 bahías bioluminiscentes del mundo.',
    },
  },
  {
    id: 'okavango',
    name: 'Okavango Delta', emoji: '🦛',
    lat: -19.3, lon: 22.9, category: 'wildlife',
    facts: {
      en: "The Okavango Delta in Botswana floods a desert each year, creating an Eden for elephants, hippos, lions, and hundreds of bird species — one of Africa's greatest wildlife spectacles!",
      he: 'דלתת אוקוואנגו בבוצוואנה מציפה מדבר כל שנה, ויוצרת גן עדן לפילים, היפופוטמוסים, אריות ומאות מיני ציפורים!',
      zh: '博茨瓦纳奥卡万戈三角洲每年淹没沙漠，为大象、河马、狮子和数百种鸟类创造了伊甸园——非洲最壮观的野生动物景观之一！',
      es: '¡El Delta del Okavango inunda un desierto cada año, creando un Edén para elefantes, hipopótamos, leones y cientos de aves — uno de los mayores espectáculos de vida salvaje de África!',
    },
  },
);

// 20 curated Earth hotspots with kid-friendly facts in 4 locales
// Lat/lon in degrees — converted to 3D sphere coords at render time

export type HotspotCategory = 'nature' | 'geography' | 'history' | 'science';

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

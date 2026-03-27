// Top 30 brightest named stars visible from Earth
// RA/Dec converted to spherical angles (theta=azimuth, phi=polar) on a unit sphere of radius 200
// Color derived from spectral type: O/B=blue-white, A=white, F=yellow-white, G=yellow, K=orange, M=red

export interface NamedStar {
  id: string;
  name: string;
  bayer: string;
  constellation: string;
  distanceLY: number;
  temperatureK: number;
  spectralType: string;
  color: string;
  apparentMagnitude: number;
  /** Spherical angles in radians on sky sphere (derived from RA/Dec) */
  theta: number;
  phi: number;
  facts: Record<string, string>;
}

export const NAMED_STARS: NamedStar[] = [
  {
    id: 'sirius',
    name: 'Sirius', bayer: 'α CMa', constellation: 'Canis Major',
    distanceLY: 8.6, temperatureK: 9940, spectralType: 'A1V',
    color: '#cce8ff', apparentMagnitude: -1.46,
    theta: 1.767, phi: 1.997,
    facts: {
      en: 'Sirius is the brightest star in the night sky! Ancient Egyptians used it to predict the annual Nile flood — they called it the "Nile Star".',
      he: 'סיריוס הוא הכוכב הבהיר ביותר בשמיים! המצרים הקדמונים השתמשו בו לניבוי שטפון הנילוס השנתי.',
      zh: '天狼星是夜空中最亮的星！古埃及人用它预测尼罗河洪水，称它为"尼罗星"。',
      es: '¡Sirius es la estrella más brillante del cielo nocturno! Los antiguos egipcios la usaban para predecir la inundación del Nilo.',
    },
  },
  {
    id: 'canopus',
    name: 'Canopus', bayer: 'α Car', constellation: 'Carina',
    distanceLY: 310, temperatureK: 7350, spectralType: 'F0II',
    color: '#fffde0', apparentMagnitude: -0.72,
    theta: 1.675, phi: 2.589,
    facts: {
      en: 'Canopus is so intrinsically bright that it outshines the entire Milky Way galaxy — if it were as close as Sirius, it would cast shadows at night!',
      he: 'קנופוס בוהק כל כך שאם היה קרוב כמו סיריוס, הוא היה מטיל צלליות בלילה!',
      zh: '船底座α星如此明亮，如果它像天狼星一样近，晚上能投下阴影！',
      es: '¡Canopus es tan brillante intrínsecamente que si estuviera tan cerca como Sirio, proyectaría sombras de noche!',
    },
  },
  {
    id: 'arcturus',
    name: 'Arcturus', bayer: 'α Boo', constellation: 'Boötes',
    distanceLY: 37, temperatureK: 4300, spectralType: 'K1.5III',
    color: '#ffb347', apparentMagnitude: -0.05,
    theta: 3.733, phi: 1.100,
    facts: {
      en: 'Arcturus is a giant orange star 25 times wider than our Sun. Its light was used to open the 1933 Chicago World\'s Fair!',
      he: 'ארקטורוס הוא ענק כתום, פי 25 רחב מהשמש שלנו. אורו שימש לפתיחת ירידת שיקגו ב-1933!',
      zh: '大角星是橙色巨星，比太阳宽25倍。1933年芝加哥世博会就是用它的光来开幕的！',
      es: '¡Arturo es una gigante naranja 25 veces más ancha que nuestro Sol. Su luz fue usada para abrir la Feria Mundial de Chicago de 1933!',
    },
  },
  {
    id: 'vega',
    name: 'Vega', bayer: 'α Lyr', constellation: 'Lyra',
    distanceLY: 25, temperatureK: 9602, spectralType: 'A0Va',
    color: '#e8f4ff', apparentMagnitude: 0.03,
    theta: 4.674, phi: 0.672,
    facts: {
      en: 'Vega was the North Star 12,000 years ago and will be again in 14,000 years due to Earth\'s wobble. It spins so fast it\'s flattened like a pancake!',
      he: 'וגה הייתה כוכב הצפון לפני 12,000 שנה ותהיה שוב בעוד 14,000 שנה. היא מסתובבת כל כך מהר שהיא שטוחה!',
      zh: '织女星12000年前曾是北极星，由于地球的岁差，14000年后它将再次成为北极星！',
      es: '¡Vega fue la Estrella Polar hace 12,000 años y lo será de nuevo en 14,000 años! Gira tan rápido que está achatada.',
    },
  },
  {
    id: 'capella',
    name: 'Capella', bayer: 'α Aur', constellation: 'Auriga',
    distanceLY: 43, temperatureK: 4970, spectralType: 'G5III',
    color: '#ffe066', apparentMagnitude: 0.08,
    theta: 1.381, phi: 0.617,
    facts: {
      en: 'Capella is actually two yellow giant stars orbiting each other! Together they look like one very bright star to our eyes.',
      he: 'קפלה הוא למעשה שני ענקים צהובים המקיפים זה את זה! יחד הם נראים ככוכב אחד בהיר.',
      zh: '五车二实际上是两颗黄色巨星互相绕转！它们合在一起看起来像一颗很亮的星。',
      es: '¡Capella son en realidad dos gigantes amarillas que orbitan entre sí! Juntas parecen una sola estrella brillante.',
    },
  },
  {
    id: 'rigel',
    name: 'Rigel', bayer: 'β Ori', constellation: 'Orion',
    distanceLY: 860, temperatureK: 12100, spectralType: 'B8Ia',
    color: '#c8deff', apparentMagnitude: 0.13,
    theta: 1.372, phi: 1.676,
    facts: {
      en: 'Rigel is 120,000 times more luminous than our Sun — it would fill Earth\'s orbit if placed where our Sun is. It\'s the left foot of Orion the Hunter!',
      he: 'ריגל בוהק פי 120,000 מהשמש שלנו — הוא היה ממלא את מסלול כדור הארץ אם היה במקום השמש!',
      zh: '参宿七的光度是太阳的12万倍——如果放在太阳的位置，它会填满地球的轨道！它是猎人猎户座左脚。',
      es: '¡Rigel es 120,000 veces más luminoso que nuestro Sol! Sería tan grande que llenaría la órbita de la Tierra. Es el pie izquierdo de Orión.',
    },
  },
  {
    id: 'procyon',
    name: 'Procyon', bayer: 'α CMi', constellation: 'Canis Minor',
    distanceLY: 11.4, temperatureK: 6530, spectralType: 'F5IV',
    color: '#fffbe6', apparentMagnitude: 0.34,
    theta: 2.004, phi: 1.558,
    facts: {
      en: 'Procyon means "before the dog" in Greek because it rises just before the Dog Star Sirius. It has a tiny white dwarf companion!',
      he: 'פרוקיון פירושו "לפני הכלב" ביוונית, כי הוא עולה ממש לפני כוכב הכלב סיריוס.',
      zh: '南河三在希腊语中意为"在狗之前"，因为它在天狼星之前升起。它有一个白矮星伴星！',
      es: '¡Procyon significa "antes del perro" en griego porque sale justo antes de Sirio, la Estrella del Can! Tiene una enana blanca compañera.',
    },
  },
  {
    id: 'achernar',
    name: 'Achernar', bayer: 'α Eri', constellation: 'Eridanus',
    distanceLY: 139, temperatureK: 14000, spectralType: 'B6Vep',
    color: '#b8d4ff', apparentMagnitude: 0.46,
    theta: 0.427, phi: 2.342,
    facts: {
      en: 'Achernar spins so incredibly fast — once every 2 days — that it\'s 56% wider at its equator than at its poles! It\'s the most flattened star known.',
      he: 'אכרנר מסתובב כל כך מהר — פעם כל יומיים — שהוא רחב ב-56% במשוואה מאשר בקטבים!',
      zh: '水委一旋转极快——每两天一圈——以至于它的赤道比两极宽56%！这是已知最扁的恒星。',
      es: '¡Achernar gira tan increíblemente rápido — una vez cada 2 días — que es 56% más ancha en el ecuador que en los polos!',
    },
  },
  {
    id: 'betelgeuse',
    name: 'Betelgeuse', bayer: 'α Ori', constellation: 'Orion',
    distanceLY: 700, temperatureK: 3500, spectralType: 'M1Ia',
    color: '#ff6633', apparentMagnitude: 0.50,
    theta: 1.549, phi: 1.516,
    facts: {
      en: 'Betelgeuse is a red giant so huge that if it replaced our Sun, it would swallow Mercury, Venus, Earth, and Mars! It will explode as a supernova someday.',
      he: 'בטלגוז הוא ענק אדום כה גדול שאם היה מחליף את השמש, הוא היה בולע את מרקורי, נוגה, כדור הארץ ומאדים!',
      zh: '参宿四是一颗红超巨星，大到如果取代我们的太阳，会吞噬水星、金星、地球和火星！它终有一天会爆炸成超新星。',
      es: '¡Betelgeuse es una supergigante roja tan enorme que si reemplazara a nuestro Sol, se tragaria a Mercurio, Venus, Tierra y Marte! Algún día explotará en supernova.',
    },
  },
  {
    id: 'altair',
    name: 'Altair', bayer: 'α Aql', constellation: 'Aquila',
    distanceLY: 16.7, temperatureK: 7760, spectralType: 'A7Vn',
    color: '#e4f0ff', apparentMagnitude: 0.76,
    theta: 5.196, phi: 1.081,
    facts: {
      en: 'Altair rotates once every 9 hours — Earth takes 24! This wild spin makes it bulge at the equator. It\'s part of the Summer Triangle asterism.',
      he: 'אלטאיר מסתובב פעם בכל 9 שעות — כדור הארץ לוקח 24! הסיבוב המהיר גורם לו להתנפח במשוואה.',
      zh: '牛郎星每9小时自转一圈——地球需要24小时！这种快速旋转使它赤道隆起。它是夏季大三角的一部分。',
      es: '¡Altair rota una vez cada 9 horas — ¡La Tierra tarda 24! Esta velocidad la hace abultarse en el ecuador. Es parte del Triángulo de Verano.',
    },
  },
  {
    id: 'aldebaran',
    name: 'Aldebaran', bayer: 'α Tau', constellation: 'Taurus',
    distanceLY: 65, temperatureK: 3910, spectralType: 'K5III',
    color: '#ff9944', apparentMagnitude: 0.85,
    theta: 1.196, phi: 1.436,
    facts: {
      en: 'Aldebaran is the red eye of Taurus the Bull! This orange giant is 44 times the width of our Sun. Pioneer 10 spacecraft is heading toward it!',
      he: 'אלדברן הוא עיין השור האדומה! ענק כתום זה הוא פי 44 ברוחב מהשמש. חללית פיוניר 10 מתקדמת לעברו!',
      zh: '毕宿五是金牛座牛的红眼睛！这颗橙色巨星比我们的太阳宽44倍。先驱者10号飞船正朝着它飞去！',
      es: '¡Aldebarán es el ojo rojo del Toro! Esta gigante naranja mide 44 veces el ancho de nuestro Sol. ¡La Pioneer 10 se dirige hacia ella!',
    },
  },
  {
    id: 'spica',
    name: 'Spica', bayer: 'α Vir', constellation: 'Virgo',
    distanceLY: 249, temperatureK: 22400, spectralType: 'B1V',
    color: '#aaccff', apparentMagnitude: 0.97,
    theta: 3.513, phi: 1.575,
    facts: {
      en: 'Spica is actually two stars so close together that tidal forces have stretched them into egg shapes! Ancient Greek astronomer Hipparchus used it to discover the precession of Earth\'s axis.',
      he: 'ספיקה הוא למעשה שני כוכבים כל כך קרובים שכוחות גאות מתחו אותם לצורת ביצים!',
      zh: '角宿一实际上是两颗星，如此接近以至于潮汐力把它们拉成了蛋形！古希腊天文学家喜帕恰斯用它发现了地轴岁差。',
      es: '¡Spica son en realidad dos estrellas tan cercanas que las fuerzas de marea las han estirado en forma de huevo! Hipparco la usó para descubrir la precesión.',
    },
  },
  {
    id: 'antares',
    name: 'Antares', bayer: 'α Sco', constellation: 'Scorpius',
    distanceLY: 550, temperatureK: 3400, spectralType: 'M1.5Ia',
    color: '#ff4422', apparentMagnitude: 1.06,
    theta: 4.317, phi: 1.706,
    facts: {
      en: 'Antares is so enormous that if it replaced our Sun, it would extend almost to Jupiter! Its name means "rival of Mars" because of its reddish color.',
      he: 'אנטארס כל כך ענק שאם היה מחליף את השמש, הוא היה מגיע כמעט עד צדק! שמו פירושו "מתחרה של מאדים".',
      zh: '心宿二如此巨大，如果取代太阳，它几乎会延伸到木星！它的名字意为"火星的对手"，因为它的红色。',
      es: '¡Antares es tan enorme que si reemplazara al Sol, se extendería casi hasta Júpiter! Su nombre significa "rival de Marte" por su color rojizo.',
    },
  },
  {
    id: 'pollux',
    name: 'Pollux', bayer: 'β Gem', constellation: 'Gemini',
    distanceLY: 34, temperatureK: 4865, spectralType: 'K0III',
    color: '#ffb84d', apparentMagnitude: 1.14,
    theta: 2.103, phi: 1.210,
    facts: {
      en: 'Pollux has a confirmed planet orbiting it — Pollux b! It\'s the closest giant star to Earth with a confirmed exoplanet. The planet is 2.3 times heavier than Jupiter.',
      he: 'לפולוקס יש כוכב לכת מאושר — פולוקס b! הוא הכוכב הענקי הקרוב ביותר לכדור הארץ עם אקסופלנטה מאושר.',
      zh: '北河三有一颗确认的行星绕它运行——北河三b！它是距地球最近的有确认系外行星的巨星。这颗行星比木星重2.3倍。',
      es: '¡Pollux tiene un planeta confirmado orbitándolo — Pollux b! Es la estrella gigante más cercana a la Tierra con un exoplaneta confirmado.',
    },
  },
  {
    id: 'fomalhaut',
    name: 'Fomalhaut', bayer: 'α PsA', constellation: 'Piscis Austrinus',
    distanceLY: 25, temperatureK: 8590, spectralType: 'A3V',
    color: '#ddeeff', apparentMagnitude: 1.16,
    theta: 5.876, phi: 2.085,
    facts: {
      en: 'Fomalhaut is surrounded by a huge dust ring — like a giant version of our asteroid belt! The Hubble Space Telescope photographed what may be a planet orbiting inside the ring.',
      he: 'פומלהות מוקף בטבעת אבק ענקית — כמו גרסה ענקית של חגורת האסטרואידים שלנו!',
      zh: '北落师门被一个巨大的尘埃环包围——就像我们小行星带的巨型版本！哈勃望远镜拍到了可能在环内运行的行星。',
      es: '¡Fomalhaut está rodeado de un enorme anillo de polvo — ¡como una versión gigante de nuestro cinturón de asteroides! El Hubble fotografió lo que puede ser un planeta en el anillo.',
    },
  },
  {
    id: 'deneb',
    name: 'Deneb', bayer: 'α Cyg', constellation: 'Cygnus',
    distanceLY: 2600, temperatureK: 8525, spectralType: 'A2Ia',
    color: '#e0f0ff', apparentMagnitude: 1.25,
    theta: 5.417, phi: 0.789,
    facts: {
      en: 'Deneb is one of the most luminous stars known — possibly 200,000 times brighter than our Sun! Despite being 2,600 light years away, it still ranks in the top 20 brightest stars.',
      he: 'דנב הוא אחד הכוכבים הזוהרים ביותר — אולי פי 200,000 בהיר מהשמש! למרות שהוא 2,600 שנות אור מאיתנו, הוא עדיין בין 20 הכוכבים הבהירים.',
      zh: '天津四是已知最亮的恒星之一——可能比太阳亮20万倍！尽管距我们2600光年，它仍是夜空20颗最亮的星之一。',
      es: '¡Deneb es una de las estrellas más luminosas conocidas — posiblemente 200,000 veces más brillante que nuestro Sol! A 2,600 años luz, sigue siendo de las 20 más brillantes.',
    },
  },
  {
    id: 'mimosa',
    name: 'Mimosa', bayer: 'β Cru', constellation: 'Crux',
    distanceLY: 280, temperatureK: 27000, spectralType: 'B0.5III',
    color: '#99ccff', apparentMagnitude: 1.25,
    theta: 3.143, phi: 2.094,
    facts: {
      en: 'Mimosa is one of the stars of the Southern Cross — the most famous constellation in the southern hemisphere! It appears on the flags of Australia, New Zealand, and Brazil.',
      he: 'מימוזה היא אחד מכוכבי הצלב הדרומי — ההתאגמות המפורסמת ביותר בחצי הכדור הדרומי!',
      zh: '十字架二是南十字座的恒星之一——南半球最著名的星座！它出现在澳大利亚、新西兰和巴西的国旗上。',
      es: '¡Mimosa es una de las estrellas de la Cruz del Sur — ¡la constelación más famosa del hemisferio sur! Aparece en las banderas de Australia, Nueva Zelanda y Brasil.',
    },
  },
  {
    id: 'regulus',
    name: 'Regulus', bayer: 'α Leo', constellation: 'Leo',
    distanceLY: 79, temperatureK: 12460, spectralType: 'B7V',
    color: '#bbddff', apparentMagnitude: 1.36,
    theta: 2.774, phi: 1.265,
    facts: {
      en: 'Regulus spins so fast — once every 15.9 hours — that if it were just 16% faster, it would fly apart! It\'s the heart of Leo the Lion.',
      he: 'רגולוס מסתובב כל כך מהר — פעם כל 15.9 שעות — שאם היה מהיר ב-16%, הוא היה מתפרק!',
      zh: '轩辕十四旋转极快——每15.9小时一圈——如果再快16%，它就会解体！它是狮子座的心脏。',
      es: '¡Regulus gira tan rápido — una vez cada 15.9 horas — que si fuera solo un 16% más rápido, se desintegraría! Es el corazón del León.',
    },
  },
  {
    id: 'adhara',
    name: 'Adhara', bayer: 'ε CMa', constellation: 'Canis Major',
    distanceLY: 430, temperatureK: 23000, spectralType: 'B2II',
    color: '#99bbff', apparentMagnitude: 1.50,
    theta: 1.855, phi: 2.140,
    facts: {
      en: 'Adhara was the brightest star in the sky 4.7 million years ago when it was much closer to Earth! It emits enormous amounts of ultraviolet radiation.',
      he: 'אדהרה הייתה הכוכב הבהיר ביותר בשמיים לפני 4.7 מיליון שנה כשהיא הייתה קרובה הרבה יותר לכדור הארץ!',
      zh: '莫弗里底在470万年前是天空中最亮的星，当时它离地球近得多！它发出大量紫外线辐射。',
      es: '¡Adhara fue la estrella más brillante del cielo hace 4.7 millones de años cuando estaba mucho más cerca de la Tierra! Emite enormes cantidades de radiación ultravioleta.',
    },
  },
  {
    id: 'castor',
    name: 'Castor', bayer: 'α Gem', constellation: 'Gemini',
    distanceLY: 52, temperatureK: 9250, spectralType: 'A1V',
    color: '#ddeeff', apparentMagnitude: 1.58,
    theta: 2.056, phi: 1.198,
    facts: {
      en: 'Castor looks like one star but is actually SIX stars — three pairs all orbiting each other! It\'s one of the most complex star systems in the sky.',
      he: 'קסטור נראה ככוכב אחד אך הוא למעשה שישה כוכבים — שלושה זוגות שמקיפים זה את זה!',
      zh: '北河二看起来像一颗星，但实际上是六颗星——三对互相绕转！这是天空中最复杂的恒星系之一。',
      es: '¡Cástor parece una estrella pero son en realidad SEIS estrellas — tres pares orbitando entre sí! Es uno de los sistemas estelares más complejos del cielo.',
    },
  },
  {
    id: 'gacrux',
    name: 'Gacrux', bayer: 'γ Cru', constellation: 'Crux',
    distanceLY: 88, temperatureK: 3689, spectralType: 'M3.5III',
    color: '#ff5533', apparentMagnitude: 1.59,
    theta: 3.197, phi: 2.007,
    facts: {
      en: 'Gacrux is the top star of the Southern Cross constellation. It\'s a cool red giant nearing the end of its life — perfect for spotting south if you\'re in the southern hemisphere!',
      he: 'גקרוקס הוא הכוכב העליון של קבוצת הכוכבים הצלב הדרומי. הוא ענק אדום קריר.',
      zh: '十字架三是南十字座最顶部的星。它是一颗冷红巨星，生命接近尾声——在南半球可以用它辨别南方！',
      es: '¡Gacrux es la estrella superior de la Cruz del Sur. Es una gigante roja fría cerca del final de su vida — ¡perfecta para encontrar el sur en el hemisferio sur!',
    },
  },
  {
    id: 'shaula',
    name: 'Shaula', bayer: 'λ Sco', constellation: 'Scorpius',
    distanceLY: 700, temperatureK: 22000, spectralType: 'B1.5IV',
    color: '#aaccff', apparentMagnitude: 1.62,
    theta: 4.558, phi: 1.862,
    facts: {
      en: 'Shaula is the stinger in the tail of Scorpius the Scorpion! In Arabic, its name means "the raised tail". It\'s actually a triple star system.',
      he: 'שוולה הוא עוקץ הזנב של עקרב! בערבית שמו פירושו "הזנב המורם". הוא למעשה מערכת שלישית.',
      zh: '尾宿八是天蝎座尾巴上的毒刺！在阿拉伯语中，它的名字意为"翘起的尾巴"。它实际上是三星系统。',
      es: '¡Shaula es el aguijón en la cola de Escorpión! En árabe, su nombre significa "la cola levantada". En realidad es un sistema triple.',
    },
  },
  {
    id: 'bellatrix',
    name: 'Bellatrix', bayer: 'γ Ori', constellation: 'Orion',
    distanceLY: 245, temperatureK: 21500, spectralType: 'B2III',
    color: '#bbccff', apparentMagnitude: 1.64,
    theta: 1.430, phi: 1.548,
    facts: {
      en: 'Bellatrix means "female warrior" in Latin and marks the left shoulder of Orion. Its intense blue-white color shows it burns incredibly hot — over 21,000 degrees!',
      he: 'בלאטריקס פירושה "לוחמת" בלטינית וסימנת את הכתף השמאלית של אוריון.',
      zh: '参宿五在拉丁语中意为"女战士"，是猎户座的左肩。它强烈的蓝白色表明它燃烧得极热——超过21000度！',
      es: '¡Bellatrix significa "guerrera" en latín y marca el hombro izquierdo de Orión. Su intenso color azul-blanco muestra que arde increíblemente caliente — ¡más de 21,000 grados!',
    },
  },
  {
    id: 'elnath',
    name: 'Elnath', bayer: 'β Tau', constellation: 'Taurus',
    distanceLY: 134, temperatureK: 13600, spectralType: 'B7III',
    color: '#c4d8ff', apparentMagnitude: 1.65,
    theta: 1.313, phi: 1.337,
    facts: {
      en: 'Elnath marks the northern tip of Taurus and is shared with the constellation Auriga! Its Arabic name means "the butting one" — like a bull ramming with its horn.',
      he: 'אלנת מסמן את קצה הצפון של שור ומשותף עם ההתאגמות עגלה!',
      zh: '五车五标志着金牛座的北端，与御夫座共享！它的阿拉伯名字意为"用角顶的那个"——像公牛用角顶撞。',
      es: '¡Elnath marca la punta norte de Tauro y se comparte con la constelación Auriga! Su nombre árabe significa "el que embiste" — como un toro atacando con el cuerno.',
    },
  },
  {
    id: 'miaplacidus',
    name: 'Miaplacidus', bayer: 'β Car', constellation: 'Carina',
    distanceLY: 113, temperatureK: 8866, spectralType: 'A2IV',
    color: '#ddeeff', apparentMagnitude: 1.67,
    theta: 2.350, phi: 2.400,
    facts: {
      en: 'Miaplacidus is the second brightest star in the southern constellation Carina (the Keel). It\'s a giant star in the process of evolving away from the main sequence.',
      he: 'מיאפלאסידוס הוא הכוכב הבהיר השני בהתאגמות קיל הספינה הדרומית.',
      zh: '船底座β星是南天星座船底座第二亮星。它是一颗正在从主序星演化的巨星。',
      es: '¡Miaplacidus es la segunda estrella más brillante de la constelación austral Carina (la Quilla). Es una gigante en proceso de evolucionar fuera de la secuencia principal.',
    },
  },
  {
    id: 'alnilam',
    name: 'Alnilam', bayer: 'ε Ori', constellation: 'Orion',
    distanceLY: 2000, temperatureK: 27000, spectralType: 'B0Ia',
    color: '#aabbff', apparentMagnitude: 1.69,
    theta: 1.465, phi: 1.588,
    facts: {
      en: 'Alnilam is the middle star of Orion\'s Belt! If placed in our solar system, this blue supergiant would extend almost to the asteroid belt. Its name means "string of pearls" in Arabic.',
      he: 'אלנילאם הוא הכוכב האמצעי של חגורת אוריון! שמו פירושו "שרשרת פנינים" בערבית.',
      zh: '参宿二是猎户座腰带的中间星！如果放在我们的太阳系中，这颗蓝色超巨星几乎会延伸到小行星带。它的名字在阿拉伯语中意为"珍珠串"。',
      es: '¡Alnilam es la estrella central del Cinturón de Orión! Esta supergigante azul se extendería casi hasta el cinturón de asteroides. Su nombre significa "collar de perlas" en árabe.',
    },
  },
  {
    id: 'alnair',
    name: 'Alnair', bayer: 'α Gru', constellation: 'Grus',
    distanceLY: 101, temperatureK: 13500, spectralType: 'B6V',
    color: '#c2d6ff', apparentMagnitude: 1.73,
    theta: 5.791, phi: 2.218,
    facts: {
      en: 'Alnair is the brightest star in the constellation Grus (the Crane). Its Arabic name means "the bright one from the tail of the fish". It shines with blue-white brilliance.',
      he: 'אלנאיר הוא הכוכב הבהיר ביותר בהתאגמות עגור. שמו פירושו "הבהיר מזנב הדג" בערבית.',
      zh: '鹤一是天鹤座最亮the星。它的阿拉伯名字意为"鱼尾中的亮者。它发出蓝白色光辉。',
      es: '¡Alnair es la estrella más brillante de la constelación Grus (la Grulla). Su nombre árabe significa "el brillante de la cola del pez". Brilla con brillantez azul-blanca.',
    },
  },
  {
    id: 'alnitak',
    name: 'Alnitak', bayer: 'ζ Ori', constellation: 'Orion',
    distanceLY: 800, temperatureK: 29500, spectralType: 'O9.5Ib',
    color: '#8899ff', apparentMagnitude: 1.74,
    theta: 1.488, phi: 1.603,
    facts: {
      en: 'Alnitak forms the eastern end of Orion\'s Belt and is one of the hottest, most massive stars visible to the naked eye. The famous Horsehead Nebula lies just below it!',
      he: 'אלניטאק מהווה את הקצה המזרחי של חגורת אוריון. ערפילית ראש הסוס המפורסמת נמצאת ממש מתחתיו!',
      zh: '参宿一构成猎户座腰带的东端，是肉眼可见的最热、质量最大的恒星之一。著名的马头星云就在它正下方！',
      es: '¡Alnitak forma el extremo oriental del Cinturón de Orión! La famosa Nebulosa Cabeza de Caballo está justo debajo. Es una de las estrellas más calientes visibles a simple vista.',
    },
  },
  {
    id: 'regor',
    name: 'Regor', bayer: 'γ Vel', constellation: 'Vela',
    distanceLY: 1096, temperatureK: 57000, spectralType: 'WC8',
    color: '#7799ff', apparentMagnitude: 1.75,
    theta: 2.487, phi: 2.287,
    facts: {
      en: 'Regor is one of the brightest Wolf-Rayet stars in the sky — an incredibly exotic, ultra-hot star blowing off its outer layers into space. It\'s a multiple star system with up to five components!',
      he: 'רגור הוא אחד מכוכבי וולף-ראייה הבהירים ביותר — כוכב אקזוטי ולוהט ביותר שמנשב את שכבותיו החיצוניות לחלל!',
      zh: '天社一是天空中最亮的Wolf-Rayet星之一——这是一种极其奇特的超热恒星，将其外层吹散到太空中。它是一个多达五个成员的多星系统！',
      es: '¡Regor es una de las estrellas Wolf-Rayet más brillantes del cielo — una estrella increíblemente exótica y ultracaliente que expulsa sus capas externas al espacio! Sistema múltiple con hasta cinco componentes.',
    },
  },
  {
    id: 'alioth',
    name: 'Alioth', bayer: 'ε UMa', constellation: 'Ursa Major',
    distanceLY: 82, temperatureK: 9400, spectralType: 'A0pCr',
    color: '#ddeeff', apparentMagnitude: 1.76,
    theta: 3.381, phi: 0.862,
    facts: {
      en: 'Alioth is the brightest star in the Big Dipper (Ursa Major)! It\'s a peculiar star with an unusually strong magnetic field that causes chemical elements to be unevenly distributed across its surface.',
      he: 'אליות הוא הכוכב הבהיר ביותר בדוב הגדול! יש לו שדה מגנטי חזק במיוחד.',
      zh: '玉衡是大熊座（北斗七星）中最亮的星！它是一颗奇特的星，磁场异常强，导致化学元素在其表面分布不均匀。',
      es: '¡Alioth es la estrella más brillante de la Osa Mayor (el Carro)! Es una estrella peculiar con un campo magnético inusualmente fuerte que hace que los elementos químicos se distribuyan desigualmente.',
    },
  },
];

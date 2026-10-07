import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const destination = resolve('public/games/princess-mansion');
const records = [];
const princesses = [
  { id: 'liora', dress: ['#ffddc2', '#cf7e80'], hair: ['#f6d391', '#93603c'], skin: ['#ffe9d2', '#d59a87'], style: 'braid', crown: 'sun', accent: '#e7a5a3' },
  { id: 'mira', dress: ['#e7d8fa', '#9a7eb5'], hair: ['#704a40', '#382b32'], skin: ['#daaa85', '#ad755f'], style: 'bob-curls', crown: 'moon', accent: '#c5afd9' },
  { id: 'coral', dress: ['#ccf0e5', '#65a7b0'], hair: ['#7c503d', '#3f2d30'], skin: ['#f1c8a2', '#c08871'], style: 'side-braid', crown: 'wave', accent: '#b5dacc' },
  { id: 'flora', dress: ['#f8d1db', '#bd7b95'], hair: ['#da9570', '#945547'], skin: ['#f4d5b0', '#cda17f'], style: 'waves', crown: 'flower', accent: '#e1afb8' },
  { id: 'ruby', dress: ['#eebbb4', '#a84d69'], hair: ['#775345', '#392d34'], skin: ['#ffe0c1', '#d8a080'], style: 'bob', crown: 'gem', accent: '#d8888c' },
  { id: 'celeste', dress: ['#c1d8f1', '#5d79a9'], hair: ['#694539', '#2d2631'], skin: ['#bf8c69', '#865749'], style: 'long', crown: 'music', accent: '#8faed1' },
  { id: 'hazel', dress: ['#d9e7be', '#7d9b78'], hair: ['#4d3632', '#241f2a'], skin: ['#b98765', '#815043'], style: 'bun', crown: 'leaf', accent: '#a6bc95' },
  { id: 'nova', dress: ['#e2cae9', '#93719f'], hair: ['#b58661', '#785446'], skin: ['#e4b492', '#b57964'], style: 'short-curls', crown: 'star', accent: '#c6a6ce' },
];
const gradient = (id, colors, radial = false) => radial
  ? `<radialGradient id="${id}" cx=".38" cy=".33" r=".8"><stop stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></radialGradient>`
  : `<linearGradient id="${id}" x2=".75" y2="1"><stop stop-color="${colors[0]}"/><stop offset=".48" stop-color="${colors[0]}"/><stop offset="1" stop-color="${colors[1]}"/></linearGradient>`;
const commonDefs = `
  ${gradient('gold', ['#fff0ba', '#b98743'])}${gradient('ivory', ['#fffef2', '#d8c8ba'])}
  ${gradient('teal', ['#b6d8ca', '#719e92'])}${gradient('water', ['#d4f8ef', '#8dc6cf'])}
  ${gradient('rose', ['#e9b6b2', '#b47785'])}${gradient('wood', ['#d5ad89', '#936d55'])}
  ${gradient('sky', ['#d9e8df', '#ffedcc'])}
  <filter id="shadow" x="-.3" y="-.3" width="1.6" height="1.7"><feDropShadow dy="4" stdDeviation="3" flood-color="#765747" flood-opacity=".16"/></filter>
  <pattern id="paper" width="103" height="99" patternUnits="userSpaceOnUse"><path d="M12 13h3m56 31h2m12 44h4M20 64h3m31-45h3" stroke="#8a6958" stroke-width=".7" opacity=".1"/><circle cx="87" cy="8" r=".7" fill="#fff" opacity=".3"/></pattern>
  <pattern id="wallpaper" width="62" height="64" patternUnits="userSpaceOnUse"><path d="M31 11q-10 10 0 23q10-13 0-23m0 25q-10 10 0 20q10-10 0-20" fill="none" stroke="#bf937c" opacity=".22"/></pattern>
  <g id="sun" fill="none" stroke="#b98a48" stroke-width="1.4"><circle r="9" fill="#f9d791"/><path d="M0-17v5M0 12v5M-17 0h5M12 0h5M-12-12l4 4M8 8l4 4M12-12l-4 4M-8 8l-4 4"/></g>
  <g id="flower"><path d="M0 10v25m0-12q-14-11-17-2q7 10 17 5m0-9q12-11 16-4q-3 10-16 10" fill="#9fb39a" stroke="#768f78" stroke-width="1.4"/><g fill="#e7a4a7" stroke="#c7838c"><ellipse cy="-7" rx="8" ry="12"/><ellipse cx="8" rx="12" ry="8"/><ellipse cy="7" rx="8" ry="12"/><ellipse cx="-8" rx="12" ry="8"/></g><circle r="6" fill="#f4d69a"/></g>
  <g id="chair" stroke="#b18756" stroke-width="2"><path d="M20 100V38Q20-3 60 0q40 3 40 38v62" fill="url(#gold)"/><path d="M29 85V39q0-27 31-28q31 1 31 28v46Z" fill="#d8999b"/><path d="m36 34 49 44m-8-53L38 66" fill="none" stroke="#b5757e" opacity=".4"/><circle cx="60" cy="44" r="3" fill="#f4c4b2"/><path d="M17 91q43-13 86 0v15H17z" fill="url(#ivory)"/><path d="m25 107-7 65m77-65 7 65" fill="none" stroke-width="7"/></g>
  <g id="plant"><path d="M-20-44q-36-58-51-30q-13 24 48 33m28-38q25-57 48-38q26 24-48 41m-8 25q-6-54 10-79q25 22 1 75" fill="#8ba68b" stroke="#657f6f" stroke-width="2"/><path d="M-30-3h59l-9 65h-40Z" fill="#d9aa8f" stroke="#b98872" stroke-width="2"/><path d="M-35-8h69v15h-69Z" fill="#e4bb9e" stroke="#b98872" stroke-width="2"/><use href="#flower" x="-13" y="-27"/><use href="#flower" x="13" y="-33"/></g>
  <g id="plate"><ellipse rx="37" ry="10" fill="#dfcec1"/><ellipse cy="-3" rx="37" ry="10" fill="#fff9e7" stroke="#d6b16f" stroke-width="1.5"/><ellipse cy="-4" rx="24" ry="6" fill="none" stroke="#e4d9c5"/></g>`;

async function asset(name, width, height, drawing, extra = '') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs>${commonDefs}${extra}</defs><g stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;
  const file = `${name}.svg`;
  await mkdir(resolve(destination, name, '..'), { recursive: true });
  await writeFile(resolve(destination, file), svg);
  records.push({ file, width, height, sha256: createHash('sha256').update(svg).digest('hex'), origin: 'Original Sunlit Storybook artwork', source: 'scripts/generate-princess-mansion-assets.mjs' });
}

function crown(p) {
  const frame = `<path d="M85 45 77 23l20 10l10-26l14 24l19-25l8 30l18-10l-8 22Z" fill="url(#gold)" stroke="#b18a49" stroke-width="1.7"/><path d="M89 42q34-8 65 2" fill="none" stroke="#fff0bd" stroke-width="3"/>`;
  const center = {
    sun: '<use href="#sun" transform="translate(123 32) scale(.43)"/>',
    moon: '<path d="M128 25q-13 0-12 12q12 7 17-6q-10 6-5-6" fill="#f6f0d2" stroke="#ac925f"/>',
    wave: '<path d="M114 34q5-12 10 0q5-12 10 0q-10 10-20 0" fill="#86c8cf" stroke="#5c9aa7"/>',
    flower: '<use href="#flower" transform="translate(123 33) scale(.38)"/>',
    gem: '<path d="m123 24 9 9-9 10-9-10Z" fill="#ba6678" stroke="#fff0c0"/>',
    music: '<path d="M123 25v13q-8 5-9 0q0-5 7-4v-9l11-3v12q-8 5-9 0q0-5 7-3v-6Z" fill="#7295c0"/>',
    leaf: '<path d="M114 39q-3-18 17-15q0 18-17 15m1-1 10-9" fill="#97b57f" stroke="#728e61"/>',
    star: '<path d="m123 23 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1Z" fill="#ceb2dd" stroke="#9878b2"/>',
  };
  return frame + center[p.crown];
}

function hairBack(p) {
  const shapes = {
    braid: 'M66 89q-13-53 54-58q60-7 66 61l10 125q-44 49-117 3Z',
    'side-braid': 'M67 89q-12-54 53-58q58-7 68 62l-14 135q-53 33-104-8Z',
    waves: 'M65 86q-4-51 55-56q59 1 66 59q24 30 5 53q25 37-3 59q15 27-13 32q-17 17-46-4q-33 22-61 1q-25-19-5-37q-22-24-3-46q-20-27 5-61Z',
    long: 'M68 86q-4-57 51-55q60-6 67 60l25 150q-62 32-144-3Z',
    bob: 'M65 84q-2-56 55-55q57-4 63 60l-7 75q-57 19-112-3Z',
    'bob-curls': 'M64 86q-2-59 57-57q59-3 66 59q16 14 3 30q14 22-3 35q3 26-24 26q-39 15-79-1q-26 0-23-27q-16-14-2-37q-11-13 5-28Z',
    bun: 'M64 91q-5-50 54-56q63-4 67 57l-13 59q-53 22-102-2Z',
    'short-curls': 'M66 91q-7-59 54-61q65 0 65 64q16 18-3 32q3 28-29 27q-34 13-61-1q-31 4-29-23q-18-17 3-38Z',
  };
  let drawing = `<path d="${shapes[p.style]}" fill="url(#hair)" stroke="${p.hair[1]}" stroke-width="2"/>`;
  if (p.style === 'bun') drawing += '<ellipse cx="121" cy="27" rx="37" ry="24" fill="url(#hair)" stroke="#573b32" stroke-width="2"/><path d="M94 20q25-17 46 4m-34-14q24-5 30 19" fill="none" stroke="#c08a61" stroke-width="2"/>';
  if (p.style.includes('curls')) {
    drawing += [62, 76, 91, 152, 169, 182].map((x, i) => `<circle cx="${x}" cy="${65 + (i % 3) * 19}" r="${12 + i % 2 * 3}" fill="url(#hair)" stroke="${p.hair[1]}" stroke-width="1.5"/>`).join('');
  }
  return drawing;
}

function head(p, expression = 'normal') {
  const curls = p.style.includes('curls');
  const front = curls
    ? '<path d="M66 95q-4-54 53-59q48-2 57 58q-24-1-28-28q-9 17-23 2q-10 23-25 7q-16 19-27 2Z" fill="url(#hair)" stroke-width="1.5"/>'
    : '<path d="M68 98q-8-54 50-60q52-5 59 54q-23-7-28-34q-37 30-74 15Z" fill="url(#hair)" stroke-width="1.5"/><path d="M80 59q20-17 51-13M87 67q17-7 28-16" fill="none" stroke="#ffdfa1" stroke-width="3" opacity=".45"/>';
  const eyes = expression === 'closed'
    ? '<path d="M94 107q8 8 16 0m25 0q8 8 16 0" fill="none" stroke="#705149" stroke-width="2.5"/>'
    : `<path d="${expression === 'pout' ? 'M92 96l17 6m26 0 17-6' : 'M91 99q8-5 17 0m27 0q9-6 17-1'}" fill="none" stroke="#805746" stroke-width="2"/><ellipse cx="102" cy="108" rx="7" ry="9" fill="#605147"/><ellipse cx="143" cy="108" rx="7" ry="9" fill="#605147"/><circle cx="104" cy="105" r="2.4" fill="#fff9ea"/><circle cx="145" cy="105" r="2.4" fill="#fff9ea"/>`;
  const mouth = expression === 'pout' ? 'M112 136q10-10 21-1' : expression === 'closed' ? 'M112 132q11 7 21-1' : 'M110 131q11 12 22-1';
  let braid = '';
  if (p.style === 'braid' || p.style === 'side-braid') {
    const x = p.style === 'braid' ? 176 : 66;
    braid = [124, 140, 156, 172, 186].map((y, i) => `<ellipse cx="${x + i % 2}" cy="${y}" rx="${13 - i}" ry="${12 - Math.floor(i / 2)}" transform="rotate(${i % 2 ? -18 : 22} ${x} ${y})" fill="url(#hair)" stroke="${p.hair[1]}" stroke-width="1.2"/>`).join('') + `<path d="m${x - 6} 192 5 14 9-13" fill="${p.accent}" stroke="#b5787b"/>`;
  }
  return `<path d="M108 140v22q11 17 25 0v-22" fill="url(#skin)" stroke="#c3937e" stroke-width="1.5"/>
    <ellipse cx="69" cy="101" rx="10" ry="14" fill="url(#skin)"/><ellipse cx="172" cy="102" rx="10" ry="14" fill="url(#skin)"/>
    <path d="M71 91q-2-49 49-51q52 4 52 55q0 53-51 60q-47-7-50-64" fill="url(#skin)" stroke="#b88976" stroke-width="1.6"/>
    <g stroke="${p.hair[1]}">${front}</g>${eyes}
    <ellipse cx="87" cy="123" rx="10" ry="5" fill="#e69794" opacity=".4"/><ellipse cx="155" cy="123" rx="10" ry="5" fill="#e69794" opacity=".4"/>
    <path d="m121 115-3 6h5" fill="none" stroke="#aa6d62" stroke-width="1.7"/>
    <path d="${mouth}" fill="none" stroke="#a76e66" stroke-width="2"/>${braid}${crown(p)}`;
}

function dress(p, seated = false) {
  const base = seated
    ? 'M93 158q27-12 53 0l15 29q47 26 48 66q-86 22-175 0q-1-41 52-66Z'
    : 'M93 158q27-12 53 0l15 29q27 36 47 119q-86 35-172 0q21-84 50-119Z';
  let ornament = '<path d="m92 181-38 116q29-4 57-28l9-79m27-9 46 116q-28-3-52-27l-21-80" fill="#fff0d4" opacity=".5"/>';
  if (p.id === 'flora') ornament = '<g fill="#f9dfdc" stroke="#d8a5ae"><path d="M120 190q-52 33-65 118q43-1 65-26q26 26 69 24q-15-84-69-116"/><path d="M120 190q-14 49 0 113q16-69 0-113"/></g>';
  if (p.id === 'ruby') ornament = '<path d="m119 189-48 102 49-29 52 31Z" fill="#f6cebc" opacity=".7"/><path d="m121 211 11 16-11 16-11-16Z" fill="#d59294" stroke="#efd5a2"/>';
  if (p.id === 'nova') ornament += '<g fill="#f1dfaa"><path d="m79 257 3 6 7 1-5 4 1 6-6-3-6 3 1-6-5-4 7-1m76-34 3 6 7 1-5 4 1 6-6-3-6 3 1-6-5-4 7-1m-21 40 3 6 7 1-5 4 1 6-6-3-6 3 1-6-5-4 7-1"/></g>';
  return `<path d="${base}" fill="url(#dress)" stroke="${p.dress[1]}" stroke-width="2"/>
    ${seated ? '<path d="M41 248q77 20 161 0" stroke="#fff0d4" stroke-width="4" fill="none"/>' : ornament + '<path d="M42 305q79 30 160 0m-109-98-16 90m67-92 19 92" fill="none" stroke="#dc9a8d" stroke-width="1.6" opacity=".6"/><path d="m63 300 8 3m6 2 8 2m7 2 8 1m10 1h8m11 0 8-1m10-1 8-2m9-2 8-2" stroke="#fff1d3" stroke-width="3"/>'}
    <path d="M87 182q31 14 69 0" fill="none" stroke="url(#gold)" stroke-width="7"/><use href="#sun" transform="translate(121 186) scale(.5)"/>`;
}

await mkdir(destination, { recursive: true });
for (const p of princesses) {
  const defs = gradient('hair', p.hair) + gradient('dress', p.dress) + gradient('skin', p.skin, true);
  const pieces = {
    hair: hairBack(p), dress: dress(p), seated: dress(p, true),
    head: head(p), closed: head(p, 'closed'), pout: head(p, 'pout'),
    'left-arm': '<path d="M86 159q-24-2-34 25l15 14q20-10 28-24" fill="url(#dress)" stroke="#ce9890" stroke-width="2"/><path d="M56 189q-18 9-17 34q4 13 13 5l10-29" fill="url(#skin)" stroke="#b88976" stroke-width="2"/><path d="m44 222 3 3m2-7 3 4" stroke="#b88976" stroke-width="1"/>',
    'right-arm': '<path d="M151 161q24-2 35 24l-15 14q-20-10-27-25" fill="url(#dress)" stroke="#ce9890" stroke-width="2"/><path d="M182 190q18 9 17 34q-4 13-13 5l-10-29" fill="url(#skin)" stroke="#b88976" stroke-width="2"/><path d="m194 222-3 3m-2-7-3 4" stroke="#b88976" stroke-width="1"/>',
    'left-leg': '<path d="M86 298v17q-17 9-12 18q16 8 40-2v-33" fill="url(#skin)" stroke="#b88976" stroke-width="1.5"/><path d="M87 316q-20 4-13 16q16 8 40-2v-14" fill="#ad6b66" stroke="#8e595b" stroke-width="1.8"/>',
    'right-leg': '<path d="M142 298v17q18 9 13 18q-16 8-40-2v-33" transform="translate(21 0)" fill="url(#skin)" stroke="#b88976" stroke-width="1.5"/><path d="M163 316q20 4 13 16q-16 8-40-2v-14" fill="#ad6b66" stroke="#8e595b" stroke-width="1.8"/>',
  };
  for (const [part, drawing] of Object.entries(pieces)) await asset(`characters/${p.id}-${part}`, 240, 340, drawing, defs);
  await asset(`characters/${p.id}-portrait`, 240, 240, `<circle cx="120" cy="120" r="113" fill="${p.dress[0]}" opacity=".4"/><g transform="translate(0 23)">${hairBack(p)}${dress(p)}${head(p)}</g>`, defs);
}

function windowArt(x, y, width = 216, height = 200, night = false) {
  return `<g transform="translate(${x} ${y}) scale(${width / 216} ${height / 200})" filter="url(#shadow)">
    <path d="M0 200V70Q0-10 108-10q108 0 108 80v130Z" fill="url(#gold)" stroke="#b3915d" stroke-width="2"/>
    <path d="M12 188V70q0-67 96-67q96 0 96 67v118Z" fill="${night ? '#677f9b' : 'url(#sky)'}" stroke="#fff4d8" stroke-width="3"/>
    ${night ? '<path d="M147 30q-26 6-15 33q-33-12-12-37q12-11 27 4" fill="#f5e2a3"/><g fill="#eaeac8"><circle cx="61" cy="45" r="2"/><circle cx="173" cy="88" r="2"/><circle cx="86" cy="113" r="2"/><circle cx="33" cy="86" r="1.5"/></g>' : '<path d="M12 154q66-32 129-13q38-37 63-23v70H12Z" fill="#b0c4a1"/><path d="M12 169q91-26 192 3v16H12Z" fill="#94b39c"/>'}
    <path d="M108 4v184M12 106h192" stroke="#f0e0bc" stroke-width="6"/>
    <path d="M-17 2q11 111-2 211q31-7 56-34q-32-70 3-183Z" fill="url(#rose)" stroke="#b6777d" stroke-width="1.6"/><path d="M233 2q-11 111 2 211q-31-7-56-34q32-70-3-183Z" fill="url(#rose)" stroke="#b6777d" stroke-width="1.6"/>
    <path d="M-18-2q125 64 254 0" fill="#e3aba8" stroke="#bf8387" stroke-width="1.6"/><path d="M-18 1q128 72 250 0" fill="none" stroke="url(#gold)" stroke-width="3"/>
    <path d="m-7 143 35 5m163 0 32-5" stroke="url(#gold)" stroke-width="5"/><path d="M-23-8h269" stroke="url(#gold)" stroke-width="6"/></g>`;
}

function chandelier(x, y) {
  return `<g transform="translate(${x} ${y})" stroke="#be955a" stroke-linecap="round"><path d="M0 0v58" stroke-width="3"/><ellipse cy="61" rx="20" ry="7" fill="url(#gold)"/><path d="M0 66v55m-70-38q5 51 70 36q66 15 70-36m-105 11q2 32 35 23q34 9 35-23" fill="none" stroke-width="4"/><g fill="#fff1c0" stroke="#c6a771"><path d="M-80 72h20v21h-20m140-21h20v21h-20m-45-7h18v18h-18m89-18H26v18h18m-7 115H7v28H-7"/></g><g fill="#ffe6a0" stroke="#e6b975"><path d="M-70 71q-7-12 0-19q7 8 0 19m140 0q-7-12 0-19q7 8 0 19m-105 14q-6-11 0-18q6 7 0 18m70 0q-6-11 0-18q6 7 0 18"/></g><path d="m-49 109 4 16-9 5-4-16m106-5-4 16 9 5 4-16m-31 3 5 17-5 11-5-11Z" fill="#f1e5d0" stroke-width="1"/></g>`;
}

function shelf(x, y, books = false) {
  return `<g transform="translate(${x} ${y})"><rect width="180" height="139" rx="12" fill="#cdab88" stroke="#ad8a6b" stroke-width="2"/><rect x="10" y="10" width="160" height="116" rx="5" fill="#997960"/><path d="M9 65h161M9 121h161" stroke="#e8c8a1" stroke-width="8"/>${[17, 46, 77, 110, 141].map((bx, i) => `<rect x="${bx}" y="${books ? 18 : 25}" width="20" height="${books ? 42 : 29}" rx="${books ? 3 : 8}" fill="${['#8aada3', '#d2a1a4', '#c7b38d', '#aaa6c4', '#d6ba8c'][i]}" stroke="#e0c4a1"/><path d="M${bx + 3} 82h20v34h-20Z" fill="${['#d8b084', '#cda0ab', '#8aada3', '#b8a3c6', '#dda399'][i]}"/>`).join('')}</g>`;
}

const rooms = {
  bedroom: { wall: ['#e4dce6', '#c6b8d3'], panel: '#b4bdc8', content: windowArt(80, 87, 180, 180, true) + windowArt(815, 87, 180, 180, true) + chandelier(580, 15) + '<g fill="#f6e0a4"><path d="m382 90 4 8 9 1-6 6 1 9-8-4-8 4 1-9-6-6 9-1m388-27 4 8 9 1-6 6 1 9-8-4-8 4 1-9-6-6 9-1"/></g><g transform="translate(1010 337) scale(.7)"><use href="#plant"/></g>' },
  lounge: { wall: ['#e6ead9', '#c3d3bf'], panel: '#99b6a6', content: shelf(60, 85, true) + shelf(900, 85, true) + '<g transform="translate(444 158)"><path d="M0 168V21Q0 0 35 0h202q35 0 35 21v147Z" fill="#dcccb8" stroke="#bca184" stroke-width="3"/><path d="M49 168V65q0-19 20-19h139q20 0 20 19v103Z" fill="#80695f"/><path d="m78 161 92-43m-64-5 74 51" stroke="#ae8263" stroke-width="10"/><path d="M94 162q-11-32 14-63q-4 25 19 21q-4-25 17-45q-8 33 16 51q30-21 37-3q9 21-6 39Z" fill="#eab773"/><path d="M-17 0h306v21H-17Z" fill="url(#ivory)" stroke="#bca184" stroke-width="2"/><path d="M20 145h232" stroke="#c4aa85" stroke-width="3"/></g>' + chandelier(580, 10) },
  dining: { wall: ['#fff4dc', '#e9b6ad'], panel: '#91b8aa', content: windowArt(135, 81) + chandelier(663, 14) + '<g transform="translate(907 126)"><ellipse rx="52" ry="66" fill="url(#gold)" stroke="#b38a56" stroke-width="2"/><ellipse rx="43" ry="57" fill="#a4b5b6" stroke="#fff1cf" stroke-width="2"/><path d="m-27-37 38 83m-21-88 25 55" stroke="#dce5d5" stroke-width="5" opacity=".55"/><use href="#sun" y="-65"/></g>' + '<g transform="translate(1040 345)"><use href="#plant"/></g>' },
  restroom: { wall: ['#e1ece7', '#bbd5cf'], panel: '#92b2a9', content: windowArt(64, 100, 115, 145) + '<g transform="translate(921 112)"><ellipse rx="66" ry="79" fill="url(#gold)" stroke="#b38a56" stroke-width="2"/><ellipse rx="56" ry="69" fill="#b9d9d5"/><path d="m-25-41 42 89" stroke="#eef9ea" stroke-width="5" opacity=".6"/></g><g transform="translate(780 250)"><path d="M0 0h77" stroke="url(#gold)" stroke-width="6"/><path d="M7 0h61v70H7Z" fill="#eee0d0" stroke="#ccb49d"/><path d="M8 59h60" stroke="#d6bb91" stroke-width="5"/></g><g transform="translate(100 339) scale(.66)"><use href="#plant"/></g>' },
  bathroom: { wall: ['#e0f0ec', '#b8d1d5'], panel: '#98bcb6', content: windowArt(91, 75, 180, 180) + '<g transform="translate(675 116)"><path d="M-65 38q-14-91 65-100q79 9 65 100Z" fill="#f1dfc8" stroke="#c5b196" stroke-width="2"/><path d="M-52 30Q-49-50 0-51q49 1 52 81M-26 33q-12-64 26-83q38 19 26 83M0-51v89" fill="none" stroke="#d5b892" stroke-width="2"/></g><g transform="translate(738 310) scale(.6)"><use href="#plant"/></g><g transform="translate(905 137)"><ellipse rx="65" ry="72" fill="url(#gold)"/><ellipse rx="55" ry="62" fill="#bddbda"/><path d="m-19-40 34 82" stroke="#edf7ec" stroke-width="5"/></g>' },
  games: { wall: ['#f8e6d9', '#e2c0c0'], panel: '#c6b3bf', content: shelf(74, 75) + shelf(905, 76) + '<g transform="translate(560 123)"><rect x="-91" y="-54" width="182" height="139" rx="15" fill="url(#gold)"/><rect x="-81" y="-44" width="162" height="119" rx="9" fill="#f8efd9"/><path d="m-54 51 55-83 55 83Z" fill="#b6c7be"/><circle cx="-45" cy="-17" r="15" fill="#ebc685"/><path d="M-15 38q31-27 75 12" fill="#d8b1b9"/></g>' + '<g transform="translate(100 331) scale(.7)"><use href="#plant"/></g>' },
  ballroom: { wall: ['#e3e5f1', '#bdc6d7'], panel: '#a7b7cc', content: windowArt(80, 86, 170, 180) + windowArt(465, 81, 170, 190) + windowArt(876, 86, 170, 180) + chandelier(660, 13) + '<path d="M442 326h276" stroke="#d9dbe4" stroke-width="4"/>' },
};

for (const [id, room] of Object.entries(rooms)) {
  const drawing = `<rect width="1160" height="370" fill="url(#wall)"/><rect width="1160" height="370" fill="url(#wallpaper)"/>
    <rect y="279" width="1160" height="96" fill="${room.panel}"/><path d="M0 276h1160M0 285h1160" stroke="#e3cc98" stroke-width="5"/><path d="M0 364h1160" stroke="#78968a" stroke-width="7"/>
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 96 + 9}" y="295" width="77" height="60" rx="8" fill="none" stroke="#f5ead1" opacity=".35"/>`).join('')}
    <rect y="370" width="1160" height="145" fill="url(#floor)"/><path d="M0 399h1160M0 435h1160M0 482h1160M62 370 0 515m234-145-54 145m230-145-10 145m204-145 19 145m193-145 40 145m181-145 60 145" fill="none" stroke="#a67863" stroke-width="1.4" opacity=".4"/>
    <path d="M0 15h1160M0 32h1160M0 38h1160" stroke="#e8c592" stroke-width="5"/><path d="M0 25h1160" stroke="#fff6df" stroke-width="7"/>
    ${room.content}<rect width="1160" height="515" fill="url(#paper)"/>`;
  await asset(`rooms/${id}`, 1160, 515, drawing, gradient('wall', room.wall) + gradient('floor', id === 'ballroom' ? ['#c7cfdb', '#e3e8ed'] : ['#bc886f', '#e3b494']));
}
await asset('rooms/yard', 1160, 515, `<rect width="1160" height="515" fill="url(#sky)"/><g fill="#ffffef" opacity=".8"><ellipse cx="126" cy="62" rx="104" ry="23"/><ellipse cx="177" cy="42" rx="66" ry="28"/><ellipse cx="902" cy="93" rx="110" ry="24"/><ellipse cx="958" cy="69" rx="65" ry="30"/></g>
  <path d="M0 264q230-123 466-25q253-96 694-11v287H0Z" fill="#b4c8a0"/><path d="M0 330q307-109 578-15q309-96 582 10v190H0Z" fill="#94b39b"/><path d="M0 400q479-58 1160 0v115H0Z" fill="#dfcdab"/>
  <g transform="translate(808 130)" fill="#e6ddc5" stroke="#b9bd9f" stroke-width="1.5"><path d="M0 126V33h37v93m-37-93L18 0l19 33m-9 93V71h91v55m-3 0V42h36v84m-36-84 18-27 18 27M70 126V17h35v109M70 17 88-14l17 31"/><g fill="#a8bcb1"><path d="M11 59h15v22H11m70-37h13v26H81m45 4h15v22h-15m-69 21h17v27H62"/></g></g>
  <path d="M650 410q-36-126-5-243q-12-54-4-105h38q-4 75 11 121q-26 133 21 227" fill="#ab8563" stroke="#896c52" stroke-width="3"/><g fill="#96b99a" stroke="#7c9b7d" stroke-width="2"><ellipse cx="645" cy="61" rx="136" ry="76"/><ellipse cx="745" cy="85" rx="112" ry="72"/><ellipse cx="562" cy="114" rx="97" ry="66"/><ellipse cx="669" cy="139" rx="133" ry="65"/></g>
  <g transform="translate(407 350)" stroke="#a6b7a4" stroke-width="2"><ellipse cy="61" rx="79" ry="20" fill="#c6d7c5"/><path d="M-65 36q65-22 130 0v24q-65 27-130 0Z" fill="#d7dec7"/><ellipse cy="36" rx="65" ry="16" fill="#b5d5ce"/><path d="M-13 36V-20H13v56" fill="#dddfc5"/><ellipse cy="-19" rx="35" ry="9" fill="#c2d4c0"/></g>
  <g transform="translate(70 299) scale(.7)"><use href="#plant"/></g><g transform="translate(1100 306) scale(.7)"><use href="#plant"/></g><rect width="1160" height="515" fill="url(#paper)"/>`);

const bedBack = `<path d="M30 202V36M222 202V36" stroke="url(#gold)" stroke-width="7"/><path d="M21 40q106-64 211 0v14H21Z" fill="#d49eaa" stroke="#aa7b87" stroke-width="2"/><path d="M28 52q4 58-4 100q23-8 36-29L54 54m168-2q-4 58 4 100q-23-8-36-29l6-69" fill="#eac2c4" stroke="#c698a2" stroke-width="1.5"/><path d="M61 51q62 31 130 0" fill="#edc1c1" stroke="#c698a2"/><path d="M30 109q95-22 192 0v76H30Z" fill="url(#ivory)" stroke="#bc996a" stroke-width="2"/><rect x="48" y="114" width="83" height="38" rx="16" fill="#fff8e8" stroke="#ded0bd"/><circle cx="30" cy="33" r="8" fill="url(#gold)"/><circle cx="222" cy="33" r="8" fill="url(#gold)"/><use href="#sun" x="126" y="29"/>`;
await asset('props/bed-back', 250, 220, bedBack);
await asset('props/bed-front', 250, 220, '<path d="M42 146q79-22 172-1v37H42Z" fill="#94b6b0" stroke="#749c95" stroke-width="2"/><path d="m50 153 17 28m10-34 20 34m11-37 21 37m11-37 20 37m10-35 17 35m-121-14 129-1" stroke="#c2d8c5" stroke-width="1.5" fill="none"/><path d="M24 174h205v19H24Z" fill="url(#gold)" stroke="#b38b52" stroke-width="2"/>');
const couch = '<path d="M40 148v22m222-22v22" stroke="url(#gold)" stroke-width="9"/><rect x="26" y="42" width="256" height="101" rx="43" fill="url(#rose)" stroke="#ac7883" stroke-width="3"/><rect x="44" y="53" width="99" height="65" rx="20" fill="#e1acac" stroke="#bd8992"/><rect x="155" y="53" width="99" height="65" rx="20" fill="#e1acac" stroke="#bd8992"/><path d="M39 108q114-19 229 0v38H39Z" fill="#c28b95" stroke="#ac7883" stroke-width="2"/><rect x="12" y="86" width="42" height="68" rx="18" fill="url(#rose)" stroke="#ac7883" stroke-width="2"/><rect x="253" y="86" width="42" height="68" rx="18" fill="url(#rose)" stroke="#ac7883" stroke-width="2"/><path d="M60 44q35-30 69 0m64 0q35-30 68 0" stroke="#e8c8b2" fill="none" stroke-width="2"/>';
await asset('props/couch', 310, 180, couch);
await asset('props/book', 310, 180, couch + '<g transform="translate(209 91)"><path d="M-28-15q28-13 28 0q16-14 36-8v44q-20-5-36 7q-20-11-28-5Z" fill="#faf2d8" stroke="#a99e82" stroke-width="2"/><path d="M0-15v43" stroke="#c9bb95"/><path d="M9-8h17m-16 9h17m-18 9h18" stroke="#d2bea0"/></g>');
await asset('props/meal-back', 520, 200, '<use href="#chair" x="34" y="3"/><use href="#chair" x="145" y="3"/><use href="#chair" x="256" y="3"/><use href="#chair" x="368" y="3"/>');
await asset('props/meal-front', 520, 200, '<g filter="url(#shadow)"><path d="M85 98q-3 54-20 72m367-72q3 54 20 72" fill="none" stroke="url(#gold)" stroke-width="13"/><path d="M15 63q250-34 491 0l-23 24q-246 35-445 0Z" fill="#ae7a59" stroke="#8c644d" stroke-width="2"/><path d="M22 59q238-39 477 0q-237 38-477 0Z" fill="url(#ivory)" stroke="#dfcfb4" stroke-width="2"/><path d="M72 76q188 14 374-2l-14 60q-35 10-44-2q-13 13-36 8q-29-1-38-13q-25 13-50 2q-33 11-59-1q-25 10-44 0q-35 9-46-4q-31 10-45-4Z" fill="#f6e7d3" stroke="#d9c5a9" stroke-width="1.5"/><path d="m134 90-5 29m45-25 2 25m66-21 1 20m70-24 4 27m48-35 5 26" stroke="#d6bfa6" stroke-width="2" opacity=".65"/><path d="M178 60q88 8 172 0" stroke="#d6a4a0" stroke-width="29"/><use href="#plate" x="75" y="61"/><use href="#plate" x="435" y="61"/><use href="#plate" x="180" y="54"/><use href="#plate" x="342" y="54"/><g transform="translate(259 40)"><ellipse cy="21" rx="45" ry="11" fill="#f9edcf" stroke="#c8a770"/><path d="M-33-6q34-12 68 0v28q-34 12-68 0Z" fill="#dc9fa2" stroke="#bc7b81"/><ellipse cy="-6" rx="34" ry="9" fill="#fff3df"/><path d="M-30 0q7 12 13 2q7 15 13 1q8 14 14 0q8 15 14-3q6 13 10 0" stroke="#fff3df" stroke-width="6" fill="none"/><path d="M-14-20q-10-17 0-16q11-1 0 16m22 1q-9-16 0-16q11 0 0 16" fill="#c67d7b" stroke="#a76567"/></g></g>');
for (const closed of [false, true]) {
  await asset(`props/toilet-${closed ? 'closed' : 'open'}`, 180, 270, `<path d="M22 251V47Q22 7 90 7q68 0 68 40v204Z" fill="${closed ? '#e1b2ad' : '#c3d6cb'}" stroke="${closed ? '#b68a85' : '#8bac9c'}" stroke-width="4"/>
    ${closed ? '<path d="M37 241V49q0-29 53-29q53 0 53 29v192Z" fill="#d19c98" stroke="#edc9b9" stroke-width="3"/><path d="M50 92h81v115H50Z" fill="none" stroke="#b2817e"/><rect x="56" y="46" width="68" height="32" rx="10" fill="#86665b"/><path d="M78 70V57q0-14 13-14q12 0 12 14v13M74 59h34v15H74Z" fill="#ead6aa" stroke="#ead6aa" stroke-width="2"/><circle cx="129" cy="166" r="6" fill="url(#gold)"/>' :
      '<path d="M38 251V51q0-29 52-29q52 0 52 29v200Z" fill="#f1e8d8"/><path d="M67 171q22-19 46 0v35H67Z" fill="#fbf9ef" stroke="#bcbaa9" stroke-width="2"/><ellipse cx="89" cy="177" rx="33" ry="10" fill="#fffdf0" stroke="#c1baa8" stroke-width="2"/><path d="M69 136h38v29H69Z" fill="#fffdf0" stroke="#c1baa8" stroke-width="2"/><path d="M82 206h20l8 22H74Z" fill="#fffdf0" stroke="#c1baa8"/><path d="m37 28-29 12v216l29-18Z" fill="#aac7bc" stroke="#829f94" stroke-width="3"/><circle cx="17" cy="164" r="5" fill="#c9a465"/>'}`);
}
await asset('props/bath-back', 300, 200, '<path d="M221 75V35q0-12 15-12q17 0 17 14v8h-16" fill="none" stroke="url(#gold)" stroke-width="9"/><ellipse cx="150" cy="99" rx="127" ry="20" fill="url(#water)" stroke="#e1d2bb" stroke-width="6"/>');
await asset('props/bath-front', 300, 200, '<path d="m55 145-7 36m175-36 8 36" stroke="url(#gold)" stroke-width="10"/><path d="M24 98q125-29 253 0l-19 57q-17 27-108 26q-94 1-109-26Z" fill="url(#ivory)" stroke="#c9b79d" stroke-width="2"/><path d="M30 106q123 16 239 0" fill="none" stroke="#fffef3" stroke-width="5"/><g fill="#fffcf1" stroke="#d6edf0"><circle cx="61" cy="94" r="17"/><circle cx="85" cy="90" r="14"/><circle cx="113" cy="94" r="18"/><circle cx="140" cy="88" r="14"/><circle cx="163" cy="94" r="17"/><circle cx="193" cy="89" r="13"/><circle cx="214" cy="95" r="16"/></g><use href="#sun" transform="translate(149 142) scale(.65)"/><g transform="translate(228 87)"><path d="M-12 5q-5-17 10-17q11 1 9 12q20 1 11 11q-20 6-30-6" fill="#f2d286" stroke="#cda35e"/><path d="m8-6 10 3-10 3" fill="#d99065"/><circle cx="3" cy="-6" r="1.5" fill="#605147"/></g>');
await asset('props/wash', 200, 235, '<path d="M30 125h140l-22 46H52Z" fill="url(#ivory)" stroke="#baa98e" stroke-width="2"/><ellipse cx="100" cy="125" rx="69" ry="16" fill="#e6ecdf" stroke="#d4c5ac" stroke-width="4"/><path d="M78 170h44v51H78Z" fill="#f4e7d0" stroke="#baa98e"/><path d="M113 114V82q0-10 12-10q14 0 14 13v7h-17" stroke="url(#gold)" stroke-width="7" fill="none"/><rect x="23" y="46" width="37" height="63" rx="7" fill="#e9d7c7" stroke="#bda388"/><path d="M25 50h34" stroke="#d0b486" stroke-width="4"/><path d="M152 105v-27h15v27" fill="#b8cbb4" stroke="#8ca187"/><use href="#flower" transform="translate(162 56) scale(.5)"/>');
await asset('props/toys', 320, 185, '<path d="M30 150v28m260-28v28" stroke="url(#wood)" stroke-width="10"/><rect x="13" y="116" width="294" height="37" rx="11" fill="url(#wood)" stroke="#ad8266" stroke-width="2"/><g stroke="#a18783" stroke-width="2"><rect x="44" y="67" width="60" height="50" rx="5" fill="#a8c2b7"/><rect x="108" y="73" width="55" height="44" rx="5" fill="#d4a9ad"/><rect x="175" y="75" width="57" height="42" rx="5" fill="#c3b5d1"/><path d="m37 66 36-43 38 43Zm131 9 36-41 36 41Z" fill="#e4c392"/><rect x="114" y="40" width="44" height="34" rx="4" fill="#dac398"/><path d="m106 39 31-29 30 29" fill="#d0a4b1"/><path d="M59 116V92q12-18 25 0v24m35 0V92q12-18 25 0v24m46 0V94q12-18 25 0v22" fill="#fff1d5"/></g>');
await asset('props/draw', 250, 235, '<path d="m53 36-28 185m173-185 28 185m-191-13h175" stroke="url(#wood)" stroke-width="10"/><rect x="37" y="25" width="180" height="153" rx="7" fill="url(#wood)" stroke="#ae8a68" stroke-width="2"/><rect x="48" y="35" width="158" height="131" rx="3" fill="#fff9e6"/><path d="M64 141q31-31 62-8q41-28 66 3" fill="#b6d0af"/><circle cx="167" cy="65" r="16" fill="#f0d096"/><path d="M83 136V81h36v55m-41-55 24-27 25 27" fill="#dbc2cf" stroke="#af93a9"/><path d="M91 114h17v22" fill="#f4e7d0"/><rect x="185" y="172" width="38" height="31" rx="8" fill="#b5cbb5" stroke="#8ba591"/><path d="m193 172 9-35m4 35 9-33" stroke="#b9856e" stroke-width="5"/>');
await asset('props/dance', 410, 100, '<ellipse cx="205" cy="56" rx="201" ry="42" fill="#bfbed1" stroke="#e1d8b7" stroke-width="4"/><ellipse cx="205" cy="56" rx="180" ry="33" fill="none" stroke="#d9d3e3" stroke-width="2"/><path d="M142 56q63-24 126 0q-63 24-126 0Z" fill="none" stroke="#f6e3b0" stroke-width="2"/><use href="#sun" transform="translate(205 56) scale(.8)"/>');
await asset('props/piano', 280, 200, '<path d="m32 157-9 32m228-32 9 32" stroke="url(#wood)" stroke-width="11"/><path d="M17 150V44Q27 13 70 13h155q37 6 38 42v95Z" fill="#937982" stroke="#755e68" stroke-width="3"/><path d="M28 133h224v29H28Z" fill="#e8e4d5" stroke="#b7ae9c" stroke-width="2"/><path d="M31 53h221v76H31Z" fill="#ad9296" stroke="#baa892"/><path d="M136 58v68m-92 5v29m18-29v29m18-29v29m18-29v29m18-29v29m18-29v29m18-29v29m18-29v29m18-29v29m18-29v29m18-29v29" stroke="#b4a996" stroke-width="1.3"/><g fill="#716371"><rect x="47" y="132" width="10" height="18"/><rect x="65" y="132" width="10" height="18"/><rect x="101" y="132" width="10" height="18"/><rect x="119" y="132" width="10" height="18"/><rect x="137" y="132" width="10" height="18"/><rect x="173" y="132" width="10" height="18"/><rect x="191" y="132" width="10" height="18"/></g><use href="#sun" transform="translate(141 94) scale(.7)"/>');
await asset('props/swing', 220, 310, '<path d="M29 20h162" stroke="#98775b" stroke-width="12"/><path d="M47 27v208m126-208v208" stroke="#d3c29d" stroke-width="5"/><path d="M28 238q81 23 163 0v22H28Z" fill="url(#wood)" stroke="#98775b" stroke-width="3"/><path d="M36 240h147" stroke="#f1d9b2" stroke-width="3"/>');
await asset('props/garden', 290, 150, '<path d="M10 91q138-41 271 0v44H10Z" fill="#bc947b" stroke="#9b7864" stroke-width="2"/><path d="M13 89q133-39 265 0" fill="#9c8767" stroke="#c8ac88" stroke-width="4"/>' + [45, 86, 128, 170, 213, 254].map((x, i) => `<g transform="translate(${x} ${68 - i % 2 * 20})"><use href="#flower" transform="scale(${i % 2 ? 1.2 : 1})"/></g>`).join('') + '<g transform="translate(249 114)"><path d="M-14-17h31v22h-31Z" fill="#9bbba9" stroke="#6d9c89"/><path d="m17-12 17-12 5 6L17 0m-31-11q-17-6-15 7q0 10 15 3" fill="none" stroke="#6d9c89" stroke-width="4"/></g>');

const icons = {
  meal: '<path d="M18 8v43m-7-42v13q7 8 14 0V9m22 0q-12 13-9 23h9v19" fill="none" stroke="#a38a62" stroke-width="4"/>',
  moon: '<path d="M45 11q-25 4-14 29q-31-2-22-24q10-24 36-5Z" fill="#e3c484" stroke="#b69455" stroke-width="2"/>',
  bubble: '<circle cx="27" cy="35" r="17" fill="#cfeaec" stroke="#8eb9c3" stroke-width="2"/><circle cx="46" cy="13" r="8" fill="#e4f6ef" stroke="#8eb9c3"/><path d="M17 30q1-7 7-8" fill="none" stroke="#fff" stroke-width="3"/>',
  door: '<path d="M14 53V19q0-12 17-12q17 0 17 12v34Z" fill="#d1b5b2" stroke="#ad8484" stroke-width="2"/><path d="M20 47V22q0-7 11-7q11 0 11 7v25" fill="none" stroke="#f0debf"/><circle cx="39" cy="35" r="3" fill="#dfc58b"/>',
  star: '<path d="m30 5 8 16 18 3-13 13 3 18-16-8-16 8 3-18L4 24l18-3Z" fill="#ead397" stroke="#b79962" stroke-width="2"/>',
  heart: '<path d="M30 53Q-9 31 9 13q11-10 21 4q12-15 23-3q14 18-23 39" fill="#dfa49f" stroke="#b67a80" stroke-width="2"/>',
};
await asset('props/snack-back', 205, 130, '<path d="M72 115V40q0-29 33-29q33 0 33 29v75" fill="url(#gold)" stroke="#b18756" stroke-width="2"/><path d="M81 94V40q0-19 24-20q24 1 24 20v54Z" fill="#c4d2bd" stroke="#91a58e"/><path d="M71 90q34-8 69 0v14H71Z" fill="url(#ivory)" stroke="#c1a87d"/><path d="m77 104-5 23m61-23 5 23" stroke="#bc9766" stroke-width="5"/>');
await asset('props/snack-front', 205, 130, '<g filter="url(#shadow)"><path d="m34 51-8 69m145-69 8 69" stroke="url(#gold)" stroke-width="8"/><ellipse cx="103" cy="40" rx="91" ry="17" fill="url(#ivory)" stroke="#d3bd95" stroke-width="2"/><path d="M19 48q82 23 168 0l-10 24q-36 9-74 7q-35 2-74-7Z" fill="#efddc6" stroke="#d3bd95"/><use href="#plate" transform="translate(103 36) scale(.74)"/><path d="M80 30q-5-24 14-20q10 0 8 20" fill="#dcaba0" stroke="#bd8476"/><path d="M93 15q-4-11 5-13" fill="none" stroke="#95aa89" stroke-width="3"/><path d="M108 26q0-17 19-12q17 1 12 17Z" fill="#d4b486" stroke="#ac8b5f"/><path d="m114 15 7 13m6-13 7 13" stroke="#f2ddbc" stroke-width="3"/></g>');
await asset('props/music-box', 170, 145, '<path d="m43 111-9 29m103-29 9 29" stroke="url(#wood)" stroke-width="7"/><ellipse cx="88" cy="112" rx="63" ry="12" fill="#d9b58e" stroke="#ab825e"/><path d="M38 52q50-27 102 0l-11 45q-39 17-79 0Z" fill="url(#rose)" stroke="#ac7e87" stroke-width="2"/><ellipse cx="88" cy="53" rx="50" ry="16" fill="#edc8be" stroke="#ac7e87" stroke-width="2"/><path d="M39 48V23q50-28 101 0v25" fill="#d4ada9" stroke="#ac7e87" stroke-width="3"/><path d="M48 34V26q38-20 80 0v8q-43 18-80 0Z" fill="#e7dbbd"/><use href="#sun" transform="translate(88 62) scale(.65)"/><path d="M49 80H24v-12" fill="none" stroke="url(#gold)" stroke-width="5"/><circle cx="24" cy="66" r="7" fill="#ead397" stroke="#ad8b52"/><path d="M67 100h40" stroke="url(#gold)" stroke-width="4"/>');
for (const [name, drawing] of Object.entries(icons)) await asset(`icons/${name}`, 60, 60, drawing);
await writeFile(resolve(destination, 'manifest.json'), JSON.stringify({ version: 1, artDirection: 'Sunlit Storybook', authorship: 'Original artwork created for mini-games; no paid or third-party character art.', assets: records }, null, 2) + '\n');
await writeFile(resolve(destination, 'credits.txt'), 'Royal Princess Mansion: original Sunlit Storybook vector artwork.\nReproducible source: scripts/generate-princess-mansion-assets.mjs\nNo Disney/Pixar characters, paid assets, external fonts, or third-party asset packs are included.\n');
console.log(`Generated ${records.length} original princess, room, prop and icon SVG assets.`);

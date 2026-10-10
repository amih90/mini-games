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

// Expansion assets deliberately leave the original drawings and their byte hashes intact.
const expansionDefs = `
  ${gradient('ex-cream', ['#fff8e6', '#e5ccb0'])}${gradient('ex-copper', ['#f0c598', '#a77965'])}
  ${gradient('ex-sand', ['#f5dfb8', '#d4b994'])}${gradient('ex-sea', ['#b4ddd5', '#7badbc'])}
  ${gradient('ex-leaf', ['#c7d5a5', '#789c88'])}${gradient('ex-moss', ['#9bb6a5', '#547c70'])}
  ${gradient('ex-pink', ['#f6cfca', '#c38c9b'])}${gradient('ex-lilac', ['#e0d2ef', '#a28abf'])}
  ${gradient('ex-glass', ['#fffdf0', '#c5e0d5'])}${gradient('ex-stone', ['#e6d9bc', '#b49b86'])}
  ${gradient('ex-roof', ['#dda596', '#aa776f'])}${gradient('ex-mirror', ['#f4f5df', '#9fbec1'])}
  <pattern id="ex-weave" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 2h10M2 0v10M0 7h10M7 0v10" stroke="#fff5da" stroke-width=".65" opacity=".3"/></pattern>
  <pattern id="ex-bricks" width="156" height="80" patternUnits="userSpaceOnUse"><path d="M0 1h156M0 40h156M0 79h156M78 0v40M18 40v40M126 40v40" stroke="#a98e7a" stroke-width="2" opacity=".45"/><path d="M4 5h67m13 0h65M24 45h94M4 74h9m113 0h24" stroke="#fff3d4" stroke-width="2" opacity=".55"/><path d="m38 22 15-2m46 42 11-1m-73 9h12" stroke="#a68d79" opacity=".22"/></pattern>
  <pattern id="ex-mall-tiles" width="92" height="72" patternUnits="userSpaceOnUse"><path d="M0 0h92v72H0Z" fill="none" stroke="#c5a58d" stroke-width="1.3"/><path d="m46 22 13 14-13 14-13-14Z" fill="#ead6be" stroke="#c9ad90" stroke-width=".7"/><path d="M4 4h84M4 5v62" stroke="#fff3dc" opacity=".6"/></pattern>
  <pattern id="ex-terrazzo" width="100" height="84" patternUnits="userSpaceOnUse"><path d="m8 14 7-3 4 7-9 2m49 37 10-2 4 8-11 1m-33 6 6 4-4 7-5-3m40-61 9-3 3 5-8 3" fill="#ceaaa0" opacity=".5"/><path d="m30 26 9-2 3 6-10 2m-6 36 10 3-2 5-11-2m45-20 7 1-1 6-8-1" fill="#90b6ad" opacity=".5"/><path d="m52 11 7 2-2 5-7-2m-39 30 6-3 3 6-6 3m43 23 9 2-2 4-8-1" fill="#c5b3cd" opacity=".5"/></pattern>
  <pattern id="ex-waffle" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#e1b77b"/><path d="m-8 0 24 24M0-8l24 24m-32 0L16-8M0 24 24 0" stroke="#bb8c57" stroke-width="1.7"/><path d="m-7-2 24 24m-24-8L15-10" stroke="#f4d498" stroke-width=".8"/></pattern>
  <pattern id="ex-shingles" width="28" height="26" patternUnits="userSpaceOnUse"><path d="M0 0v13q7 12 14 0q7 12 14 0V0" fill="none" stroke="#9b6965" stroke-width="1.1" opacity=".65"/></pattern>
  <pattern id="ex-grain" width="55" height="90" patternUnits="userSpaceOnUse"><path d="M12-6q-15 32 0 65t0 39M39-6q17 34 0 69t0 32M21 8q14 24 2 41q-14-25-2-41" stroke="#80634f" stroke-width="1" fill="none" opacity=".25"/></pattern>
  <pattern id="ex-stars" width="104" height="78" patternUnits="userSpaceOnUse"><path d="m25 19 2 5 6 1-4 4 1 5-5-3-5 3 1-5-4-4 6-1m58 25 1 4 5 1-4 3 1 4-4-2-4 2 1-4-4-3 5-1" fill="#fff1cb" stroke="#bdad86" stroke-width=".5" opacity=".65"/><circle cx="53" cy="64" r="2" fill="#c7b9cb" opacity=".6"/></pattern>
  <g id="ex-leaf-mark"><path d="M-10 9Q-17-8 8-13Q18 7-10 9Z" fill="url(#ex-leaf)" stroke="#668b72" stroke-width="1.1"/><path d="m-12 13 19-23M-4 3l-7-3m11-3 7 1" fill="none" stroke="#6b8c73" stroke-width="1"/></g>
  <g id="ex-rose-mark" stroke="#b17880" stroke-width="1"><path d="M-13 4q-6-13 6-15q8-10 15-1q14 3 6 17q-8 12-21 5Z" fill="#eeb9b3"/><path d="M-7 0q0-10 10-5q9 7-3 12q-8-2-4-8q4-3 6 1M-10 6q2 10 12 6M5-8q9 0 8 7" fill="none"/><path d="m-10 10-10 5q-3-10 5-14m22 9 12 3q0-10-9-12" fill="#9eaf8e" stroke="#7f977a"/></g>
  <g id="ex-star-mark"><path d="m0-15 4 9 10 2-8 7 2 11-8-5-9 5 2-11-8-7 11-2Z" fill="#f4dba2" stroke="#b99a62" stroke-width="1.3"/><path d="m-2-8 2 6 6 1" stroke="#fff5d5" stroke-width="1.5" fill="none"/></g>
  <g id="ex-moon-mark"><path d="M10-13Q-9-10-3 8Q-22 6-13-9Q-4-23 10-13Z" fill="#e4d4f0" stroke="#a18cb7" stroke-width="1.2"/><circle cx="10" cy="4" r="2" fill="#f2dfa4"/><circle cx="6" cy="-4" r="1.2" fill="#f2dfa4"/></g>
  <g id="ex-petal-mark" stroke="#ba8291" stroke-width="1"><path d="M0 2Q-19-2-11-13Q4-15 0 2Q14-17 20-3Q16 9 0 2Q-4 18-14 9Q-16-1 0 2Z" fill="#f0bacb"/><circle r="3" fill="#f6dc9e"/><path d="M1 6q11 9 14 3" fill="none" stroke="#8ca685"/></g>
  <g id="ex-crystal-mark" stroke="#937bac" stroke-width="1"><path d="m0-20 11 13-2 22-12 8-11-17 5-20Z" fill="#c6b4df"/><path d="m0-20-3 20 12 15M-14 6-3 0 11-7M-3 0v23" fill="none"/><path d="m0-17 5 7-6 6" fill="#f0e2f5" stroke="none"/></g>
  <g id="ex-drop-mark"><path d="M0-18Q-21 5-9 15Q6 26 15 10Q20 1 0-18Z" fill="#b8ddd4" stroke="#77a9a4" stroke-width="1.2"/><path d="M-6 2q-6 7-2 11" fill="none" stroke="#f5fff0" stroke-width="2"/></g>`;

const newAsset = (name, width, height, drawing, defs = '') => asset(name, width, height, drawing, expansionDefs + defs);
const mark = (id, x, y, scale = 1) => `<use href="#ex-${id}-mark" transform="translate(${x} ${y}) scale(${scale})"/>`;
const cloud = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})" fill="#fffbed" opacity=".8"><path d="M-70 12q-20-24 11-34q10-33 43-16q24-29 54-5q39-10 44 22q33 3 27 28q-49 19-179 5Z"/><path d="M-59 7q63 10 141-1" fill="none" stroke="#fffdf3" stroke-width="4"/></g>`;

function sprig(x, y, scale = 1, color = '#9db28d') {
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="#779071" stroke-width="1.4"><path d="M0 5Q-7-24 0-59" fill="none"/><path d="M-1-9q-26-5-24-22q21-2 24 22m0-14q23-4 25-23q-21-4-25 23m0-18q-21-5-16-22q16 0 16 22" fill="${color}"/><path d="m-19-25 17 11m19-25-16 11" fill="none" opacity=".5"/></g>`;
}

function fairyBottle(x, y, color, emblem = 'star', scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-10-73v13q-17 3-17 23v26q0 14 27 14q27 0 27-14v-26q0-20-17-23v-13Z" fill="url(#ex-glass)" fill-opacity=".88" stroke="#a6b6a5" stroke-width="1.6"/><path d="M-23-32q24-7 46 0v20q0 10-23 10q-23 0-23-10Z" fill="${color}" opacity=".8"/><ellipse cy="-32" rx="23" ry="5" fill="${color}" stroke="#fff4d9" stroke-width=".7"/><path d="M-16-47q-5 12-3 31" fill="none" stroke="#fffdf1" stroke-width="3" opacity=".8"/><rect x="-13" y="-80" width="26" height="12" rx="3" fill="url(#wood)" stroke="#b68b62"/><path d="M-13-69h26" stroke="url(#gold)" stroke-width="3"/><ellipse cy="-18" rx="17" ry="13" fill="#fff7dc" stroke="#d1b892" stroke-width=".8"/>${mark(emblem, 0, -18, .56)}<path d="m17-7 3-2" stroke="#fefcea" stroke-width="2"/></g>`;
}

function bookPile(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke-width="1.4"><path d="M-45-14h90v14h-90Z" fill="#8eaba3" stroke="#6e8e84"/><path d="M-38-11h78v8h-78" fill="#f2e7cc" stroke="#d8c7a7"/><path d="M-39-29h77v14h-77Z" fill="#d2a0a4" stroke="#b27d85"/><path d="M-32-26h65v8h-65" fill="#f5e6ce" stroke="#d8c7a7"/><path d="M-46-45h86v16h-86Z" fill="#c7b18c" stroke="#ab9272"/><path d="M-39-41h73v8h-73" fill="#f6ebd2" stroke="#d8c7a7"/><path d="M-20-44v15m47-15v15M-17-28v12m36-12v12M-21-13v12m42-12v12" stroke="#ecd6a7"/><path d="M-31-38h48m-45 15h38m-31 15h39" stroke="#b8a484" stroke-width=".7" opacity=".5"/></g>`;
}

function lantern(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke="#b69562" stroke-width="1.7"><path d="M0-35v20m-5 0q5-13 10 0" fill="none"/><path d="M-18-13q18-13 36 0l8 38q-26 16-52 0Z" fill="url(#ex-cream)"/><path d="M-12-9h24l7 30q-19 9-38 0Z" fill="#f5df9e" stroke="#d5b276"/><ellipse cy="10" rx="8" ry="11" fill="#fff3bd" stroke="none"/><path d="M-24 26h48M-5 37H5m-5-4v9" fill="none" stroke-width="3"/></g>`;
}

function mirror(x, y, width = 144, height = 220) {
  return `<g transform="translate(${x} ${y}) scale(${width / 144} ${height / 220})"><path d="M7 206V61Q7 0 72 0q65 0 65 61v145Z" fill="url(#gold)" stroke="#b5966b" stroke-width="2"/><path d="M17 197V64q0-53 55-53q55 0 55 53v133Z" fill="url(#ex-mirror)" stroke="#f9eed5" stroke-width="2"/><path d="m28 59 65 124m-37-145 54 102" stroke="#ffffec" stroke-width="8" opacity=".45"/><path d="M9 207h126m-114 1-7 11m109-11 7 11" stroke="url(#wood)" stroke-width="5"/><use href="#sun" transform="translate(72 8) scale(.5)"/><path d="M20 70q-8 54 0 106m105-106q8 54 0 106" fill="none" stroke="#e6c899" stroke-width="1.4"/></g>`;
}

function miniGown(x, y, color, trim = '#f7e7cb', scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0-49v-11q-9-5-2-11m-24 29L0-55l25 13" fill="none" stroke="#ba9870" stroke-width="2"/><path d="M-16-46q16 9 32 0l9 17-9 7q8 25 23 65q-40 18-79 0q14-37 24-65l-10-7Z" fill="${color}" stroke="#a68986" stroke-width="1.6"/><path d="M-15-18q15 7 30 0M-33 40q31 12 66 0" fill="none" stroke="${trim}" stroke-width="4"/><path d="M-5-42 0-24 5-42m-5 29-5 45m12-45 8 42" fill="none" stroke="${trim}" stroke-width="1.4" opacity=".7"/>${mark('rose', 0, -15, .32)}</g>`;
}

function dragon(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke-linecap="round" stroke-linejoin="round"><path d="M-32 50q-79 38-71-13q12 28 44-8" fill="#aec5ad" stroke="#7f9d89" stroke-width="2.4"/><path d="M-36-5Q-92-63-99-7q23-19 39 12q-6-37 24-10m53-1q46-56 69-16q-26-4-38 31q-4-34-31-15" fill="#c8b3d9" stroke="#9d8bb2" stroke-width="2"/><path d="M-74-26-61 3m128-18-15 16" stroke="#e9d9e9" stroke-width="2" fill="none"/><ellipse cx="-2" cy="23" rx="48" ry="53" fill="#b7cfb7" stroke="#7e9e8d" stroke-width="2.5"/><path d="M-21-10q-16 48 4 70q43 10 40-41q-5-33-44-29" fill="#f1e1ba" stroke="#c5b38a" stroke-width="1.5"/><path d="M-22-8q-15 43 5 66q41 8 38-36" fill="none" stroke="#b7a782" stroke-width="1" stroke-dasharray="3 5"/><path d="m-12 35 11-8 11 8-10 15Z" fill="#dfabb2" stroke="#ba8291"/><path d="M-26-30q-11-11-23-1q-10-27 5-29q16 0 21 17m43-2q12-22 24-15q8 12-4 22" fill="#c9b2d4" stroke="#9a86aa" stroke-width="2"/><path d="M-27-37q-13-20 5-42l8 16m32-2 10-19q20 18 8 35" fill="#e9c994" stroke="#b3956c" stroke-width="2"/><path d="M-33-45q11-34 48-25q35 3 38 41q24 8 12 26q-16 11-38 1q-28 18-51-5q-15-13-9-38" fill="#b9d1ba" stroke="#7e9e8d" stroke-width="2.4"/><path d="M30-30q30-3 35 19q-6 17-38 7" fill="#f2e4c5" stroke="#9cb29a" stroke-width="1.4"/><circle cx="12" cy="-39" r="6.2" fill="#6f5c50"/><circle cx="14" cy="-41" r="2" fill="#fff8e5"/><path d="m9-43 6 8m0-8-6 8" stroke="#a4957c" stroke-width=".7"/><circle cx="50" cy="-18" r="2.5" fill="#8f8671"/><path d="M32-8q11 6 17-1" fill="none" stroke="#a78b72" stroke-width="1.8"/><ellipse cx="-4" cy="-16" rx="10" ry="5" fill="#e5b2a9" opacity=".6"/><path d="M-32 12q-29 15-17 32q11 10 23-10m56-17q22 12 13 27q-12 9-24-7" fill="#b7cfb7" stroke="#7e9e8d" stroke-width="2"/><path d="M-30 61q-33-2-29 18q25 15 43 0m26-15q32-4 32 15q-24 15-44 1" fill="#b0c7ae" stroke="#7e9e8d" stroke-width="2"/><path d="m-48 78 3-6m7 8 2-7m20-134 4-9 8 8m-11 6 5-4" fill="#d6b8c8" stroke="#ac8caa" stroke-width="1.3"/></g>`;
}

function royalTrain(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" stroke-linejoin="round" stroke-linecap="round"><path d="M-130 44h259m-248-4v10m24-10v10m24-10v10m24-10v10m24-10v10m24-10v10m24-10v10m24-10v10m24-10v10m24-10v10" stroke="#b89976" stroke-width="3"/><path d="M-117 29h233" stroke="#efd4a3" stroke-width="4"/><path d="M-116-6h72v32h-72Z" fill="#94b8ae" stroke="#728f85" stroke-width="2"/><path d="M-76-8v-35h33v62h-33Z" fill="#d7a3a8" stroke="#ae7e8b" stroke-width="2"/><path d="M-81-39q23-12 43 0v8h-43Z" fill="#eac794" stroke="#b59a74" stroke-width="1.5"/><rect x="-71" y="-29" width="20" height="23" rx="4" fill="#f8e8c5" stroke="#c09e79"/><path d="M-107-8v-19h14v19M-111-29h22v7h-22" fill="url(#gold)" stroke="#b49460" stroke-width="1.5"/><path d="m-119 11-14 16h18m75-13h17m75 0h15" fill="none" stroke="#9b7a69" stroke-width="3"/><path d="M-27-16h73v41h-73Z" fill="#c8b9d6" stroke="#9e8da9" stroke-width="2"/><path d="M-32-17q40-28 83 0v8h-83Z" fill="#dcc29a" stroke="#ae9271" stroke-width="1.5"/><path d="m-4-33-4-13 10 6 7-14 7 14 12-6-5 14Z" fill="url(#gold)" stroke="#b69b67" stroke-width="1.3"/><path d="M-16-8h20v23h-20m9-23v23M15-8h20v23H15m10-23v23" fill="#fff0d3" stroke="#a799ab" stroke-width="1.3"/><path d="M68-13h48v38H68Z" fill="#d8aaa1" stroke="#af867a" stroke-width="2"/><path d="m63-12 29-26 30 26Z" fill="#a7beb4" stroke="#7b9b8d" stroke-width="1.5"/><rect x="82" y="-6" width="21" height="22" rx="7" fill="#f6e6c5" stroke="#bc9a7c"/>${[-101, -54, -13, 33, 80, 105].map((wx, i) => `<g transform="translate(${wx} 29)"><circle r="${i === 0 ? 12 : 10}" fill="#a17e6a" stroke="#765f52" stroke-width="1.8"/><circle r="6" fill="#e9cba0" stroke="#c0a079"/><path d="M-4 0h8M0-4v8" stroke="#b9956b" stroke-width="1"/><circle r="2" fill="#fff0cf"/></g>`).join('')}<path d="M-119 3h64m29 19h69m26-1h45" stroke="#f8e5c4" stroke-width="2"/><path d="M-100-37q-12-8-2-15q14-4 14 5m-6-14q-11-9 3-17q14-3 16 8" fill="#fbf1dc" stroke="#d7c6b1" stroke-width="1.5"/></g>`;
}

function bubbleWand(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="m-34 84 55-97" stroke="#8cab9c" stroke-width="12"/><path d="m-33 81 54-94" stroke="#e0e8ca" stroke-width="3"/><path d="M8-28q-25-6-17-24q9-17 27-3q-4-27 16-26q20 0 15 23q23-12 30 6q7 19-18 23q16 23-4 32q-17 9-29-15q-12 20-28 8q-15-13 8-24" fill="#e5b3c4" fill-opacity=".75" stroke="#b88ea4" stroke-width="2.4"/><circle cx="32" cy="-31" r="22" fill="#d9eeea" fill-opacity=".2" stroke="#f2dba9" stroke-width="5"/><path d="M18-42q5-9 15-9" stroke="#fff9e4" stroke-width="3" fill="none"/><path d="M15-4q-14 34-43 34q30 3 38-10m20-19q11 24 38 17q-22 26-40 2" fill="#e7c894" stroke="#c3a073" stroke-width="1.4"/><path d="M-67 41h39v42q-19 14-39 0Z" fill="#bbd5c6" stroke="#8cab9c" stroke-width="2"/><ellipse cx="-47" cy="41" rx="20" ry="7" fill="#f5e5bd" stroke="#bea67c" stroke-width="2"/><path d="M-55 60q9-13 18 0q4 7-9 16q-15-9-9-16Z" fill="#f6e8cd" stroke="#c6b98e"/>${[[83, -76, 19], [-27, -92, 14], [94, 32, 23], [-69, -29, 17], [71, 76, 10]].map(([bx, by, r], i) => `<g><circle cx="${bx}" cy="${by}" r="${r}" fill="${['#c8e8df', '#e5cfe7', '#cae7e8', '#f2d5b9', '#e6d8ed'][i]}" fill-opacity=".36" stroke="${['#95bfb5', '#baa0c9', '#95b9c1', '#d2ae92', '#baa4c8'][i]}" stroke-width="1.3"/><path d="M${bx - r * .5} ${by - r * .05}q0-${r * .6} ${r * .55}-${r * .62}" fill="none" stroke="#fffcef" stroke-width="2.5"/></g>`).join('')}</g>`;
}

const flavors = {
  strawberry: { light: '#f7ced0', dark: '#d996a9', fruit: '#c9808b' },
  vanilla: { light: '#fff0ce', dark: '#dbc39f', fruit: '#c5a275' },
  blueberry: { light: '#decff0', dark: '#aa92c7', fruit: '#827499' },
};

function iceCream(x, y, flavor = 'strawberry', scale = 1) {
  const palette = flavors[flavor];
  const topping = flavor === 'strawberry'
    ? '<path d="M6-51q-19-12-25 4q3 15 18 17q14-7 7-21Z" fill="#ce8591" stroke="#ac707d" stroke-width="1.2"/><path d="m-12-51 3-7 5 7 8-5-3 7" fill="#9bb68e" stroke="#758f74" stroke-width="1"/><path d="m-11-43 1 2m5-4 1 2m2 5 1 2" stroke="#f5d4aa" stroke-width="1.5"/>'
    : flavor === 'blueberry'
      ? '<g fill="#8e7cab" stroke="#70658a"><circle cx="-12" cy="-40" r="7"/><circle cx="1" cy="-46" r="8"/><circle cx="11" cy="-36" r="7"/><path d="m-13-43 2 3-4-1m11-9 1 4-4-2m13 10 3 1-4 2" fill="none" stroke="#c3b4d5" stroke-width="1.1"/></g><path d="M5-51q12-15 21-8q-3 12-16 12" fill="#b3c4a0" stroke="#8aa082"/>'
      : '<path d="M-18-34q4-19 18-24q-3 12 11 16q7 6 3 17" fill="#fff3db" stroke="#dbc7aa" stroke-width="1.2"/>' + mark('star', 6, -39, .52);
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-33 13h67L4 112q-4 6-8 0Z" fill="url(#ex-waffle)" stroke="#ba905f" stroke-width="2"/><path d="M-26 39q26 13 52 0L9 88q-9 5-18 0Z" fill="#f3e5c8" stroke="#d0b896" stroke-width="1.2"/><path d="M-21 49q21 9 42 0" stroke="#e0aca5" stroke-width="3" fill="none"/><use href="#sun" transform="translate(0 64) scale(.48)"/><path d="M-42 6q-13-16 0-27q0-18 19-20q13-19 31-10q27-8 30 15q22 4 18 26q12 18-8 27q-11 7-17 0q-7 19-16 3q-10 10-19-1q-12 8-21-1q-15 11-17-12Z" fill="${palette.light}" stroke="${palette.dark}" stroke-width="2"/><path d="M-34-17q4-13 20-10m22 3q14-8 24 1m-35 25q8 7 17 1" fill="none" stroke="${palette.dark}" stroke-width="1.8" opacity=".65"/><path d="M-27-28q7-8 16-6m26-6q11 0 15 9" fill="none" stroke="#fff8ea" stroke-width="3" opacity=".75"/>${topping}</g>`;
}

function shell(x, y, scale = 1, color = '#e8b8ae') {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-26 8q-20-13-6-25q4-19 20-16q13-13 26 0q22-2 20 18q13 14-6 23L5 25H-5Z" fill="${color}" stroke="#bf9e8a" stroke-width="1.5"/><path d="M-5 22-26-15m26 36L-12-27m15 48L13-27M5 22l24-37M-4 22h9" fill="none" stroke="#f7e7ce" stroke-width="2.3"/><path d="M-7 24h15v4H-7" fill="#e7c69e" stroke="#bf9e8a"/></g>`;
}

function palm(x, y, scale = 1, lean = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale * lean} ${scale})"><path d="M-13 7q-12-115 30-198l17 4q-26 107-15 198Z" fill="#c4a077" stroke="#987c5f" stroke-width="2"/><path d="m-15-17 30 6m-32-31 32 5m-31-32 30 6m-22-37 29 8m-21-34 27 10m-15-36 22 9" fill="none" stroke="#a18464" stroke-width="2"/><g fill="url(#ex-leaf)" stroke="#70977c" stroke-width="1.5"><path d="M22-190q-48-91-105-31q51-22 105 31m0 0q-7-101 63-80q-50 23-63 80m0 0q66-95 112-26q-57-16-112 26m0 0q90-33 121 36q-55-33-121-36m0 0q-69-45-112 23q54-22 112-23m0 0q13-38 65-16q-33 4-65 16"/></g><path d="m22-190-70-40m70 40 57-51m-57 51 84-18m-84 18 73 6m-73-6-71 0" fill="none" stroke="#aec39a" stroke-width="2"/><ellipse cx="13" cy="-180" rx="12" ry="14" fill="#b39474" stroke="#91765d"/><ellipse cx="35" cy="-178" rx="11" ry="13" fill="#bc9a76" stroke="#91765d"/></g>`;
}

function shopBackground(panel, content, terrazzo = false) {
  return `<rect width="1160" height="371" fill="url(#ex-room-wall)"/><rect width="1160" height="335" fill="url(#paper)"/><path d="M0 23h1160M0 39h1160" stroke="#e6c6a0" stroke-width="4"/><path d="M0 31h1160" stroke="#fff4dc" stroke-width="9"/><rect y="302" width="1160" height="69" fill="${panel}"/><path d="M0 302h1160M0 313h1160M0 368h1160" stroke="#e7ceb0" stroke-width="4"/>${Array.from({ length: 13 }, (_, i) => `<path d="M${i * 91 + 15} 324h65v33h-65Z" fill="none" stroke="#f8ebd2" stroke-width="1.6" opacity=".45"/>`).join('')}<rect y="371" width="1160" height="144" fill="url(#ex-room-floor)"/><rect y="372" width="1160" height="143" fill="url(#${terrazzo ? 'ex-terrazzo' : 'ex-mall-tiles'})"/><ellipse cx="585" cy="438" rx="380" ry="52" fill="#f7e6ce" opacity=".28"/>${content}<rect width="1160" height="515" fill="url(#paper)"/>`;
}

const boutiqueRoom = mirror(70, 91, 150, 240)
  + '<path d="M53 78q90-41 187 0m-188 1v267m187-267v267" fill="none" stroke="#ba9287" stroke-width="8"/><path d="M49 83q16 99-1 209q37-18 48-51q-26-94 0-157m148-1q-16 99 1 209q-37-18-48-51q26-94 0-157" fill="url(#ex-pink)" stroke="#bd8991" stroke-width="2"/><path d="m53 226 27 3m139 0 24-4" stroke="url(#gold)" stroke-width="6"/>'
  + '<g transform="translate(281 111)"><rect width="176" height="113" rx="11" fill="#edcdb1" stroke="#bd9b7e" stroke-width="3"/><rect x="10" y="10" width="156" height="92" rx="5" fill="#bc9b86"/><path d="M10 55h156" stroke="#edcdb1" stroke-width="7"/><g stroke="#f9e7cb" stroke-width="1.4"><path d="M24 21h32v27H24Z" fill="#d9abb0"/><path d="M61 18h26v30H61Z" fill="#b4cfc6"/><path d="M93 24h30v24H93Z" fill="#dfc695"/><path d="M129 17h21v31h-21Z" fill="#b9abca"/></g><path d="M22 80q16-17 31 0m6 0q15-14 31 0m8 0q15-17 31 0m5 0q12-12 20 0" fill="none" stroke="#dfc09d" stroke-width="17"/><path d="M22 80h32m5 0h31m8 0h31m5 0h20" stroke="#f5e0c6" stroke-width="3"/></g>'
  + chandelier(587, 8)
  + '<path d="M461 260q120-48 239 0m-215-11q-2-19 13-19m177 19q2-19-13-19" fill="none" stroke="#caa17e" stroke-width="2"/>'
  + [487, 532, 576, 621, 666].map((x, i) => mark(i % 2 ? 'leaf' : 'rose', x, 257 - Math.sin(i / 4 * Math.PI) * 25, .7)).join('')
  + '<path d="M873 294V104m238 190V104m-241 0h244" stroke="url(#gold)" stroke-width="7" fill="none"/><path d="M864 295h255" stroke="url(#wood)" stroke-width="6"/>'
  + miniGown(904, 183, '#d2a4ae', '#f7dfc3', .85) + miniGown(981, 183, '#b0d0c9', '#fff3d7', .85) + miniGown(1059, 183, '#a5b89a', '#efdfb6', .85)
  + '<g transform="translate(94 358)"><path d="M-43 11h107v17H-43m9 0-5 39m90-39 7 39" fill="url(#wood)" stroke="#a98469" stroke-width="3"/><path d="M-42 2q53-17 107 0v12H-42Z" fill="#dcb0ac" stroke="#b98b8b"/><path d="M16-39h40v43H16Z" fill="#eed8bb" stroke="#b89b7c"/><path d="M23-39v-9q14-14 25 0v9" fill="none" stroke="#b89b7c" stroke-width="2"/>' + mark('rose', 36, -18, .6) + '</g>'
  + `<g transform="translate(1115 347) scale(.72)"><use href="#plant"/></g>${sprig(819, 340, .7)}`;
await newAsset('rooms/boutique', 1160, 515, shopBackground('#c9989c', boutiqueRoom), gradient('ex-room-wall', ['#f8eadc', '#eac7c0']) + gradient('ex-room-floor', ['#d7b8a0', '#f0d5b7']));

const toyRoom = '<rect x="43" y="66" width="198" height="248" rx="19" fill="url(#wood)" stroke="#a98467" stroke-width="3"/><rect x="56" y="80" width="172" height="220" rx="10" fill="#ac927b"/><path d="M56 153h172m-172 73h172m-172 73h172" stroke="#edc9a1" stroke-width="9"/><path d="M130 80v219" stroke="#dec0a0" stroke-width="5"/>'
  + dragon(95, 127, .33) + royalTrain(180, 133, .27) + bubbleWand(91, 193, .29)
  + '<g transform="translate(182 208)" stroke="#a48d75" stroke-width="1.4"><rect x="-30" y="-28" width="24" height="30" rx="4" fill="#d1a8a8"/><rect x="-3" y="-20" width="27" height="22" rx="3" fill="#abc8b8"/><path d="m-34-28 16-19 16 19m-3 8 14-21 15 21" fill="#dfc08e"/>' + mark('star', 10, -8, .4) + '</g>'
  + '<g transform="translate(92 272)"><ellipse rx="26" ry="23" fill="#e0bf9a" stroke="#b89573" stroke-width="1.5"/><circle cx="-17" cy="-20" r="9" fill="#d3b18a"/><circle cx="17" cy="-20" r="9" fill="#d3b18a"/><circle cx="-8" cy="-6" r="2" fill="#746050"/><circle cx="8" cy="-6" r="2" fill="#746050"/><ellipse cy="2" rx="12" ry="9" fill="#f3e0be"/><path d="M-4 0h8l-4 5Z" fill="#94745b"/><path d="M-6 8q6 5 12 0" fill="none" stroke="#94745b"/></g>'
  + '<g transform="translate(181 269)"><path d="M-27 16 0-40l27 56Z" fill="#bdc6dc" stroke="#8e9db6" stroke-width="2"/><path d="M-15 16h30v15h-30Z" fill="#e0b4a5" stroke="#b58b80"/><circle cy="-4" r="7" fill="#f6e6bb" stroke="#aa9b86"/><path d="m-14 4-13 18h10m31-18 13 18H17" fill="#91b5aa" stroke="#789d91"/></g>'
  + windowArt(473, 85, 184, 199)
  + '<rect x="925" y="72" width="192" height="240" rx="18" fill="url(#wood)" stroke="#a98467" stroke-width="3"/><rect x="938" y="85" width="166" height="212" rx="9" fill="#a48c78"/><path d="M938 157h166m-166 72h166m-166 68h166" stroke="#eacaa4" stroke-width="8"/>'
  + royalTrain(1020, 131, .6) + dragon(1018, 198, .36)
  + '<g transform="translate(1004 273)" fill="#dcb9a7" stroke="#af8b76" stroke-width="1.5"><path d="M-47 12v-39h24v39m-24-39 12-17 12 17m2 39V-9h44v21m-1 0v-40h24v40m-24-40 12-17 12 17"/><path d="M-10 12V-4q10-12 19 0v16" fill="#f5e8c9"/></g>'
  + '<path d="M0 58q580 144 1160 0" fill="none" stroke="#b49b76" stroke-width="2"/>'
  + Array.from({ length: 15 }, (_, i) => `<path d="m${40 + i * 77} ${66 + Math.sin(i / 14 * Math.PI) * 66} 27 7-20 29Z" fill="${['#dbb0aa', '#abc9b8', '#e8ce97', '#c1b1d0'][i % 4]}" stroke="#ae9980" stroke-width="1"/>`).join('')
  + '<g transform="translate(65 357)"><path d="M-29-16h90v59h-90Z" fill="#d8b79b" stroke="#ae8c71" stroke-width="2"/><path d="M-34-16q51-27 101 0v10H-34Z" fill="#edccaa" stroke="#ae8c71" stroke-width="2"/><path d="M-17 4h63m-63 27h63" stroke="#f3deba" stroke-width="2"/><path d="M8-2h17v17H8Z" fill="url(#gold)" stroke="#ba9965"/>' + mark('star', 17, 29, .5) + '</g>'
  + sprig(1120, 379, 1.1)
  + '<g transform="translate(838 311)"><path d="M-26-40q26-24 51 0q8 36-17 41v26m-16-27q-25-11-18-40" fill="#d9a8b5" stroke="#b5879b" stroke-width="1.7"/><path d="M-7 0q10 14 1 31" stroke="#b49475" fill="none"/><path d="M-8-43q-8 7-10 19" stroke="#f5d5d2" stroke-width="3" fill="none"/></g>';
await newAsset('rooms/toyshop', 1160, 515, shopBackground('#98b8ad', `<rect width="1160" height="301" fill="url(#ex-stars)"/>${toyRoom}`), gradient('ex-room-wall', ['#f6ecd8', '#d8e2cc']) + gradient('ex-room-floor', ['#d5b69b', '#f0dbbc']));

const icecreamRoom = '<path d="M252 64h653v25H252Z" fill="#c2d7ca" stroke="#90ac9e" stroke-width="2"/><path d="M241 85h675v21q-23 33-47 0q-24 34-49 0q-24 34-49 0q-24 34-49 0q-24 34-49 0q-24 34-49 0q-24 34-49 0q-24 34-49 0q-24 34-49 0q-24 34-49 0q-24 34-49 0q-24 34-49 0q-24 34-62 0Z" fill="#edc3b6" stroke="#c99b94" stroke-width="1.5"/>'
  + Array.from({ length: 14 }, (_, i) => `<path d="M${248 + i * 48} 65h24v27h-24Z" fill="${i % 2 ? '#f9e6ca' : '#d5aaa8'}" opacity=".8"/>`).join('')
  + '<g transform="translate(581 191)"><circle r="66" fill="url(#gold)" stroke="#c5a276" stroke-width="2"/><circle r="56" fill="#f9ecd3" stroke="#e3ccb0" stroke-width="2"/><path d="M-38 31q38 17 76 0M-38-31q38-17 76 0" stroke="#d0ac94" fill="none" stroke-width="2"/>' + iceCream(0, -6, 'vanilla', .52) + '</g>'
  + '<g transform="translate(51 107)"><path d="M0 197V55q0-55 87-55q87 0 87 55v142Z" fill="#d1b192" stroke="#b29377" stroke-width="2"/><path d="M12 185V58q0-47 75-47q75 0 75 47v127Z" fill="#b99a80"/><path d="M12 87h150M12 151h150" stroke="#f0d5b0" stroke-width="7"/>' + [41, 86, 129].map((x, i) => fairyBottle(x, 83, ['#e9c2b8', '#dfcfac', '#bfafd5'][i], ['petal', 'star', 'moon'][i], .5)).join('') + [41, 86, 129].map((x, i) => `<g transform="translate(${x} 137)"><path d="M-16-28h32v29h-32Z" fill="${['#e6bca6', '#a9c9bb', '#d7bdcf'][i]}" stroke="#b59e84"/><ellipse cy="-27" rx="16" ry="5" fill="#faeacb" stroke="#b59e84"/><path d="M-6-39v13m13-16v16" stroke="#cda775" stroke-width="3"/></g>`).join('') + '</g>'
  + windowArt(929, 78, 157, 192)
  + '<g transform="translate(922 338)"><path d="M-7 20v39m171-39v39" stroke="url(#wood)" stroke-width="8"/><rect x="-20" y="-44" width="195" height="62" rx="28" fill="#b6cdc3" stroke="#86a89a" stroke-width="2"/><rect x="-14" y="6" width="192" height="22" rx="10" fill="#a5bdb0" stroke="#86a89a"/><path d="M29-32v32m42-32v32m43-32v32" stroke="#dce4cb" stroke-width="2"/></g>'
  + '<g transform="translate(797 366)"><path d="M0-1v53m-21 0h43" stroke="url(#gold)" stroke-width="6"/><ellipse rx="39" ry="12" fill="#f6e3c8" stroke="#c1a286" stroke-width="2"/><ellipse cy="-11" rx="15" ry="6" fill="#b7d0c5"/><path d="M-11-31h23v19h-23Z" fill="#b8d2c6" stroke="#8eab9d"/><path d="M-5-39v9m10-15v15" stroke="#ddb996" stroke-width="3"/></g>'
  + lantern(340, 138, .76) + lantern(822, 138, .76)
  + '<g transform="translate(69 365) scale(.64)"><use href="#plant"/></g>';
await newAsset('rooms/icecream', 1160, 515, shopBackground('#8fb8ac', icecreamRoom, true), gradient('ex-room-wall', ['#fff1dc', '#edcec0']) + gradient('ex-room-floor', ['#ddd3b7', '#f1e4c8']));

const playgroundRoom = `<rect width="1160" height="515" fill="url(#sky)"/>${cloud(125, 65, 1.15)}${cloud(569, 47, .85)}${cloud(1010, 85, 1.1)}
  <use href="#sun" transform="translate(421 71) scale(2.8)" opacity=".7"/>
  <path d="M0 249q184-104 381-19q183-114 381-21q211-62 398 29v277H0Z" fill="#b8cba2"/>
  <path d="M0 306q185-78 350-5q195-79 400-33q195-57 410 29v218H0Z" fill="#96b69b"/>
  <path d="M0 369q195-38 376 8q205-23 404-2q193-17 380-2v142H0Z" fill="#b6c79b"/>
  <g stroke="#c4bea0" stroke-width="2" fill="#e8e0bd">${Array.from({ length: 30 }, (_, i) => `<path d="M${i * 40 + 3} 324v-71l10-14 10 14v71Z"/>`).join('')}<path d="M0 276h1160M0 306h1160" stroke="#ded6b4" stroke-width="7"/></g>
  <path d="M0 443q197-86 350-51q101 21 173-23q85-53 172-36q-96 43-85 81q11 42 101 101H0Z" fill="url(#ex-sand)"/>
  <path d="M0 438q195-82 351-44q97 17 170-24" fill="none" stroke="#f4e1b9" stroke-width="5"/>
  <path d="M0 190q185 58 350 16q206-55 347-26q220 23 463-16" fill="none" stroke="#b69f76" stroke-width="2"/>
  ${Array.from({ length: 18 }, (_, i) => `<path d="m${27 + i * 63} ${190 + Math.sin(i / 17 * Math.PI * 2) * 25} 23 3-15 26Z" fill="${['#e3b3ad', '#ebd09c', '#b3cbbb', '#c5b4d6'][i % 4]}" stroke="#bca489" stroke-width=".8"/>`).join('')}
  <g transform="translate(47 371)"><path d="M-32 12q35-45 70-14q31-27 50 7v17H-32Z" fill="#86a78a" stroke="#739272" stroke-width="1.5"/><use href="#flower" x="-4" y="-7"/><use href="#flower" x="37" y="-17"/><use href="#flower" x="69" y="-1"/></g>
  <g transform="translate(1116 365)"><path d="M-77 8q32-49 61-13q27-29 49 11v25H-77Z" fill="#88a78a" stroke="#739272" stroke-width="1.5"/><use href="#flower" x="-51" y="-12"/><use href="#flower" x="-15" y="-21"/><use href="#flower" x="19" y="-4"/></g>
  ${sprig(570, 364, .75)}${sprig(717, 378, .78)}${sprig(1080, 486, .62)}
  <g transform="translate(586 278)"><path d="M-45 47V7q45-40 90 0v40Z" fill="#e5d6b1" stroke="#b8ae89" stroke-width="2"/><path d="M-41 3q41-55 83 0" fill="none" stroke="#94ad86" stroke-width="12"/><path d="M-34 35h68m-52-8v18m18-22v22m17-22v22m17-18v18" stroke="#b7bc99" stroke-width="4"/><use href="#flower" transform="translate(-42 -2) scale(.62)"/><use href="#flower" transform="translate(44 -2) scale(.62)"/></g>
  <g fill="#e5d7b6" stroke="#c8b493" stroke-width="1.1"><ellipse cx="541" cy="409" rx="18" ry="7"/><ellipse cx="575" cy="433" rx="21" ry="8"/><ellipse cx="612" cy="459" rx="22" ry="8"/><ellipse cx="670" cy="491" rx="26" ry="9"/></g>
  <g transform="translate(423 213)" fill="#e1b1bb" stroke="#b98b97" stroke-width="1"><path d="M0 3q-24-26-25-4q-2 13 23 10m4-6q24-26 25-4q2 13-23 10"/><path d="M0 0v15m-1-14-3-6m5 6 3-6" fill="none" stroke="#8f8265"/></g>
  <g transform="translate(1055 164) scale(.75)" fill="#e8cf95" stroke="#ba9f6e" stroke-width="1"><path d="M0 3q-24-26-25-4q-2 13 23 10m4-6q24-26 25-4q2 13-23 10"/><path d="M0 0v15" fill="none" stroke="#8f8265"/></g>
  <path d="m34 477 8-8m9 11 6-12m681 28 6-12m7 11 7-7m312-8 5-9" stroke="#95a982" stroke-width="2"/>
  <rect width="1160" height="515" fill="url(#paper)"/>`;
await newAsset('rooms/playground', 1160, 515, playgroundRoom);

const ingredientShelf = (x, y, width = 214) => `<g transform="translate(${x} ${y}) scale(${width / 214} 1)"><path d="M0 135V18Q0 0 20 0h174q20 0 20 18v117Z" fill="url(#wood)" stroke="#9c7b62" stroke-width="3"/><path d="M12 124V20q0-8 9-8h172q9 0 9 8v104Z" fill="#a38b72"/><path d="M11 70h192M11 126h192" stroke="#edd0a4" stroke-width="8"/>${[35, 81, 127, 175].map((x, i) => fairyBottle(x, 64, ['#e9c998', '#d4bbe5', '#b7d9cf', '#e5b4c5'][i], ['star', 'moon', 'drop', 'petal'][i], .62)).join('')}${[40, 98, 165].map((x, i) => fairyBottle(x, 121, ['#b7ca9b', '#c4b0dd', '#eed3a7'][i], ['leaf', 'crystal', 'star'][i], .62)).join('')}</g>`;
const basementRoom = `<rect width="1160" height="515" fill="url(#ex-stone)"/><rect width="1160" height="366" fill="url(#ex-bricks)"/>
  <path d="M0 12q580 157 1160 0m-1160-5q580 176 1160 0" fill="none" stroke="#b39175" stroke-width="16"/><path d="M0 19q580 154 1160 0" fill="none" stroke="#edcda7" stroke-width="5"/>
  <path d="M0 366h1160" stroke="#927d69" stroke-width="7"/><rect y="370" width="1160" height="145" fill="url(#ex-basement-floor)"/>
  <path d="M0 397h1160M0 440h1160M0 489h1160M136 371l-59 144m230-144-30 144m252-144 7 144m227-144 39 144m194-144 65 144" stroke="#a79079" stroke-width="1.6" fill="none" opacity=".65"/><path d="M8 403h77m114 43h112m607 49h127m-515-49h157" stroke="#ebd4b0" stroke-width="2" opacity=".6"/>
  <g transform="translate(24 173)"><path d="M0 206V61Q0 0 89 0q87 0 87 61v145Z" fill="#bca286" stroke="#947e68" stroke-width="3"/><path d="M14 206V61q0-48 75-48q73 0 73 48v145Z" fill="#8d8072"/><path d="M16 85h70v24H16m0 0h89v23H16m0 0h108v26H16m0 0h126v27H16m0 0h147v22H16" fill="#d4bea0" stroke="#aa937a" stroke-width="1.5"/><path d="M33 83q28 32 110 101" fill="none" stroke="#e6cba2" stroke-width="7"/><path d="M38 84v31m29-5v33m31-7v34m28-7v36" stroke="#b39477" stroke-width="4"/><use href="#sun" transform="translate(90 31) scale(.66)"/></g>
  ${ingredientShelf(234, 105, 230)}${ingredientShelf(720, 105, 260)}
  <g transform="translate(491 113)"><path d="M-9-7h179v147H-9Z" fill="url(#wood)" stroke="#92725d" stroke-width="3"/><rect width="161" height="129" rx="7" fill="#698d83" stroke="#d7bb90" stroke-width="2"/><path d="M12 17q68-11 138 0M12 115q68 10 138 0" fill="none" stroke="#b4c7aa" stroke-width="1.3" opacity=".7"/>${mark('moon', 30, 45, .75)}${mark('star', 74, 45, .65)}${mark('crystal', 118, 45, .65)}<path d="m42 45 13 0-4-4m4 4-4 4m35-4h13l-4-4m4 4-4 4M65 64q13 11 27 0" stroke="#e8dfba" fill="none" stroke-width="1.5"/>${mark('petal', 39, 91, .7)}${mark('drop', 79, 91, .65)}${mark('rose', 126, 91, .65)}<path d="m51 91 11 0-4-4m4 4-4 4m33-4 15 0-4-4m4 4-4 4" stroke="#e8dfba" fill="none" stroke-width="1.5"/></g>
  ${lantern(203, 187, .8)}${lantern(1034, 160, .9)}
  <g transform="translate(582 34)"><path d="M0-30v29" stroke="#b38f65" stroke-width="3"/><ellipse cy="44" rx="45" ry="37" fill="#ebd0a1" fill-opacity=".22"/><path d="M-20 24Q-3-10 19 24L5 52H-6Z" fill="#ddd1ec" stroke="#a78fb7" stroke-width="2"/><path d="M-6 3v49m-13-28 13 4 25-4" fill="none" stroke="#f5e6f3" stroke-width="1.5"/><circle cy="54" r="4" fill="#e9c99a"/></g>
  <g transform="translate(1080 390)">${bookPile(0, 0, 1.05)}<path d="M-26-47q-2-36 14-38q5-31 20-22q15 11 1 42q32-17 36-1q-1 23-32 21" fill="#b8a3d4" stroke="#8f7aa9" stroke-width="1.8"/><path d="m-12-81 9 24m11-42-9 48m38-12-33 14" stroke="#e4d7ee" stroke-width="1.2"/></g>
  <g transform="translate(574 347)"><path d="M-51 12q52-30 105 0v37h-105Z" fill="#c4a184" stroke="#9e7e67" stroke-width="2"/><path d="M-55 9q56-30 113 0v10q-55-25-113 0Z" fill="#dec5a1" stroke="#9e7e67" stroke-width="2"/><path d="M-33 5q10-46 28-29q12-39 29-20q22 1 10 46" fill="#bec9a5" stroke="#91a087" stroke-width="1.5"/><path d="m-12-22 7 28m28-46-13 38" stroke="#e1e3bf" stroke-width="2"/></g>
  <g transform="translate(646 319)"><path d="M-24 12q2-24 24-27q24 2 27 27v10H-24Z" fill="#d4b1c3" stroke="#ae8ea4" stroke-width="1.5"/><circle cy="-7" r="8" fill="#efe3f0"/><path d="M-28 22h59m-31 0v8" stroke="#b79578" stroke-width="3"/><ellipse cy="33" rx="25" ry="5" fill="#cfb59a"/></g>
  <rect width="1160" height="515" fill="url(#paper)"/>`;
await newAsset('rooms/basement', 1160, 515, basementRoom, gradient('ex-basement-floor', ['#c8ad8f', '#deccb0']));

function coast() {
  return `<rect width="1160" height="515" fill="url(#sky)"/>${cloud(189, 66, 1.05)}${cloud(683, 47, .86)}${cloud(1049, 86, .95)}
    <use href="#sun" transform="translate(472 72) scale(2.4)" opacity=".6"/>
    <path d="M0 187q570-7 1160 0v214H0Z" fill="url(#ex-sea)"/><path d="M0 188q570-7 1160 0" fill="none" stroke="#c7e3d6" stroke-width="3"/>
    <path d="M0 226q156-12 324 0t340 0t340 0t156 0M-39 263q180-14 379 0t391 0t429 0M-12 304q148-11 282 0t308 0t327 0t264 0" fill="none" stroke="#e4f2df" stroke-width="3" opacity=".57"/>
    <path d="M0 357q171-15 335 1q169-29 339-1q204-15 486-1v159H0Z" fill="url(#ex-sand)"/>
    <path d="M0 355q171-15 335 1q169-29 339-1q204-15 486-1" stroke="#fff3d8" stroke-width="10" fill="none"/>
    <path d="M0 378q154-23 321-3q187-25 349-2q211-19 490-1" stroke="#d6cfad" stroke-width="2" fill="none" opacity=".55"/>
    <path d="M10 180q20-31 73-29q32-21 67-9q46 5 64 38Z" fill="#a6bba3"/><path d="M72 153V89h24v64m-29-64 16-17 18 17M75 107h18m-18 23h18" fill="#ead9b8" stroke="#b0aa8c" stroke-width="1.3"/><path d="M71 93h26" stroke="#c6a38d" stroke-width="6"/>
    <path d="M726 142q8-10 16 0q8-10 16 0m120-19q7-8 14 0q7-8 14 0m-354 35q5-6 10 0q5-6 10 0" stroke="#8ba5a0" stroke-width="1.5" fill="none"/>
    <path d="M0 434q75-38 146-10M995 435q80-32 165-7" stroke="#e8cfaa" stroke-width="3" fill="none"/>
    <g fill="#bba88b" opacity=".45">${Array.from({ length: 36 }, (_, i) => `<ellipse cx="${(i * 149 + 31) % 1150}" cy="${397 + (i * 31) % 109}" rx="${i % 3 + 1}" ry=".8"/>`).join('')}</g>`;
}

const beachRoom = `${coast()}
  <g transform="translate(622 339)"><path d="M0-107v143" stroke="#b79872" stroke-width="5"/><path d="M-102-100q102-118 204 0Z" fill="#f3ddbc" stroke="#c5a48d" stroke-width="1.7"/><path d="M-68-100Q-55-148 0-159Q-19-142-18-100ZM18-100Q19-142 0-159Q55-148 68-100Z" fill="#d6aaa5" stroke="#c4a18a" stroke-width="1.3"/><path d="M-103-99q16 24 34 0q18 23 35 0q17 23 34 0q18 23 35 0q16 23 34 0q18 24 33 0" fill="none" stroke="#b99283" stroke-width="1.7"/><path d="m-49 23 84-8 9 47-84 10Z" fill="#b3ccbf" stroke="#8aaa9a" stroke-width="1.5"/><path d="m-39 26 77-8m-72 44 76-9" stroke="#f8eac8" stroke-width="5"/><path d="M56-5h33v47H56Z" fill="#ddbea0" stroke="#af9076"/><path d="M62-5v-11q10-13 19 0V-5" fill="none" stroke="#af9076" stroke-width="2"/>${mark('star', 72, 20, .6)}</g>
  ${palm(1086, 399, .68, -1)}${sprig(47, 447, .88, '#a9ba96')}${sprig(1058, 447, .75, '#a9ba96')}
  <g transform="translate(75 384)"><path d="M-21 0q11-26 35-16q20-7 23 14q-16 8-58 2Z" fill="#c4b59a" stroke="#a89c86"/><path d="M-17-3q11-11 29-8" stroke="#e5d5b4" fill="none"/></g>
  ${shell(1114, 477, .52, '#dac1cb')}${shell(555, 420, .3, '#ead9bd')}
  <path d="m718 472 7-6m-2 11 7-6m-18-3 6-5m47 16 7-6m-3 12 7-6" stroke="#c9b18d" stroke-width="2" fill="none"/>
  <rect width="1160" height="515" fill="url(#paper)"/>`;
await newAsset('rooms/beach', 1160, 515, beachRoom);

const beachShadeRoom = `${coast()}
  <path d="M0 407q146-29 297-16q190-15 339 1q-139 17-273 16q-175-11-363 18Z" fill="#b0d2c7" opacity=".7"/>
  <path d="M0 405q149-27 299-16q184-13 337 2" fill="none" stroke="#f9f2d7" stroke-width="5"/>
  ${palm(99, 403, .93)}${sprig(42, 450, 1.05)}${sprig(155, 452, .75)}
  <g transform="translate(980 299)"><path d="M-92 64V-53h166V64" fill="#d6c5a4" stroke="#b39b7b" stroke-width="3"/><path d="m-105-54 95-77 98 77Z" fill="#b6c6a7" stroke="#88a286" stroke-width="2"/><path d="m-84-57 76-63 72 63M-73-44v102m140-102v102" fill="none" stroke="#e7dbc0" stroke-width="4"/><path d="M-72-43q2 55-7 103q30-5 45-29q-23-43-6-74m105 0q-2 55 7 103q-30-5-45-29q23-43 6-74" fill="#e5bdac" stroke="#c99c8c" stroke-width="1.4"/><path d="M-26 42h54v21h-54" fill="#d8b391" stroke="#b49170"/><path d="M-2-19q-21-2-23 22q20 15 42 0q4-24-19-22Z" fill="#c6d9ca" stroke="#90ad9c"/><use href="#sun" transform="translate(-8 -76) scale(.65)"/></g>
  <g transform="translate(662 381)"><path d="M-43-23h86l-7 72h-71Z" fill="#e8d0ab" stroke="#bfa481" stroke-width="2"/><path d="M-44-25q-1-36 44-36q45 0 44 36" fill="none" stroke="#bfa481" stroke-width="4"/><path d="M-38-4h77m-74 16h72m-69 16h66m-52-49-1 65m21-65v67m21-65 1 64" stroke="#c7ae88" stroke-width="1.5" fill="none"/><path d="M-36-24q13-31 35-7q24-21 38 2l-2 13q-21-8-39-1q-23-5-32 1Z" fill="#a8c6bc" stroke="#86aa9a" stroke-width="1.5"/></g>
  ${shell(700, 461, .45)}${shell(520, 372, .28, '#c8b4ce')}
  <rect width="1160" height="515" fill="url(#paper)"/>`;
await newAsset('rooms/beach-shade', 1160, 515, beachShadeRoom);

const slideBack = `<ellipse cx="213" cy="302" rx="178" ry="6" fill="#8d8564" opacity=".14"/>
  <path d="M87 82 70 291m80-209 3 118" fill="none" stroke="#a58265" stroke-width="12"/>
  <path d="M88 88 72 288m76-200 3 106" fill="none" stroke="#e7c49b" stroke-width="3"/>
  <path d="M74 83h89v21H74Z" fill="url(#wood)" stroke="#9d795f" stroke-width="2"/>
  <path d="M78 87h80m-70 8h58" stroke="#f3d7ad" stroke-width="2"/>
  <path d="M84 82V30q35-16 68 0v50" fill="none" stroke="#97b2a0" stroke-width="8"/>
  <path d="M84 32q35-16 68 0" fill="none" stroke="#d7dec0" stroke-width="3"/>
  <path d="M83 59h69m-54-32v51m19-56v54m19-49v51" stroke="#b9ccaf" stroke-width="4"/>
  <path d="M85 29V6" stroke="#c2a274" stroke-width="3"/><path d="M87 7q20-12 43 1l-9 10q-15-10-34-1Z" fill="#dfafb6" stroke="#bb8d99" stroke-width="1.2"/>
  ${mark('rose', 131, 34, .52)}
  <path d="M29 294 87 85m-10 209 59-209" fill="none" stroke="#9d8265" stroke-width="9"/>
  <path d="M31 293 89 87m-12 205 58-205" fill="none" stroke="#d9bda0" stroke-width="2.3"/>
  ${Array.from({ length: 8 }, (_, i) => {
    const y = 281 - i * 25;
    const x = 34 + i * 6.8;
    return `<path d="M${x} ${y}h44" stroke="#ae906d" stroke-width="8"/><path d="M${x + 2} ${y - 2}h40" stroke="#efd6ae" stroke-width="2"/><circle cx="${x + 4}" cy="${y}" r="1.7" fill="#98795e"/><circle cx="${x + 40}" cy="${y}" r="1.7" fill="#98795e"/>`;
  }).join('')}
  <path d="M126 84C165 94 171 168 207 219S302 278 377 276L377 298C305 310 245 289 198 245S155 135 113 103Z" fill="url(#water)" stroke="#84a9a5" stroke-width="2"/>
  <path d="M131 89C167 103 177 172 212 220S305 279 378 279" fill="none" stroke="#b39770" stroke-width="9"/>
  <path d="M131 87C167 101 177 170 212 218S305 277 378 277" fill="none" stroke="#f2d6a5" stroke-width="5"/>
  <path d="M129 101C161 124 177 192 213 236S306 289 368 288" fill="none" stroke="#ecf3d9" stroke-width="3.3" opacity=".8"/>
  <path d="m239 264-10 35m63-15 3 17" stroke="#b29a75" stroke-width="6"/>
  <path d="M132 89q-6-12-20-4" fill="none" stroke="#e2c99d" stroke-width="5"/>
  <circle cx="91" cy="84" r="4" fill="#f5d8a5" stroke="#b99a73"/><circle cx="153" cy="84" r="4" fill="#f5d8a5" stroke="#b99a73"/>
  <g transform="translate(33 296) scale(.48)"><use href="#flower"/></g>`;
await newAsset('props/slide-back', 400, 310, slideBack);
await newAsset('props/slide-front', 400, 310, `<path d="M113 103C153 129 163 201 198 245S305 310 377 298" stroke="#87aaa5" stroke-width="7" fill="none"/><path d="M113 100C153 126 163 198 198 242S305 307 377 295" stroke="#e2d8b6" stroke-width="3.5" fill="none"/><path d="M374 281q12 3 8 18l-13 3" fill="#acd0c0" stroke="#80a59c" stroke-width="2"/><path d="M77 97h78v14H77Z" fill="url(#wood)" stroke="#a17d60" stroke-width="1.5"/><path d="M81 101h70" stroke="#e6c39a" stroke-width="2"/><path d="M78 97V67m77 30V70" stroke="#b3c7ac" stroke-width="6"/><circle cx="81" cy="104" r="2" fill="#9b7a5b"/><circle cx="149" cy="104" r="2" fill="#9b7a5b"/>`);

const treehouseBack = `<ellipse cx="217" cy="352" rx="136" ry="7" fill="#658668" opacity=".16"/>
  <path d="M171 348q42-71 24-181l37-51q-4 145 28 231l-45-7Z" fill="url(#wood)" stroke="#8b6f55" stroke-width="3"/>
  <path d="M170 348q42-71 24-181l37-51q-4 145 28 231l-45-7Z" fill="url(#ex-grain)"/>
  <path d="M218 198q-53-63-90-43m90 52q54-46 91-37" fill="none" stroke="#9b7d5e" stroke-width="16"/>
  <path d="M218 198q-53-63-90-43m90 52q54-46 91-37" fill="none" stroke="#c5a37c" stroke-width="4"/>
  <path d="M202 281q-15-24-1-46q20-4 18 19q-2 25-17 27" fill="none" stroke="#8d7055" stroke-width="2"/>
  <g fill="url(#ex-leaf)" stroke="#7c9e7d" stroke-width="1.6"><path d="M105 121q-62 12-68-31Q-8 67 25 36Q30 0 73 15Q107-9 140 22q33 5 22 40q20 43-57 59Z"/><path d="M296 120q71 5 75-35q35-4 23-37q-9-30-45-21q-32-45-69-14q-32-14-51 21q-36 9-17 46q2 34 84 40Z"/></g>
  <path d="M28 58q34 15 67-3m-53 34q33 1 57-17m192-31q32 23 59 9m-49 38q30 8 55-11" stroke="#c8d5a4" stroke-width="2" fill="none" opacity=".65"/>
  <path d="M115 41h208v130H115Z" fill="#d0b193" stroke="#a58266" stroke-width="2"/>
  <path d="M120 52h198M120 76h198M120 100h198M120 124h198M120 149h198" stroke="#ac8f73" stroke-width="1.2" opacity=".65"/>
  <path d="M122 53h190m-190 47h190m-190 49h190" stroke="#eed3aa" stroke-width="1.2" opacity=".6"/>
  <path d="M155 171V65q0-34 30-34q30 0 30 34v106Z" fill="#6f9381" stroke="#ead0a7" stroke-width="5"/>
  <path d="M165 171V69q0-25 20-25q20 0 20 25v102Z" fill="#a6bcb2"/>
  <path d="M171 137q13-20 29-8v42h-29Z" fill="#e4d8b4"/><path d="M175 134v-23h18v23" fill="#ceafb0" stroke="#aa8c89"/><use href="#flower" transform="translate(184 99) scale(.43)"/>
  <path d="M229 62h74v87h-74Z" fill="#f4e4c4" stroke="#b28e6f" stroke-width="4"/><path d="M237 70h58v72h-58Z" fill="url(#sky)"/><path d="M237 128q27-15 58 0v14h-58Z" fill="#aac29e"/><path d="M266 70v72m-29-38h58" stroke="#dfcba3" stroke-width="4"/>
  <path d="M232 65q0 32-3 65q15-4 23-14q-11-30-4-51m51 0q0 32 3 65q-15-4-23-14q11-30 4-51" fill="#d8a6ae" stroke="#b98d96" stroke-width="1.1"/>
  <path d="M103 43 217 5 335 43l-3 12q-114-25-227 0Z" fill="url(#ex-roof)" stroke="#9e7268" stroke-width="2"/>
  <path d="M104 43 217 5 335 43l-3 12q-114-25-227 0Z" fill="url(#ex-shingles)" opacity=".7"/>
  <path d="M106 44q111-26 226 0" stroke="#efd1af" stroke-width="4" fill="none"/>
  <path d="M219 6V0" stroke="#c7a77c" stroke-width="2.5"/>
  <path d="M106 168h225v13H106Z" fill="url(#wood)" stroke="#9c795c" stroke-width="2"/>
  <path d="M111 170h215" stroke="#f1d4a9" stroke-width="2"/>
  <path d="m136 182 64 65m104-65-70 65" stroke="#ae8a66" stroke-width="8"/>
  <path d="M99 349 142 181m46 168 39-168" fill="none" stroke="#a38b66" stroke-width="8"/>
  <path d="M100 347 143 182m44 165 39-165" fill="none" stroke="#e0c89c" stroke-width="2"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${104 + i * 4.7} ${338 - i * 18}h40" stroke="#bb9d73" stroke-width="7"/><path d="M${105 + i * 4.7} ${336 - i * 18}h38" stroke="#f1d7a8" stroke-width="2"/>`).join('')}
  <path d="M91 152v74" stroke="#b3ad87" stroke-width="2.2"/>
  <g transform="translate(89 247)"><path d="M-20-21q20-16 40 0l-5 26h-31Z" fill="#d9b393" stroke="#af8d6e" stroke-width="1.5"/><path d="M-16-20q0-24 15-24q17 0 17 24" fill="none" stroke="#af8d6e" stroke-width="2"/><path d="M-17-7h34M-11-18v21m11-24V4m11-22V3" stroke="#ecd4aa" stroke-width="1"/><path d="M-11-22h24v-15h-24" fill="#c5b1cf" stroke="#a08ead"/></g>
  <g transform="translate(337 144)"><path d="M-20-14 0-34l23 20v33h-43Z" fill="#e1c39f" stroke="#a88d6e" stroke-width="1.5"/><path d="m-24-13 24-26 27 26" stroke="#b69778" stroke-width="4" fill="none"/><circle cy="-1" r="8" fill="#9aaa91"/><path d="M-12 15h28" stroke="#a88d6e" stroke-width="2"/></g>
  ${sprig(314, 344, .76)}<g transform="translate(180 343) scale(.62)"><use href="#flower"/></g>
  <path d="M67 79q38 17 68-7m184 7q19 12 52 2" stroke="#9eaa86" stroke-width="1.4" fill="none"/>
  ${[76, 100, 123, 324, 347, 367].map((x, i) => mark(i % 2 ? 'star' : 'petal', x, i < 3 ? 83 - i * 3 : 85, .37)).join('')}`;
await newAsset('props/treehouse-back', 400, 360, treehouseBack);
await newAsset('props/treehouse-front', 400, 360, `<path d="M108 174h53m58 0h111" stroke="#9b805e" stroke-width="9"/><path d="M108 170h53m58 0h111" stroke="#efd7ac" stroke-width="3"/><path d="M110 169v-42m49 42v-39m62 39v-39m107 39v-42" stroke="#adc2a1" stroke-width="7"/><path d="M108 127h53m58 0h112" stroke="#88a38e" stroke-width="7"/><path d="M108 125h53m58 0h112" stroke="#d8e1bb" stroke-width="2.5"/>${[126, 143, 238, 256, 274, 292, 310].map(x => `<path d="M${x} 132v35" stroke="#bbccb0" stroke-width="4"/>`).join('')}<g transform="translate(285 153)"><path d="M-37 11h73v17h-73Z" fill="#d7b396" stroke="#b28f74" stroke-width="1.2"/><path d="M-39 10h78v6h-78" fill="#e3c8a5"/><use href="#flower" transform="translate(-21 -5) scale(.48)"/><use href="#flower" transform="translate(0 -13) scale(.52)"/><use href="#flower" transform="translate(23 -5) scale(.45)"/></g><path d="M106 177h225v8H106Z" fill="#af8c68" stroke="#977a5e" stroke-width="1"/><path d="M115 181h208" stroke="#d9b792" stroke-width="1.6"/>`);

const cauldronBook = `<g transform="translate(62 178) rotate(-9)"><path d="M-47-21q24-9 47 0q26-13 54-3v38q-28-8-53 3q-25-8-48-1Z" fill="#eddfb9" stroke="#a38d71" stroke-width="1.5"/><path d="M-44-22q25-12 46 0q26-16 48-5v36q-26-10-48 3q-21-11-46-4Z" fill="#fff1d2" stroke="#c8b08b" stroke-width="1"/><path d="M2-22v35m-38-27 20-3m-22 10 24-2m-23 11 15-1" stroke="#c6b08b" stroke-width="1.2"/><path d="M-25-23v-15" stroke="#cba7b3" stroke-width="4"/>${mark('moon', 19, -9, .48)}${mark('star', 34, 4, .36)}<path d="m14 7 4 1m6-1h4" stroke="#bca784" stroke-width="1.2"/></g>`;
const cauldronBack = `<ellipse cx="180" cy="244" rx="166" ry="5" fill="#846b59" opacity=".16"/>
  <path d="M30 207v35m300-35v35" stroke="#977656" stroke-width="12"/><path d="M31 208v30m299-30v30" stroke="#dbb68d" stroke-width="3"/>
  <path d="M18 193q162-17 324 0v17H18Z" fill="url(#wood)" stroke="#9f7c5d" stroke-width="2"/><path d="M18 195q162-18 324 0" fill="none" stroke="#eed1a6" stroke-width="3"/>
  <path d="M25 204h310v28H25Z" fill="url(#wood)" stroke="#9f7c5d" stroke-width="2"/><path d="M128 207h105v20H128Z" fill="#c3a183" stroke="#9f7c5d" stroke-width="1.3"/><path d="M145 217h16m39 0h16" stroke="url(#gold)" stroke-width="3"/>
  <path d="M33 233h78m135 0h80" stroke="#d6b28d" stroke-width="2"/><path d="M31 241h42m247 0h16" stroke="#846b54" stroke-width="4"/>
  <path d="M116 171q-8 48 30 55q38 13 74-2q26-15 23-52Z" fill="url(#ex-copper)" stroke="#906a5b" stroke-width="2.4"/>
  <path d="M120 174q-29-7-28 13q2 16 31 10m116-23q29-7 27 13q-2 16-28 10" fill="none" stroke="#b48a6a" stroke-width="6"/><path d="M122 174q-24-6-25 12m142-12q24-6 22 12" fill="none" stroke="#edd0a1" stroke-width="2"/>
  <ellipse cx="180" cy="166" rx="65" ry="17" fill="#a78972" stroke="#8d6e5c" stroke-width="2"/>
  <ellipse cx="180" cy="165" rx="57" ry="12" fill="#cbb6e1" stroke="#e8d4bd" stroke-width="2"/>
  <path d="M144 162q34-12 63-1m-41 7q17 3 28-2" fill="none" stroke="#eee1ec" stroke-width="1.8" opacity=".8"/>
  <path d="M149 153 183 173" stroke="#a48b68" stroke-width="5"/><path d="M150 152 183 171" stroke="#ecd8ac" stroke-width="1.7"/>
  <path d="M174 139q-10-14 0-29m26 32q15-18 7-30m-59 32q-9-16 1-21" fill="none" stroke="#e5d9ef" stroke-width="3" opacity=".65"/>
  <circle cx="169" cy="101" r="7" fill="#d9cae7" fill-opacity=".4" stroke="#b9a6d0"/><circle cx="199" cy="81" r="5" fill="#e9daf0" fill-opacity=".5" stroke="#bea9d0"/>
  ${cauldronBook}${fairyBottle(290, 177, '#d0bce3', 'crystal', .84)}${fairyBottle(328, 181, '#bedacb', 'drop', .62)}
  <g transform="translate(50 101)"><path d="M-29 26h62v8h-62Z" fill="#d7b48a" stroke="#aa8a68"/><path d="M-20 25V0q18-28 40 0v25Z" fill="#aabfab" stroke="#7f9e89" stroke-width="1.7"/><path d="M-25-1h50M-12-5q8-15 15 0" fill="none" stroke="#c7d7b8" stroke-width="4"/><path d="M21 3q25-3 23 11q-2 9-18 8" fill="none" stroke="#7f9e89" stroke-width="3"/>${mark('leaf', 1, 15, .55)}</g>
  <path d="M287 93q20-17 40 0v-8q-20-22-40 0Z" fill="#e9c994" stroke="#b99d6f"/><path d="M307 75V54" stroke="#b99d6f" stroke-width="2"/>
  ${mark('star', 307, 44, .58)}
  <path d="M115 239q65-11 130 0" stroke="#d7c596" stroke-width="2" opacity=".6"/><path d="M126 246h108v3H126Z" fill="url(#wood)" stroke="#a48867" stroke-width="1"/><path d="M128 245h104" stroke="#ecd0a7" stroke-width="1.4"/>`;
await newAsset('props/cauldron-back', 360, 250, cauldronBack);
await newAsset('props/cauldron-front', 360, 250, `<path d="M18 200q162 13 324 0v13H18Z" fill="url(#wood)" stroke="#9f7c5d" stroke-width="1.6"/><path d="M25 213h310v21H25Z" fill="url(#wood)" stroke="#9f7c5d" stroke-width="1.5"/><path d="M128 215h105v16H128Z" fill="#c3a183" stroke="#9f7c5d" stroke-width="1.2"/><path d="M145 222h16m39 0h16" stroke="url(#gold)" stroke-width="3"/><path d="M116 174q8 57 64 57q58-1 64-57q-64 23-128 0Z" fill="url(#ex-copper)" stroke="#906a5b" stroke-width="2.4"/><path d="M119 173q59 23 122 0" fill="none" stroke="#ebcda0" stroke-width="5"/><path d="M133 189q4 27 28 31" fill="none" stroke="#f2d3a4" stroke-width="2.5" opacity=".65"/><path d="M151 228v10m58-10v10" stroke="#8e705b" stroke-width="5"/><g transform="translate(181 202)"><ellipse rx="20" ry="17" fill="#cfa878" stroke="#9e7b5d" stroke-width="1.2"/>${mark('star', 0, 0, .7)}</g><path d="M92 193q-1 16 30 9m116 0q26 4 31-13" fill="none" stroke="#b48a6a" stroke-width="5"/><path d="M36 237v9m287-9v9" stroke="#947555" stroke-width="7"/>`);

await newAsset('props/sandcastle', 325, 175, `<ellipse cx="169" cy="154" rx="151" ry="14" fill="#c4ac85" opacity=".2"/><path d="M47 135q14-18 53-19q66-14 166 13l19 28q-118 22-238-3Z" fill="#e5c695" stroke="#c5a875" stroke-width="1.5"/><g stroke="#be9e71" stroke-width="1.7"><path d="M95 138V70h129v68Z" fill="#edcea0"/><path d="M90 68V52h16v9h18v-9h17v9h18v-9h17v9h18v-9h18v9h17v-9h13v16Z" fill="#f6ddb0"/><path d="M65 140V47h53v93m-60-93V27h15v11h14V27h15v11h16V27h8v20Z" fill="#f1d4a3"/><path d="M209 140V49h54v91m-61-91V29h15v11h14V29h15v11h16V29h9v20Z" fill="#f1d4a3"/><path d="M136 72V31h49v41m-53-41 29-26 29 26Z" fill="#f7dfb4"/><path d="M136 139v-29q26-35 50 0v29Z" fill="#c2a67a"/><path d="M147 139v-27q15-22 27 0v27Z" fill="#ddbd8e"/><path d="M81 64h20v28H81m143-26h21v28h-21" fill="#ccb087"/><path d="M82 107h20m119 2h24M98 75h127m-101 23h82M79 123h29m-9-35v20m128-11v15m-96-35v17m50-17v17" fill="none" stroke="#dfba86" stroke-width="1.3"/></g><path d="M161 7V1m75 28V6" stroke="#b09a76" stroke-width="2"/><path d="M163 1q12-5 28 3l-5 9q-11-7-23-3m75-5q13-9 30-2l-6 11q-13-8-24-3" fill="#c8b2cc" stroke="#a891ab" stroke-width="1.1"/><g transform="translate(36 117)"><path d="M-19-16h39l-5 45h-29Z" fill="#a8c8bb" stroke="#86a99a" stroke-width="1.7"/><ellipse cy="-16" rx="20" ry="6" fill="#cbe0c8" stroke="#86a99a"/><path d="M-17-16q-3-25 17-25q20 0 18 25" fill="none" stroke="#93ab91" stroke-width="2"/><use href="#sun" transform="translate(0 6) scale(.45)"/></g><path d="m285 147 10-57m-8-2 19 3m-7-3 6-15-18-3-1 16" stroke="#b99871" stroke-width="4" fill="#e4c395"/>${shell(191, 139, .34, '#ebc5b0')}${shell(99, 151, .29, '#d8c6d5')}<path d="M53 154q83 13 216-3" stroke="#f5deb0" stroke-width="3" fill="none"/><g fill="#bfa57c"><circle cx="57" cy="145" r="1.4"/><circle cx="121" cy="160" r="1.4"/><circle cx="255" cy="151" r="1.2"/><circle cx="208" cy="147" r="1.2"/></g>`);

await newAsset('props/shells', 295, 165, `<ellipse cx="151" cy="148" rx="139" ry="12" fill="#b29d7d" opacity=".16"/><path d="M20 96 210 72l61 69-199 17Z" fill="#c5d6c1" stroke="#9cb397" stroke-width="1.6"/><path d="m31 108 188-23m-168 42 187-23m-166 40 186-23m-207-18 47 42m-10-50 49 44m-11-49 52 43m-12-51 53 44m-15-48 45 39" fill="none" stroke="#edf0d1" stroke-width="1.4"/><g transform="translate(200 52)"><path d="M-49 30q49-17 97 0L37 73q-36 15-73 0Z" fill="#dec096" stroke="#b39570" stroke-width="2"/><path d="M-49 30q-1-42 47-44q49 1 50 44" fill="none" stroke="#bda077" stroke-width="5"/><path d="M-43 40q44-11 85 0m-81 12q40-9 77 0m-72 12q35-6 67 0m-67-31 7 42m11-47 3 48m13-47v49m14-48-3 48m15-46-8 43" fill="none" stroke="#f2d9b0" stroke-width="1.5"/><ellipse cy="29" rx="49" ry="12" fill="#b69e7b" stroke="#d7b992" stroke-width="3"/>${shell(-17, 22, .55, '#d2bcd4')}${shell(14, 25, .55, '#edc2b5')}<path d="M24 29q-8-20 3-26q17 8 10 24" fill="#ebd7b1" stroke="#c2a481" stroke-width="1.2"/></g>${shell(64, 95, .74, '#e6b6ae')}${shell(129, 111, .59, '#c8b5cf')}${shell(98, 137, .43, '#eee1c0')}<g transform="translate(209 126)"><path d="m0-17 5 12 15 1-11 9 2 15-12-9-13 6 5-14-9-11 14 2Z" fill="#e0b8a0" stroke="#bd9784" stroke-width="1.4"/><path d="M0-12 0 13m-12-9 20 4m-7-10 12 0" stroke="#f1d6b8" stroke-width="1" fill="none"/></g><path d="m15 133 31-29" stroke="#aa9678" stroke-width="6"/><circle cx="52" cy="97" r="18" fill="#d8ebe0" fill-opacity=".4" stroke="#b7a183" stroke-width="4"/><path d="M43 89q4-5 10-5" stroke="#fff8dd" stroke-width="2" fill="none"/><path d="m243 150 21-16m-18 15 5 3m-101-7 4 3" stroke="#b8a382" stroke-width="1.5"/>`);

await newAsset('props/splash-back', 410, 250, `<ellipse cx="205" cy="216" rx="198" ry="30" fill="#d4c7a1" opacity=".28"/><path d="M9 211q40-33 104-19q43-25 91-10q50-12 92 6q74-13 106 23q-43 31-198 31q-148 0-195-31Z" fill="#a7d0c6" fill-opacity=".8" stroke="#8fb9b2" stroke-width="1.7"/><path d="M24 208q56-18 112-7m123-2q76-12 124 11" stroke="#dff0db" stroke-width="4" fill="none"/><path d="M27 200q11-33 29-26q22-21 46 7" fill="#d0c4a1" stroke="#aea586" stroke-width="1.5"/><path d="M311 193q26-34 43-16q27-12 39 23" fill="#c7bea0" stroke="#aea586" stroke-width="1.5"/><path d="M58 174q-14-45-7-66q24 24 12 65m285 3q-12-51 9-70q10 43-9 70" fill="#aac1a0" stroke="#859f85" stroke-width="1.4"/><path d="M122 188q-14-19-4-27q12 5 4 27m175 2q-4-25 9-32q11 13-9 32" fill="#bbded5" fill-opacity=".75" stroke="#89b8b1" stroke-width="1.2"/><circle cx="110" cy="145" r="5" fill="#d5eee4" fill-opacity=".5" stroke="#9cc4bc"/><circle cx="312" cy="145" r="4" fill="#d5eee4" fill-opacity=".5" stroke="#9cc4bc"/>${shell(375, 212, .27, '#e5c7bc')}`);
await newAsset('props/splash-front', 410, 250, `<path d="M17 217q45 22 106 16q49 19 103 2q80 13 164-18q-27 29-184 29q-152 0-189-29Z" fill="#b2d7cb" fill-opacity=".72"/><path d="M18 216q45 22 106 16q49 19 102 2q79 13 164-18" fill="none" stroke="#fff4d9" stroke-width="5"/><path d="M101 219q24-5 44 1m105 1q17-5 31 0m-132 17q31 5 66-1" fill="none" stroke="#edf3dc" stroke-width="2.5"/><path d="M94 224q-10-22-3-29q10 8 3 29m218-1q-4-24 8-29q5 13-8 29" fill="#c9e7dc" fill-opacity=".8" stroke="#97c4b9" stroke-width="1.2"/><circle cx="83" cy="185" r="3.5" fill="#d8eee1" stroke="#a1c9bd"/><circle cx="328" cy="186" r="3" fill="#d8eee1" stroke="#a1c9bd"/>`);

await newAsset('props/hammock', 360, 290, `<ellipse cx="181" cy="279" rx="166" ry="7" fill="#97896c" opacity=".14"/><path d="M40 275 63 69m256 206L298 69" stroke="#aa926b" stroke-width="13"/><path d="M40 272 63 70m256 202L298 70" stroke="#e6d5aa" stroke-width="4"/><path d="M23 278h41m232 0h42m-289-1h262" stroke="#aa926b" stroke-width="10"/><path d="M27 274h34m239 0h34m-284-1h258" stroke="#ead8ae" stroke-width="3"/><path d="m46 218 29 56m239-56-30 56" stroke="#b8a079" stroke-width="7"/><path d="M64 79 95 152m-31-67 40 86m193-91-28 72m28-66-38 87" stroke="#c4b590" stroke-width="3" fill="none"/><path d="M88 142Q180 266 274 142L263 169Q179 292 99 169Z" fill="#b4ccbb" stroke="#82a691" stroke-width="2"/><path d="M88 142Q180 266 274 142" fill="none" stroke="#f5e5ba" stroke-width="6"/><path d="M99 168Q179 289 263 168" fill="none" stroke="#789c86" stroke-width="3"/><path d="M88 142Q180 266 274 142L263 169Q179 292 99 169Z" fill="url(#ex-weave)"/><path d="M105 162q74 112 151 0m-133 24q54 75 108 0" stroke="#e9deb6" stroke-width="7" fill="none"/><path d="m126 210-3 12m17 0-1 11m16-2 1 11m15-8 2 12m16-10 2 12m17-14 3 11m13-17 5 11m12-19 4 10" stroke="#d6c497" stroke-width="2.5"/><g transform="translate(124 176) rotate(25)"><rect x="-28" y="-17" width="57" height="35" rx="10" fill="#e4b4b6" stroke="#b7898e" stroke-width="1.5"/><path d="M-24-13q25 10 49 0m-49 26q24-10 49 0" fill="none" stroke="#f4d7c4" stroke-width="1.5"/><circle r="2" fill="#bd8996"/></g><path d="M63 64V35m235 29V35" stroke="#a6a980" stroke-width="3"/><g transform="translate(63 31)">${mark('leaf', 0, 0, 1.4)}${mark('leaf', 12, 12, .9)}</g><g transform="translate(298 31)">${mark('leaf', 0, 0, 1.4)}${mark('leaf', -13, 13, .9)}</g><circle cx="63" cy="77" r="5" fill="#f5dfa9" stroke="#af9668"/><circle cx="298" cy="77" r="5" fill="#f5dfa9" stroke="#af9668"/><g transform="translate(26 244) scale(.55)"><use href="#flower"/></g>`);

const outfitPalettes = {
  'rose-gala': { colors: ['#f2c2b9', '#bb748b'], edge: '#b27b87', trim: '#fae7c6', light: '#f6d9d1' },
  seaside: { colors: ['#c8e7df', '#78a6be'], edge: '#739ea9', trim: '#fff1d6', light: '#d8eee5' },
  'forest-cape': { colors: ['#dce3b7', '#91af89'], edge: '#72967c', trim: '#eadeb6', light: '#e4e9cd' },
};

function outfitDress(p, outfit, seated = false) {
  const palette = outfitPalettes[outfit];
  const base = seated
    ? 'M93 158q27-12 53 0l15 29q47 26 48 66q-86 22-175 0q-1-41 52-66Z'
    : 'M93 158q27-12 53 0l15 29q27 36 47 119q-86 35-172 0q21-84 50-119Z';
  const hem = seated ? 248 : 304;
  const main = `<path d="${base}" fill="url(#dress)" stroke="${palette.edge}" stroke-width="2"/>`;
  if (outfit === 'rose-gala') {
    const petals = seated
      ? '<path d="M119 190q-54 9-74 57q39 2 69-22q7-15 5-35m3 0q55 9 76 57q-41 4-69-22q-8-15-7-35" fill="#f9ddd0" stroke="#d3a19c" stroke-width="1.3"/><path d="M119 193q-24 25-34 58q34 11 72-1q-14-38-35-57" fill="#eab1b2" stroke="#ce929f" stroke-width="1.1"/>'
      : '<path d="M119 190Q73 208 48 296q37-5 65-33q13-41 6-73m3 0q52 21 72 106q-33-2-61-33q-16-40-11-73" fill="#f9ddd0" stroke="#d3a19c" stroke-width="1.3"/><path d="M120 194q-31 52-33 113q33 13 72-1q-10-65-36-111" fill="#eab1b2" stroke="#ce929f" stroke-width="1.2"/><path d="M119 209q-9 48-4 86m14-72 13 68" stroke="#f7d3c8" stroke-width="2" fill="none"/>';
    const roses = seated ? [[64, 239, .56], [121, 248, .65], [180, 239, .56]] : [[71, 278, .68], [121, 300, .75], [175, 278, .68]];
    return `${main}${petals}<path d="M94 158q15 20 28 11q10-12 25-11l7 24q-31 12-65 0Z" fill="#d9959f" stroke="#bd8190" stroke-width="1.2"/><path d="M104 167q6 6 11 6m22-7-8 5" stroke="#f6d5c3" stroke-width="2" fill="none"/><path d="M88 183q34 12 66 0" fill="none" stroke="url(#gold)" stroke-width="6"/><path d="M93 185q13 30 30 34q17-7 25-33" stroke="#efd8ab" stroke-width="1.3" fill="none" stroke-dasharray="2 5"/>${mark('rose', 122, 186, .52)}${roses.map(([x, y, s]) => mark('rose', x, y, s)).join('')}<path d="M45 ${hem}q76 26 154 0" fill="none" stroke="#f7e3c3" stroke-width="3"/><path d="M50 ${hem - 3}q71 24 144 0" fill="none" stroke="#c79692" stroke-width="1" stroke-dasharray="2 5"/><ellipse cx="121" cy="176" rx="2.4" ry="3" fill="${p.accent}" stroke="#ffe8bb" stroke-width=".8"/>`;
  }
  if (outfit === 'seaside') {
    const pleats = seated
      ? '<path d="M102 195q-19 22-23 51m61-51q15 21 20 50m-44-49-4 54m17-54 7 54" stroke="#6d9caa" opacity=".42" stroke-width="1.5" fill="none"/><path d="M50 241q16 10 30 2q14 11 28 3q15 10 29 0q14 8 28-3q17 8 33-2" fill="none" stroke="#f8ead0" stroke-width="3"/>'
      : '<path d="M100 199q-26 56-34 105m75-105q22 57 34 104m-56-104-10 112m21-112 11 112" stroke="#6d9caa" stroke-width="1.6" opacity=".45" fill="none"/><path d="M46 296q18 12 31 5q15 11 30 3q15 10 29 0q15 8 29-3q17 6 34-5" fill="none" stroke="#fff0d2" stroke-width="4"/><path d="M49 285q19 12 33 5q15 10 29 3q15 8 28-1q15 7 27-3q15 5 27-4" fill="none" stroke="#d8eee0" stroke-width="2"/>';
    return `${main}<path d="M93 158q26 15 53 0l8 19-16 4-16-18-16 18-17-5Z" fill="#fff0d6" stroke="#96b4b0" stroke-width="1.3"/><path d="m97 164 10 9 14-12 16 12 10-9" stroke="#79a6b6" stroke-width="2" fill="none"/><path d="M87 185q32 10 68 0" stroke="#f6e8c4" stroke-width="7" fill="none"/><path d="M92 190q29 9 56 0" stroke="#89b9b1" stroke-width="2" fill="none"/><path d="M120 173v11" stroke="#8eb5b1" stroke-width="1.3"/><circle cx="120" cy="176" r="1.7" fill="#fff8df" stroke="#a5b7a3" stroke-width=".6"/><circle cx="120" cy="181" r="1.7" fill="#fff8df" stroke="#a5b7a3" stroke-width=".6"/>${pleats}${shell(123, 191, .24, '#e6cca5')}<path d="M124 200q-14 18-14 32m15-32 14 27" stroke="#f6e8c4" stroke-width="3" fill="none"/><path d="m70 ${hem - 12} 4 2m86 0 4-2" stroke="${p.accent}" stroke-width="3"/>`;
  }
  const cloak = seated
    ? '<path d="M90 157q-23 12-36 46l-13 41q27 14 65 4l14-58Z" fill="url(#ex-moss)" stroke="#607f6f" stroke-width="1.8"/><path d="M147 157q25 12 38 46l15 41q-26 14-63 4l-17-58Z" fill="url(#ex-moss)" stroke="#607f6f" stroke-width="1.8"/><path d="M65 197q-7 25-17 44m133-44 12 44" stroke="#bfd1af" stroke-width="1.5" fill="none"/>'
    : '<path d="M90 157q-24 13-36 54l-17 82q26 18 67 8l16-110Z" fill="url(#ex-moss)" stroke="#607f6f" stroke-width="1.8"/><path d="M147 157q25 13 37 54l23 82q-27 18-68 8l-19-110Z" fill="url(#ex-moss)" stroke="#607f6f" stroke-width="1.8"/><path d="M71 194q-10 50-25 95m126-95q17 43 25 95" stroke="#bdd0ad" stroke-width="1.6" fill="none"/><path d="M48 290q21 11 50 6m46 0q28 5 49-6" stroke="#d4d6ad" stroke-width="1.2" fill="none" stroke-dasharray="2 4"/>';
  const leaves = seated ? [[67, 226, .5], [84, 240, .43], [176, 226, .5], [159, 240, .43]] : [[63, 265, .59], [83, 283, .49], [180, 265, .59], [161, 283, .49]];
  return `${main}<path d="M103 191q17 16 37 0l14 ${seated ? 57 : 114}q-31 14-60 0Z" fill="#dce4b9" stroke="#b3c39c" stroke-width="1.2"/><path d="m121 202-6 ${seated ? 41 : 101}m12-${seated ? 41 : 101} 6 ${seated ? 41 : 101}" fill="none" stroke="#faf0ce" stroke-width="2"/>${cloak}<path d="M92 156q14 17 29 17q15 0 28-17l8 23q-20 9-36-2q-16 11-35 1Z" fill="#c4d5ad" stroke="#819e7d" stroke-width="1.3"/><path d="M107 180q14 9 28 0" stroke="url(#gold)" stroke-width="3" fill="none"/>${mark('leaf', 123, 183, .61)}<path d="M115 198h13l-12 10 13 11-13 10" stroke="#a8b68d" stroke-width="1.1" fill="none"/>${leaves.map(([x, y, s]) => mark('leaf', x, y, s)).join('')}<path d="M47 ${hem + 1}q74 22 148 0" fill="none" stroke="#efe3ba" stroke-width="3"/><circle cx="122" cy="181" r="2" fill="${p.accent}" stroke="#eed9aa" stroke-width=".7"/>`;
}

function outfitArm(outfit, side, hand = true) {
  const left = side === 'left';
  const palette = outfitPalettes[outfit];
  const sleeve = left ? 'M86 159q-24-2-34 25l15 14q20-10 28-24' : 'M151 161q24-2 35 24l-15 14q-20-10-27-25';
  const fabric = outfit === 'forest-cape' ? 'url(#ex-moss)' : 'url(#dress)';
  const cuff = left ? 'M54 183q5 11 15 13' : 'M185 185q-5 10-14 12';
  let drawing = `<path d="${sleeve}" fill="${fabric}" stroke="${palette.edge}" stroke-width="2"/><path d="${cuff}" stroke="${palette.trim}" stroke-width="${outfit === 'seaside' ? 5 : 3.2}" fill="none"/>`;
  if (outfit === 'rose-gala') drawing += mark('rose', left ? 70 : 168, 176, .35) + `<path d="${left ? 'M77 161q-8 7-8 17' : 'M159 162q9 6 8 16'}" fill="none" stroke="#f8dfc5" stroke-width="1.4"/>`;
  if (outfit === 'seaside') drawing += `<path d="${left ? 'M81 162q-8 3-11 13m-1 12-8-5' : 'M156 163q9 4 12 13m3 12 8-4'}" fill="none" stroke="#e7f0d9" stroke-width="1.4"/>`;
  if (outfit === 'forest-cape') drawing += mark('leaf', left ? 70 : 169, 176, .36);
  if (hand) drawing += left
    ? '<path d="M56 189q-18 9-17 34q4 13 13 5l10-29" fill="url(#skin)" stroke="#b88976" stroke-width="2"/><path d="m44 222 3 3m2-7 3 4" stroke="#b88976" stroke-width="1"/>'
    : '<path d="M182 190q18 9 17 34q-4 13-13 5l-10-29" fill="url(#skin)" stroke="#b88976" stroke-width="2"/><path d="m194 222-3 3m-2-7-3 4" stroke="#b88976" stroke-width="1"/>';
  return drawing;
}

const outfitDefinitions = (p, outfit) => gradient('dress', outfitPalettes[outfit].colors) + gradient('hair', p.hair) + gradient('skin', p.skin, true);
for (const p of princesses) {
  for (const outfit of Object.keys(outfitPalettes)) {
    const defs = outfitDefinitions(p, outfit);
    await newAsset(`characters/${p.id}-${outfit}-dress`, 240, 340, outfitDress(p, outfit), defs);
    await newAsset(`characters/${p.id}-${outfit}-seated`, 240, 340, outfitDress(p, outfit, true), defs);
    await newAsset(`characters/${p.id}-${outfit}-left-arm`, 240, 340, outfitArm(outfit, 'left'), defs);
    await newAsset(`characters/${p.id}-${outfit}-right-arm`, 240, 340, outfitArm(outfit, 'right'), defs);
    await newAsset(`characters/${p.id}-${outfit}-portrait`, 240, 240, `<circle cx="120" cy="120" r="113" fill="${outfitPalettes[outfit].light}" opacity=".7"/><g transform="translate(0 23)">${hairBack(p)}${outfitDress(p, outfit)}${outfitArm(outfit, 'left')}${outfitArm(outfit, 'right')}${head(p)}</g>`, defs);
  }
}

const displayPrincess = princesses[0];
for (const outfit of Object.keys(outfitPalettes)) {
  await newAsset(`items/${outfit}`, 280, 240, `<ellipse cx="140" cy="224" rx="77" ry="8" fill="#9a7b65" opacity=".12"/><path d="M140 26v192m-40 9h80m-58-7v6m37-6v6" stroke="#b99673" stroke-width="4" fill="none"/><path d="M130 27q-5-11 8-16q16 0 14 16" fill="none" stroke="#b99673" stroke-width="2.2"/><path d="m101 48 39-23 40 23" fill="none" stroke="#d9b890" stroke-width="4"/><g transform="translate(14 -131) scale(1.05)">${outfitDress(displayPrincess, outfit)}${outfitArm(outfit, 'left', false)}${outfitArm(outfit, 'right', false)}</g>`, outfitDefinitions(displayPrincess, outfit));
}
await newAsset('items/plush-dragon', 280, 240, dragon(157, 124, 1.18));
await newAsset('items/royal-train', 280, 240, royalTrain(140, 146, 1.02));
await newAsset('items/bubble-wand', 280, 240, bubbleWand(135, 123, 1.02));
for (const flavor of Object.keys(flavors)) await newAsset(`items/${flavor}`, 280, 240, iceCream(140, 98, flavor, 1.1));

function mannequin(outfit, x, y, scale = .83) {
  const gown = (outfitDress(displayPrincess, outfit) + outfitArm(outfit, 'left', false) + outfitArm(outfit, 'right', false)).replaceAll('url(#dress)', `url(#ex-display-${outfit})`);
  return `<g><path d="M${x} ${y - 11}v158m-29 0h58" stroke="#c4a47c" stroke-width="4"/><path d="M${x - 11} ${y + 1}q-4-20 11-23q15 3 11 23" fill="#f2e4c4" stroke="#cbb895" stroke-width="1.2"/><ellipse cx="${x}" cy="${y + 150}" rx="31" ry="6" fill="#dab992" stroke="#b89570" stroke-width="1.3"/><g transform="translate(${x - 120 * scale} ${y - 158 * scale}) scale(${scale})">${gown}</g></g>`;
}

await newAsset('props/shop-boutique', 610, 330, `<ellipse cx="305" cy="321" rx="284" ry="6" fill="#8d715f" opacity=".13"/>
  ${mirror(24, 19, 137, 219)}
  <path d="M162 32q139-30 299 0" fill="none" stroke="#d0b083" stroke-width="2"/>
  ${[180, 215, 249, 285, 319, 354, 389, 425, 458].map((x, i) => mark(i % 2 ? 'leaf' : 'rose', x, 31 - Math.sin(i / 8 * Math.PI) * 14, .48)).join('')}
  ${mannequin('rose-gala', 233, 81)}${mannequin('forest-cape', 409, 81)}
  <path d="M505 44v193m84-193v193M500 44h94" stroke="url(#gold)" stroke-width="6" fill="none"/><path d="M499 239h97" stroke="url(#wood)" stroke-width="5"/>
  ${miniGown(547, 146, '#a9d0d0', '#f6ebce', .83)}
  <g transform="translate(19 245)"><path d="M0 0h60v60H0Z" fill="#edcdae" stroke="#bf9f7c" stroke-width="2"/><path d="M8 0v-14q20-24 42 0V0" stroke="#bf9f7c" stroke-width="2.5" fill="none"/>${mark('rose', 30, 31, 1)}<path d="M4 48h52" stroke="#e5b1af" stroke-width="3"/></g>
  <path d="M100 244q204-22 411 0v13H100Z" fill="url(#ex-cream)" stroke="#c4a78b" stroke-width="2"/>
  <path d="M110 257h389v54H110Z" fill="url(#wood)" stroke="#a98569" stroke-width="2"/><path d="M121 267h123v33H121m135-33h123v33H256m135-33h97v33h-97" fill="#cda392" stroke="#f1d4b1" stroke-width="1.2"/>
  <path d="M102 245q47 10 94 2l-3 47q-22 10-47 0q-19 5-37-2Z" fill="#edd4c0" stroke="#c8a891" stroke-width="1.2"/><path d="M102 245q47 10 94 2l-3 47q-22 10-47 0q-19 5-37-2Z" fill="url(#ex-weave)"/><path d="m114 256 4 34m29-31 3 38m32-40 1 37" stroke="#d5b394" stroke-width="1.1"/>
  <g transform="translate(478 230)"><path d="M-34-24h57v26h-57Z" fill="#9bbbab" stroke="#7c9b8b" stroke-width="1.5"/><rect x="-27" y="-43" width="35" height="25" rx="4" fill="#aec6b8" stroke="#7c9b8b" stroke-width="1.5"/><path d="M-21-36H2v10h-23" fill="#f3e6c8" stroke="#a8b59a"/><path d="M-20-12H11m-28 5h24" stroke="#e2e5c1" stroke-width="2"/><path d="M-3 2h16v4H-3" fill="#cfb790"/></g>
  <g transform="translate(275 238)"><path d="M-20-20h46v20h-46Z" fill="#e2b0b6" stroke="#b88e96" stroke-width="1.3"/><path d="M1-20v20m-21-9h46" stroke="#f2d8b4" stroke-width="4"/><path d="M1-20q-19-18-19-3q-1 8 19 3q21-20 21-4q0 9-21 4" fill="none" stroke="#e6c497" stroke-width="2"/></g>
  <path d="m125 311-5 13m371-13 5 13" stroke="#a58266" stroke-width="7"/>
  ${mark('rose', 318, 284, .95)}`, Object.entries(outfitPalettes).map(([id, p]) => gradient(`ex-display-${id}`, p.colors)).join(''));

await newAsset('props/shop-toys', 610, 320, `<ellipse cx="306" cy="312" rx="287" ry="6" fill="#927764" opacity=".14"/>
  <path d="M24 226V41q0-26 28-26h507q27 0 27 26v185Z" fill="url(#wood)" stroke="#a18066" stroke-width="3"/><path d="M39 214V45q0-15 17-15h497q16 0 16 15v169Z" fill="#a48d76"/><path d="M39 111h530M39 209h530" stroke="#efd0a4" stroke-width="10"/><path d="M191 31v178m210-178v178" stroke="#d7b795" stroke-width="7"/><path d="M27 30q278-49 557 0" fill="none" stroke="#e5cba2" stroke-width="4"/>
  ${dragon(112, 73, .43)}${royalTrain(303, 82, .65)}${bubbleWand(493, 75, .34)}
  <g transform="translate(89 172)" stroke="#aa8d78" stroke-width="1.5"><path d="M-29 28V-9h25v37m-29-37 17-24 18 24m-7 37V7h35v21m-5 0v-45h25v45m-25-45 12-18 13 18" fill="#d9b6ac"/><path d="M-9 28V14q8-9 17 0v14" fill="#f6e5c4"/><path d="M-15-3h8v13h-8m39-19h9v14h-9" fill="#b5c8c6"/></g>
  <g transform="translate(162 174)"><ellipse cy="12" rx="19" ry="20" fill="#dfc89d" stroke="#b29b73" stroke-width="1.5"/><path d="M-18 2q-28-6-16-23q14-2 23 16M13-5q4-23 19-20q11 20-16 29" fill="#c8b1d0" stroke="#a28bb0" stroke-width="1.4"/><path d="M-6 5q7-7 13 0q-5 12-13 0" fill="#a39bb5"/><circle cx="-6" cy="-1" r="2" fill="#786a57"/><circle cx="6" cy="-1" r="2" fill="#786a57"/></g>
  ${dragon(291, 162, .49)}
  <g transform="translate(384 171)"><path d="M-19-13q-5-38 15-48q25 18 15 48Z" fill="#bfd1c6" stroke="#89a398" stroke-width="1.6"/><path d="m-19-14-13 22 17-6m24-16 12 22-15-5" fill="#d9b2b0" stroke="#b6898b" stroke-width="1.5"/><circle cx="-3" cy="-31" r="8" fill="#fff0c8" stroke="#c5a98a" stroke-width="1.5"/><path d="M-15-10h20v12h-20m-18 11 40 0" stroke="#d3ba95" stroke-width="2.5"/><path d="m-9 4-4 16m15-16 4 16" stroke="#f0d295" stroke-width="3"/></g>
  <g transform="translate(458 178)"><ellipse rx="23" ry="24" fill="#d9adb6" stroke="#b78998" stroke-width="1.5"/><path d="M-18-15q24-4 33 23M-17 14q23-23 39-7" stroke="#f7dbc5" stroke-width="3" fill="none"/>${mark('star', -1, -1, .58)}</g>
  <g transform="translate(525 174)"><path d="M-22-8q22-19 44 0v23h-44Z" fill="#a5c0ae" stroke="#849f89" stroke-width="1.4"/><ellipse cy="-8" rx="22" ry="8" fill="#c5d7b7" stroke="#849f89"/><path d="m-12-19 17-17m0 16 12-14" stroke="#ba9874" stroke-width="3"/><circle cx="-14" cy="19" r="7" fill="#c9aa7f" stroke="#a48862"/><circle cx="14" cy="19" r="7" fill="#c9aa7f" stroke="#a48862"/></g>
  <path d="M64 238q239-30 484 0v22H64Z" fill="url(#ex-cream)" stroke="#c5ab8b" stroke-width="2"/><rect x="72" y="257" width="468" height="49" rx="8" fill="#abc5b5" stroke="#809c89" stroke-width="2"/><path d="M91 270h111v24H91m126-24h174v24H217m190-24h111v24H407" fill="#c2d4bc" stroke="#e6dfba" stroke-width="1.4"/>
  ${royalTrain(299, 225, .87)}${mark('star', 146, 282, .82)}${mark('petal', 467, 282, .83)}
  <path d="m88 308-4 8m440-8 4 8" stroke="#9d7f62" stroke-width="7"/>
  <g transform="translate(36 242)"><path d="M-23-6h44v49h-44Z" fill="#e4c099" stroke="#b49874"/><path d="M-23-6 0-22 21-6" fill="#edd6ae" stroke="#b49874"/><path d="M0-21v64m-23-24h44" stroke="#c19d7b" stroke-width="3"/>${mark('rose', 0, 12, .65)}</g>
  <g transform="translate(577 273)"><circle cy="-5" r="21" fill="#c6b0d0" stroke="#9b88ab" stroke-width="1.5"/><path d="M-15-17q17-9 28 4" stroke="#ead8e6" stroke-width="3" fill="none"/><path d="M-6 13q14 19-5 34" stroke="#b0a185" stroke-width="1.8" fill="none"/></g>`);

const scoopBowl = (x, y, flavor, scale = 1) => {
  const palette = flavors[flavor];
  return `<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="9" rx="36" ry="8" fill="#d8b89a" opacity=".35"/><path d="M-34-6h69L25 17q-25 9-50 0Z" fill="#efe8cb" stroke="#b9b49b" stroke-width="1.5"/><path d="M-27-9q-2-23 20-21q15-21 30-6q22 3 14 28Z" fill="${palette.light}" stroke="${palette.dark}" stroke-width="1.5"/><path d="M-18-15q8-11 18-8m5-2q10-7 16 0" stroke="#fff7e5" stroke-width="2" fill="none"/><path d="M-26 4h54" stroke="#b3c6b0" stroke-width="2"/></g>`;
};
await newAsset('props/shop-icecream', 610, 310, `<ellipse cx="307" cy="301" rx="287" ry="6" fill="#927a65" opacity=".14"/>
  <g transform="translate(47 124)"><path d="M-21 103h43V-18h-43Z" fill="#dfc0a0" stroke="#b69779" stroke-width="1.5"/><path d="M-29-15q30-21 59 0v12h-59Z" fill="#f2dfbd" stroke="#b69779"/>${iceCream(0, -57, 'strawberry', .52)}<path d="M-14 35h29m-29 22h29m-29 22h29" stroke="#f5e0b9" stroke-width="2"/>${mark('rose', 0, 101, .78)}</g>
  <path d="M105 78q202-31 401 0" fill="none" stroke="#c4a984" stroke-width="2"/>
  ${[200, 306, 410].map((x, i) => `<g transform="translate(${x} 56)"><path d="M0-38v14" stroke="#c4a984" stroke-width="1.6"/><circle r="27" fill="#f4e6c9" stroke="#d8bd93" stroke-width="2"/>${iceCream(0, -9, ['strawberry', 'vanilla', 'blueberry'][i], .21)}</g>`).join('')}
  <path d="M92 164V119Q92 79 142 79h326q45 0 45 40v45Z" fill="#d5e9de" fill-opacity=".38" stroke="#8eafa2" stroke-width="3"/>
  <path d="M106 156V119q0-29 37-29h322q34 0 34 29v37Z" fill="#e2f0e3" fill-opacity=".18" stroke="#ecedd2" stroke-width="2"/>
  ${scoopBowl(155, 133, 'strawberry', .95)}${scoopBowl(252, 130, 'vanilla', .95)}${scoopBowl(349, 130, 'blueberry', .95)}${scoopBowl(448, 133, 'strawberry', .95)}
  <path d="m144 94-21 61m40-62-15 48m258-46-13 45" stroke="#ffffec" stroke-width="5" opacity=".7"/>
  <path d="M86 164q220 27 435 0v20H86Z" fill="url(#ex-cream)" stroke="#c0a687" stroke-width="2.5"/>
  <path d="M93 184h421v98q-208 26-421 0Z" fill="#afd0be" stroke="#83a995" stroke-width="2"/>
  <path d="M105 188h398v83q-193 18-398 0Z" fill="#c9ddc6" stroke="#e7deb5" stroke-width="2"/>
  ${Array.from({ length: 18 }, (_, i) => `<path d="M${118 + i * 21} 192v78" stroke="#acc8b2" stroke-width="2" opacity=".65"/>`).join('')}
  <path d="M99 272q207 23 408 0" stroke="#fff0c8" stroke-width="5" fill="none"/>
  <g transform="translate(304 231)"><ellipse rx="69" ry="31" fill="#f5e8cd" stroke="#d7ba91" stroke-width="2"/><path d="M-47 6q43 14 93 0" stroke="#d0a69c" stroke-width="2" fill="none"/>${mark('rose', 0, 0, 1.1)}${mark('leaf', -38, 0, .66)}${mark('leaf', 39, 0, .66)}</g>
  <g transform="translate(547 184)"><path d="M-26-16h53v45h-53Z" fill="#d4b89a" stroke="#b2987b" stroke-width="1.5"/><ellipse cy="-16" rx="27" ry="8" fill="#f2dab3" stroke="#b2987b"/><path d="m-20-24 9-45 26 10-15 42m0-24 9-44 25 9-16 43" fill="url(#ex-waffle)" stroke="#bb925f" stroke-width="1.5"/><path d="M-20 2h40m-35 12h31" stroke="#ebd5b1" stroke-width="2"/></g>
  <g transform="translate(548 249)"><path d="M-19-7h39v45h-39Z" fill="#ead9b8" stroke="#b8a486" stroke-width="1.5"/><ellipse cy="-7" rx="20" ry="7" fill="#f6e6c6" stroke="#b8a486"/><path d="M-18 20q18 10 36 0" stroke="#d7b4a3" stroke-width="3" fill="none"/><path d="m-5-1 4-45 12 1-3 44m-24 0-3-38 8-2 7 40" stroke="#baad93" stroke-width="2" fill="#d6dbbf"/></g>
  <path d="m114 285-5 15m390-15 5 15" stroke="#a58668" stroke-width="8"/>
  <g transform="translate(62 286)"><path d="M0 1v17m-17 0h34" stroke="#bb9c78" stroke-width="4"/><ellipse cy="-1" rx="23" ry="9" fill="#dfb1b5" stroke="#b98c94" stroke-width="1.5"/><path d="M-15 1h29" stroke="#f4d9c1" stroke-width="2"/></g>`);

const expansionIcons = {
  eat: '<ellipse cx="30" cy="47" rx="26" ry="8" fill="#fdf3dc" stroke="#cda985" stroke-width="2"/><ellipse cx="30" cy="45" rx="20" ry="5" fill="#ead7b8"/><path d="M13 43V20h33v23Z" fill="#f0c39d" stroke="#c69b82" stroke-width="2"/><path d="M13 20h33v10q-4 4-8 0q-5 6-9 0q-5 5-8 0q-4 4-8 0Z" fill="#f5bfcf" stroke="#c69b82" stroke-width="1.5"/><ellipse cx="29" cy="20" rx="17" ry="5" fill="#ffefdd" stroke="#c69b82" stroke-width="1.5"/><path d="M13 35h32" stroke="#fff1d3" stroke-width="3"/><circle cx="29" cy="14" r="6" fill="#d98c9c" stroke="#b66c83" stroke-width="1.5"/><path d="M29 9q0-7 7-7" fill="none" stroke="#89a77f" stroke-width="2"/><path d="M5 24v24m-3-27v8h6v-8m47 0v14h-4l3 14" fill="none" stroke="#ab947b" stroke-width="2.5"/>',
  sleep: '<path d="M7 49V16q0-5 5-5h35q6 0 6 5v33" fill="#d8b698" stroke="#b58b72" stroke-width="2"/><path d="M11 27h38v24H11Z" fill="#eac1d2" stroke="#b385a5" stroke-width="2"/><path d="M11 40h38v11H11Z" fill="#c6a2d0" stroke="#a080b5" stroke-width="1.5"/><rect x="14" y="18" width="18" height="10" rx="4" fill="#fff2dd" stroke="#cbb193" stroke-width="1.5"/><path d="M6 48h48v6H6Z" fill="#f1d39f" stroke="#b99873" stroke-width="2"/><path d="M10 54v4m40-4v4" stroke="#b99873" stroke-width="3"/><path d="M43 2q-14 0-12 12q10 7 17-5q-11 5-5-7Z" fill="#f1d69c" stroke="#c2a376" stroke-width="1.5"/><path d="M17 4v4m-2-2h4" stroke="#b298c6" stroke-width="2"/>',
  bath: '<path d="M7 32h46l-4 18q-19 9-38 0Z" fill="#e9dfcf" stroke="#bda28f" stroke-width="2"/><path d="M11 47q17 5 34 0" fill="none" stroke="#c9b8a5" stroke-width="2"/><ellipse cx="30" cy="31" rx="25" ry="7" fill="#c3e0df" stroke="#84aca9" stroke-width="2"/><path d="M13 25v-9q0-7 7-7q7 0 7 7v3" fill="none" stroke="#c6a774" stroke-width="3"/><path d="M22 19h10" stroke="#c6a774" stroke-width="3"/><path d="M26 22v5m-4-4v5m8-5v5" stroke="#a5cdcf" stroke-width="2"/><circle cx="18" cy="31" r="5" fill="#fff9e9" stroke="#b6ced0"/><circle cx="27" cy="28" r="6" fill="#fff9e9" stroke="#b6ced0"/><circle cx="36" cy="30" r="6" fill="#fff9e9" stroke="#b6ced0"/><circle cx="42" cy="24" r="4" fill="#e4f2e9" stroke="#a5cdcf"/><circle cx="39" cy="12" r="5" fill="#e4f2e9" stroke="#a5cdcf"/><circle cx="51" cy="5" r="3" fill="#e4f2e9" stroke="#a5cdcf"/><path d="m16 54-2 3m31-3 2 3" stroke="#bda28f" stroke-width="3"/>',
  toilet: '<path d="M5 56V17Q5 3 30 3q25 0 25 14v42Z" fill="#c0d4c3" stroke="#8fab99" stroke-width="2"/><path d="M11 53V18q0-9 19-9q19 0 19 9v35Z" fill="#f9ead4" stroke="#cfb397" stroke-width="1.5"/><rect x="23" y="18" width="18" height="16" rx="4" fill="#fff9ed" stroke="#b8aa99" stroke-width="1.5"/><path d="M18 34h24q0 12-10 14v7H21l3-9q-7-5-6-12Z" fill="#eee6d9" stroke="#b8aa99" stroke-width="1.5"/><ellipse cx="29" cy="34" rx="13" ry="4" fill="#fff9ed" stroke="#b8aa99" stroke-width="1.5"/><ellipse cx="29" cy="34" rx="7" ry="1.6" fill="#cfdfd8"/><path d="M11 13 5 17v38l6-2" fill="#d9b5c5" stroke="#b78e9f" stroke-width="1.5"/><circle cx="8" cy="35" r="1.6" fill="#ffe6ac"/><path d="M31 23h4" stroke="#c2b291" stroke-width="2"/>',
  potion: '<path d="M11 35q-4 19 19 20q23-1 19-20Z" fill="url(#gold)" stroke="#b89668" stroke-width="2"/><ellipse cx="30" cy="33" rx="23" ry="7" fill="#c7a8dc" stroke="#a184b8" stroke-width="2"/><ellipse cx="30" cy="32" rx="18" ry="4" fill="#e0c6ef"/><path d="m13 51-3 6m37-6 3 6m-41-19-5 2m47-2 5 2" stroke="#b89668" stroke-width="3"/><path d="m19 38 11-13 9 13" fill="none" stroke="#a78467" stroke-width="3"/><path d="m35 28 11-17" stroke="#b08ba6" stroke-width="3"/><circle cx="13" cy="19" r="5" fill="#e9d1ef" stroke="#b799c8" stroke-width="1.5"/><circle cx="26" cy="12" r="7" fill="#c5dec7" stroke="#8faf9b" stroke-width="1.5"/><circle cx="14" cy="6" r="3" fill="#eed19e" stroke="#c2a271"/>' + mark('star', 46, 8, .55) + mark('star', 30, 44, .45),
  home: '<path d="M6 54V24l9-11 9 11v30m12 0V24l9-11 9 11v30" fill="#e7bdc6" stroke="#a6788e" stroke-width="2"/><path d="m4 24 11-14 11 14m8 0 11-14 11 14" fill="#b69cc9" stroke="#8f76a4" stroke-width="2"/><path d="M20 54V30l10-12 10 12v24Z" fill="#f4d49e" stroke="#b39162" stroke-width="2"/><path d="M25 54V43q5-9 10 0v11" fill="#a6c4b7" stroke="#779b89" stroke-width="2"/><path d="M30 18V5l11 4-11 4" fill="#d995ad" stroke="#a6788e" stroke-width="2"/><path d="M11 32h8v9h-8m30-9h8v9h-8" fill="#fff4d8" stroke="#a6788e" stroke-width="1.5"/><path d="M3 55h54" stroke="#b39162" stroke-width="3"/>',
  grab: '<path d="M16 48 7 33q-3-6 2-8q4-2 9 6V13q0-8 6-8q6 0 6 8v12-14q0-7 6-6q5 1 5 7v15-7q0-6 5-5q5 1 5 7v10-3q0-5 4-4q4 1 3 8l-3 15q-2 9-15 10H28q-8-1-12-10Z" fill="#f5d4bb" stroke="#b58b7e" stroke-width="2.3"/><path d="M19 33q12-7 18 4m-9 11h16" fill="none" stroke="#cb9e8e" stroke-width="2"/><path d="M4 12V6m-3 3h6m42-4v6m-3-3h6" stroke="#c2a0cd" stroke-width="2.5"/>',
  stop: '<circle cx="30" cy="30" r="27" fill="#f4d6d5" stroke="#bc8291" stroke-width="2"/><rect x="16" y="16" width="28" height="28" rx="6" fill="#bb7188" stroke="#a5647b" stroke-width="2"/><path d="M21 20h17" stroke="#f6dce1" stroke-width="2.5"/>',
  pause: '<circle cx="30" cy="30" r="27" fill="#ece0f3" stroke="#a188b6" stroke-width="2"/><rect x="17" y="15" width="9" height="30" rx="3" fill="#aa85b7" stroke="#8e70a1" stroke-width="1.5"/><rect x="34" y="15" width="9" height="30" rx="3" fill="#aa85b7" stroke="#8e70a1" stroke-width="1.5"/>',
  play: '<circle cx="30" cy="30" r="27" fill="#e0eecf" stroke="#8eae83" stroke-width="2"/><path d="M23 14 46 30 23 47Z" fill="#70a78b" stroke="#4d846d" stroke-width="2"/><path d="m26 20 13 10" stroke="#b6dbbb" stroke-width="2.5"/>',
  album: '<path d="M5 14q12-6 25-1q13-5 25 1v39q-13-5-25 0q-13-5-25 0Z" fill="#cbb0d6" stroke="#9979ab" stroke-width="2"/><path d="M9 17q10-4 21 0q11-4 21 0v31q-11-4-21 0q-11-4-21 0Z" fill="#fff0d5" stroke="#d7ba97" stroke-width="1.5"/><path d="M30 17v30" stroke="#d7ba97" stroke-width="1.5"/><path d="m12 22-2-7 6 2 3-7 3 7 5-2-2 7m10 0-2-7 6 2 3-7 3 7 5-2-2 7" fill="url(#gold)" stroke="#b79763" stroke-width="1.2"/><circle cx="18" cy="29" r="6" fill="#efd0b3" stroke="#b98a7c" stroke-width="1.2"/><circle cx="42" cy="29" r="6" fill="#c99b7d" stroke="#a77867" stroke-width="1.2"/><path d="M12 44q-1-10 6-10q7 0 6 10m12 0q-1-10 6-10q7 0 6 10" fill="#deafbc" stroke="#b386a0" stroke-width="1.4"/><path d="M18 29h1m22 0h1" stroke="#785768" stroke-width="2"/>',
  check: '<circle cx="30" cy="30" r="27" fill="#dcebd0" stroke="#83a07e" stroke-width="2"/><path d="m15 30 10 11 21-24" fill="none" stroke="#598871" stroke-width="6"/>',
  cart: '<path d="M11 19h40l-5 23H16Z" fill="#f0c9d1" stroke="#b78499" stroke-width="2"/><path d="M4 11h6l8 37h29m-27-24h25m-22 9h18m-14-13 2 19m8-19-2 19" fill="none" stroke="#b78499" stroke-width="2"/><circle cx="23" cy="53" r="4" fill="#af95c1"/><circle cx="43" cy="53" r="4" fill="#af95c1"/><circle cx="39" cy="12" r="9" fill="url(#gold)" stroke="#b39162" stroke-width="1.5"/>' + mark('star', 39, 12, .35),
  coin: '<ellipse cx="30" cy="31" rx="24" ry="25" fill="#c8a06a" stroke="#ad8955" stroke-width="1.5"/><ellipse cx="28" cy="28" rx="23" ry="24" fill="url(#gold)" stroke="#c09c5d" stroke-width="1.5"/><ellipse cx="28" cy="28" rx="18" ry="19" fill="none" stroke="#f8e4ac" stroke-width="2"/><use href="#sun" transform="translate(28 28) scale(.94)"/><path d="m45 17 4 1m-2 7 4 1m-2 7 3 1m-4 7 3 1m-6 6 3 1" stroke="#a9824c" stroke-width="1.3"/><path d="M15 12q7-6 16-5" fill="none" stroke="#fff0c1" stroke-width="2"/>',
  travel: '<path d="M9 22h35v29H9Z" fill="#d6b5a1" stroke="#aa8971" stroke-width="1.6"/><path d="M18 22v-7q9-8 18 0v7" fill="none" stroke="#aa8971" stroke-width="2"/><path d="M15 25v22m23-22v22M9 42h35" stroke="#f0d7b1" stroke-width="2"/><circle cx="14" cy="53" r="3" fill="#9e836a"/><circle cx="40" cy="53" r="3" fill="#9e836a"/><path d="m35 8 15-4 4 17-15 4Z" fill="#cfddc4" stroke="#96ac93"/><path d="m40 10 4 3 5-6m-8 8 6 3 3-4" fill="none" stroke="#91ad9b" stroke-width="1.3"/>' + mark('star', 27, 35, .54),
  stairs: '<path d="M7 53V22Q7 5 29 5q24 0 24 17v31Z" fill="#dcc5a4" stroke="#ad9376" stroke-width="1.5"/><path d="M13 51V24q0-13 17-13q17 0 17 13v27Z" fill="#b6c6b5"/><path d="M14 39h10v-8h10v-8h12v28H14Z" fill="#f0ddba" stroke="#bba282" stroke-width="1.5"/><path d="M14 45h32m-22-8h22m-11-8h11" stroke="#d3b892" stroke-width="1.3"/><path d="M20 24v-8m-4 4 4-4 4 4" fill="none" stroke="#8d9e87" stroke-width="1.8"/>',
  wardrobe: '<path d="M7 52V16q23-18 46 0v36Z" fill="url(#wood)" stroke="#a18068" stroke-width="1.5"/><path d="M13 49V19q17-12 34 0v30Z" fill="#c4b295" stroke="#efd5ad"/><path d="M24 18h15m-9 0v5m-8 4 8-5 9 5" fill="none" stroke="#b99972" stroke-width="1.2"/><path d="M25 25h10l4 9-3 1 5 11H19l5-11-3-1Z" fill="#aecdc3" stroke="#799f99" stroke-width="1"/><path d="M14 19 5 23v31l9-5m32-30 9 4v31l-9-5" fill="#ddbaa0" stroke="#a18068" stroke-width="1.3"/><circle cx="10" cy="39" r="2" fill="#f3d8a2"/><circle cx="50" cy="39" r="2" fill="#f3d8a2"/><path d="M10 53v3m40-3v3" stroke="#a18068" stroke-width="3"/>',
  bag: '<path d="M10 20h40l-3 35H13Z" fill="#edd0b0" stroke="#b99a7b" stroke-width="1.6"/><path d="M18 21v-8q11-14 23 0v8" fill="none" stroke="#b99a7b" stroke-width="2.4"/><path d="M14 24v24m32-24v24" stroke="#f8e6c9" stroke-width="2"/>' + mark('rose', 30, 37, .92),
  stardust: fairyBottle(28, 52, '#f0d19d', 'star', .55) + mark('star', 48, 12, .4) + '<circle cx="10" cy="15" r="2" fill="#ddbd82"/><path d="M44 24v5m-2-2h4" stroke="#d9bb81" stroke-width="1.5"/>',
  moonwater: fairyBottle(30, 53, '#c5b4de', 'moon', .58) + '<path d="M8 12q4-5 7 0q0 4-4 7q-5-3-3-7" fill="#d2dbe1" stroke="#9daebb"/><circle cx="49" cy="19" r="2" fill="#e8d59f"/>',
  petals: fairyBottle(29, 52, '#ebbfce', 'petal', .56) + mark('petal', 48, 13, .5) + '<path d="M11 20q-9 4-7-3q5-4 7 3" fill="#efc3ce" stroke="#bf8e9e" stroke-width=".8"/>',
  crystal: '<ellipse cx="30" cy="51" rx="24" ry="5" fill="#d9c5b7" opacity=".45"/><g transform="translate(29 30)">' + mark('crystal', 0, 0, 1.03) + mark('crystal', -15, 10, .61) + mark('crystal', 17, 13, .6) + '</g><path d="M48 7v8m-4-4h8M8 14v5m-2-3h4" stroke="#d5b991" stroke-width="1.5"/>',
  dewdrop: fairyBottle(30, 53, '#b0d6c5', 'drop', .55) + mark('drop', 49, 13, .35) + sprig(9, 25, .27),
  'recipe-starlight': '<path d="M5 16q13-8 24-2q13-8 26-2v38q-15-6-26 0q-11-6-24-1Z" fill="#b59dc2" stroke="#94819f" stroke-width="1.5"/><path d="M8 15q12-7 21-1q12-7 23-1v32q-13-5-23 1q-10-6-21-3Z" fill="#fff0d2" stroke="#d4b996" stroke-width=".8"/><path d="M29 14v33m-17-10 10 2m10 2 13-1" stroke="#cdb797" stroke-width="1"/>' + mark('moon', 17, 24, .43) + mark('star', 42, 28, .73) + mark('crystal', 16, 37, .24) + '<circle cx="42" cy="13" r="1.6" fill="#ead29b"/>',
  'recipe-blossom': '<path d="M5 16q13-8 24-2q13-8 26-2v38q-15-6-26 0q-11-6-24-1Z" fill="#c0cfb0" stroke="#8fa185" stroke-width="1.5"/><path d="M8 15q12-7 21-1q12-7 23-1v32q-13-5-23 1q-10-6-21-3Z" fill="#fff0d2" stroke="#d4b996" stroke-width=".8"/><path d="M29 14v33m-17-10 10 2m11 4h13" stroke="#cdb797" stroke-width="1"/>' + mark('drop', 17, 24, .4) + mark('petal', 17, 37, .3) + '<use href="#flower" transform="translate(41 27) scale(.64)"/>',
};
for (const [name, drawing] of Object.entries(expansionIcons)) await newAsset(`icons/${name}`, 60, 60, drawing);

const actorAnchors = {
  coordinateSystem: 'Actor root/feet in room-local pixels; offsets are relative to the station center at ground y=480. Props use origin (0.5, 1).',
  rig: { width: 240, height: 340, origin: [120, 325], leftArmPivot: [85, 164], rightArmPivot: [155, 164], leftLegPivot: [92, 303], rightLegPivot: [154, 303] },
  slide: {
    station: [310, 480], size: [400, 310],
    offsets: { approach: [-159, 0], ladderBottom: [-156, -6], ladderMiddle: [-132, -108], platform: [-110, -225], chuteEntry: [-52, -132], chuteMiddle: [30, -48], chuteExit: [150, 8], landing: [150, 0] },
    seatedPoseRotationsDegrees: { chuteEntry: -20, chuteMiddle: -50, chuteExit: -68 },
    seatedHipReference: [120, 190],
  },
  treehouse: {
    station: [840, 480], size: [400, 360],
    offsets: { approach: [-76, 0], ladderBottom: [-76, -5], ladderMiddle: [-60, -96], ladderTop: [-43, -186], entrance: [-20, -190], lookout: [50, -190], exit: [-76, 0] },
  },
  hammock: { station: [905, 480], size: [360, 290], offsets: { approach: [-135, 0], seatedRest: [0, -5] }, seatContact: [905, 394] },
  cauldron: { stations: [[320, 480], [835, 480]], size: [360, 250], offsets: { mixing: [0, -10], pourHand: [-60, -96], bowlCenter: [0, -84], stirTip: [3, -80] }, armRotationsRadians: { left: .78, right: 1.8 }, frontMaskStartsAtY: 404 },
};
await writeFile(resolve(destination, 'manifest.json'), JSON.stringify({ version: 1, artDirection: 'Sunlit Storybook', authorship: 'Original artwork created for mini-games; no paid or third-party character art.', expansion: { collection: 'Outings and enchanted play', originalAssetsPreserved: 122, recommendedActorAnchors: actorAnchors }, assets: records }, null, 2) + '\n');
await writeFile(resolve(destination, 'provenance.json'), JSON.stringify({
  artDirection: 'Sunlit Storybook',
  origin: 'Original vector paths authored for the mini-games Princess Mansion expansion.',
  source: 'scripts/generate-princess-mansion-assets.mjs',
  reproduction: 'node scripts/generate-princess-mansion-assets.mjs',
  deterministic: true,
  externalAssets: [],
  externalFonts: [],
  fictionalMagic: 'Stardust, moonwater, dream petals, wish crystals and fairy dewdrops create floating stars and blossoms. No real-world potion recipe or chemical instruction is depicted.',
  preservation: 'The 122 original SVGs, including all eight original room backgrounds and all eight original princess identities and rig parts, are regenerated byte-for-byte without modification.',
  design: 'Warm handmade outlines, pearlescent pastels, woven textiles, botanical ornaments, sun medallions and layered transparent prop masks.',
}, null, 2) + '\n');
await writeFile(resolve(destination, 'credits.txt'), 'Royal Princess Mansion: original Sunlit Storybook vector artwork.\nReproducible source: scripts/generate-princess-mansion-assets.mjs\nNo Disney/Pixar characters, branded magic-school sets, paid assets, external fonts, or third-party asset packs are included.\nThe expansion adds original outings, enchanted play spaces, outfits, toys, treats and fictional fairy-tale ingredients.\nOriginal princess faces, hair, crowns, skin tones, rig pivots and all eight original room backgrounds are preserved.\nManifest SHA256 hashes cover every SVG. Detailed authorship and fictional-magic provenance: provenance.json.\n');
console.log(`Generated ${records.length} original princess, room, prop and icon SVG assets.`);

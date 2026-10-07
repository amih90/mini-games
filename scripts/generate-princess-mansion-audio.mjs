import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('../public/games/princess-mansion/audio/', import.meta.url));
mkdirSync(directory, { recursive: true });
const sampleRate = 22050;
const originals = [];

function writeWave(file, duration, sample) {
  const frames = Math.round(duration * sampleRate);
  const buffer = Buffer.alloc(44 + frames * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(frames * 2, 40);
  for (let index = 0; index < frames; index++) buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sample(index / sampleRate, index))) * 32767), 44 + index * 2);
  writeFileSync(`${directory}/${file}`, buffer);
  originals.push(file);
}

const tau = 2 * Math.PI;
function bell(time, frequency, duration = 2.5) {
  if (time < 0 || time >= duration) return 0;
  const envelope = (1 - Math.exp(-time * 120)) * Math.exp(-time * 2.8) * Math.min(1, (duration - time) * 12);
  return envelope * (Math.sin(tau * frequency * time) + 0.22 * Math.sin(tau * frequency * 2 * time)) * 0.12;
}
const notes = [[2, 523.25], [4.5, 659.25], [7, 783.99], [10, 659.25], [13, 587.33], [16, 523.25], [18.5, 659.25], [21, 523.25]];
writeWave('palace-ambient.wav', 24, time => {
  const edge = Math.min(1, time / 1.5, (24 - time) / 1.5);
  const pad = [130.8125, 164.8125, 196].reduce((sum, frequency, index) => sum + Math.sin(tau * frequency * time) * (0.028 + Math.sin(tau * time / 8 + index) * 0.007), 0);
  return edge * (pad + notes.reduce((sum, [at, frequency]) => sum + bell(time - at, frequency) * 0.48, 0));
});

let seed = 17091;
let lowNoise = 0;
function noise() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  lowNoise += ((seed / 4294967296 * 2 - 1) - lowNoise) * 0.16;
  return lowNoise;
}
writeWave('bubbles.wav', 0.95, time => {
  const water = noise() * Math.sin(Math.PI * time / 0.95) * 0.18;
  return water + [0, 0.17, 0.34, 0.57].reduce((sum, at, index) => {
    const local = time - at;
    if (local < 0 || local > 0.15) return sum;
    return sum + Math.sin(tau * ((260 + index * 95) * local + 2100 * local * local)) * Math.sin(Math.PI * local / 0.15) * 0.24;
  }, 0);
});
writeWave('flush.wav', 1.25, time => noise() * Math.sin(Math.PI * time / 1.25) * 0.5 + Math.sin(tau * (180 * time - 45 * time * time)) * Math.sin(Math.PI * time / 1.25) * 0.055);
writeWave('munch.wav', 0.48, time => {
  const pulse = [0.025, 0.18, 0.33].reduce((sum, at) => {
    const local = time - at;
    return sum + (local >= 0 && local < 0.09 ? Math.sin(Math.PI * local / 0.09) * Math.exp(-local * 15) : 0);
  }, 0);
  return noise() * pulse * 0.55;
});

const sources = {
  'button.mp3': 'click_003.ogg',
  'page.mp3': 'maximize_003.ogg',
  'place.mp3': 'drop_003.ogg',
  'welcome.mp3': 'confirmation_002.ogg',
  'pop.mp3': 'bong_001.ogg',
};
const source = 'https://kenney.nl/assets/interface-sounds';
const assets = [...originals, ...Object.keys(sources)].map(file => {
  const bytes = readFileSync(`${directory}/${file}`);
  return {
    file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
    ...(sources[file] ? { creator: 'Kenney', source, original: sources[file], license: 'CC0-1.0' } : { creator: 'Mini-Games original', source: 'scripts/generate-princess-mansion-audio.mjs', license: 'Original project audio' }),
  };
});
writeFileSync(`${directory}/manifest.json`, `${JSON.stringify({ version: 1, sampleRate, assets }, null, 2)}\n`);
console.log(`Generated four original WAVs and verified ${Object.keys(sources).length} local CC0 interface sounds.`);

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { CHARACTER_PARTS, ICON_TEXTURES, NEED_IDS, PRINCESS_IDS, PROP_TEXTURES, ROOM_IDS } from '../src/features/games/princess-mansion/data';
import { CATALOG, OUTFIT_IDS, OUTFIT_PARTS } from '../src/features/games/princess-mansion/catalog';

test('all original asset contracts, SVG references and hashes are complete', async ({ page }) => {
  const root = path.join(process.cwd(), 'public/games/princess-mansion');
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8')) as {
    artDirection: string; assets: { file: string; width: number; height: number; sha256: string; origin: string }[];
  };
  const expected = [
    ...PRINCESS_IDS.flatMap(id => [...CHARACTER_PARTS, 'portrait'].map(part => `characters/${id}-${part}.svg`)),
    ...PRINCESS_IDS.flatMap(id => OUTFIT_IDS.flatMap(outfit => OUTFIT_PARTS.map(part => `characters/${id}-${outfit}-${part}.svg`))),
    ...ROOM_IDS.map(id => `rooms/${id}.svg`),
    ...PROP_TEXTURES.map(id => `props/${id}.svg`),
    ...ICON_TEXTURES.map(id => `icons/${id}.svg`),
    ...CATALOG.map(item => `items/${item.id}.svg`),
  ];
  expect(manifest.artDirection).toBe('Sunlit Storybook');
  expect(manifest.assets.map(asset => asset.file).sort()).toEqual(expected.sort());
  const drawings = await Promise.all(manifest.assets.map(async asset => {
    const svg = await readFile(path.join(root, asset.file), 'utf8');
    expect(createHash('sha256').update(svg).digest('hex')).toBe(asset.sha256);
    expect(svg).toContain(`viewBox="0 0 ${asset.width} ${asset.height}"`);
    expect(asset.origin).toContain('Original');
    return { file: asset.file, svg };
  }));
  const errors = await page.evaluate(files => files.flatMap(({ file, svg }) => {
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    if (document.querySelector('parsererror')) return [`${file}: malformed XML`];
    const ids = new Set([...document.querySelectorAll('[id]')].map(element => element.id));
    const references = [...svg.matchAll(/(?:url\(#|href="#)([^)"\s]+)/g)].map(match => match[1]);
    return references.filter(id => !ids.has(id)).map(id => `${file}: missing ${id}`);
  }), drawings);
  expect(errors).toEqual([]);
});

test('all four locales contain exactly the same complete mansion vocabulary', async () => {
  function flatten(object: Record<string, unknown>, prefix = ''): Record<string, string> {
    return Object.fromEntries(Object.entries(object).flatMap(([key, value]) => {
      if (typeof value === 'string') return [[prefix + key, value]];
      if (value && typeof value === 'object' && !Array.isArray(value)) return Object.entries(flatten(value as Record<string, unknown>, `${prefix}${key}.`));
      throw new Error(`Invalid translation at ${prefix}${key}`);
    }));
  }
  const dictionaries = await Promise.all(['en', 'he', 'zh', 'es'].map(async locale => {
    const dictionary = JSON.parse(await readFile(path.join(process.cwd(), 'messages', `${locale}.json`), 'utf8'));
    expect(dictionary.common.instructions).toBeTruthy();
    expect(dictionary.footer.copyright).toBeTruthy();
    return flatten(dictionary.princessMansion);
  }));
  const keys = Object.keys(dictionaries[0]).sort();
  for (const dictionary of dictionaries) {
    expect(Object.keys(dictionary).sort()).toEqual(keys);
    for (const key of keys) {
      expect(dictionary[key].trim()).not.toBe('');
      expect([...dictionary[key].matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()).toEqual([...dictionaries[0][key].matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort());
    }
    for (const id of PRINCESS_IDS) expect(dictionary[`princesses.${id}`]).toBeTruthy();
    for (const id of ROOM_IDS) expect(dictionary[`rooms.${id}`]).toBeTruthy();
    for (const id of NEED_IDS) expect(dictionary[`needs.${id}`]).toBeTruthy();
  }
});

test('joyful audio is local, licensed, hashed and the ambience loops quietly without a seam', async () => {
  const root = path.join(process.cwd(), 'public/games/princess-mansion/audio');
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8')) as {
    assets: { file: string; sha256: string; bytes: number; creator: string; source: string; license: string }[];
  };
  expect(manifest.assets).toHaveLength(14);
  expect(await readFile(path.join(root, 'kenney-LICENSE.txt'), 'utf8')).toContain('Creative Commons Zero, CC0');
  for (const asset of manifest.assets) {
    const bytes = await readFile(path.join(root, asset.file));
    expect(bytes.length).toBe(asset.bytes);
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
    if (asset.creator === 'Kenney') {
      expect(asset.license).toBe('CC0-1.0');
      expect(asset.source).toBe('https://kenney.nl/assets/interface-sounds');
    } else expect(asset.source).toBe('scripts/generate-princess-mansion-audio.mjs');
  }
  for (const file of ['palace-ambient.wav', 'beach-ambient.wav']) {
    const ambient = await readFile(path.join(root, file));
    expect(ambient.toString('ascii', 0, 4)).toBe('RIFF');
    expect(ambient.readUInt32LE(24)).toBe(22050);
    expect((ambient.length - 44) / 2 / 22050).toBe(24);
    expect(ambient.readInt16LE(44)).toBe(ambient.readInt16LE(ambient.length - 2));
    let squares = 0;
    for (let index = 44; index < ambient.length; index += 2) squares += (ambient.readInt16LE(index) / 32767) ** 2;
    const rms = Math.sqrt(squares / ((ambient.length - 44) / 2));
    expect(rms).toBeGreaterThan(0.01);
    expect(rms * 0.13).toBeLessThan(0.01);
  }
});

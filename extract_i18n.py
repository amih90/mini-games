#!/usr/bin/env python3
"""
extract_i18n.py - Extract and merge all game translations into messages/*.json

Reads embedded const translations and const instructionsData from TSX files,
converts to flat keys, and merges into the 4 locale JSON files.
"""

import json
import re
import os

LOCALES = ['en', 'he', 'zh', 'es']
MESSAGES_DIR = 'messages'

# ─── helpers ─────────────────────────────────────────────────────────────────

def read_json(locale):
    path = os.path.join(MESSAGES_DIR, f'{locale}.json')
    with open(path, encoding='utf-8') as f:
        return json.load(f)

def write_json(locale, data):
    path = os.path.join(MESSAGES_DIR, f'{locale}.json')
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'  wrote {path}')

def deep_merge(base, new_data):
    """Merge new_data into base. New keys win; existing keys preserved.
    Special case: if existing value is a primitive and new is a dict,
    replace it (e.g., old 'instructions' string -> new nested object).
    """
    for k, v in new_data.items():
        if k not in base:
            base[k] = v
        elif isinstance(v, dict) and isinstance(base[k], dict):
            deep_merge(base[k], v)
        elif isinstance(v, dict) and not isinstance(base[k], dict):
            # Replace primitive with nested object (e.g. 'instructions' string -> nested)
            base[k] = v
        # else: don't overwrite existing primitive with primitive
    return base

def ts_string_extract(s):
    """Remove surrounding quotes from a TS string value."""
    s = s.strip()
    if (s.startswith("'") and s.endswith("'")) or \
       (s.startswith('"') and s.endswith('"')) or \
       (s.startswith('`') and s.endswith('`')):
        return s[1:-1]
    return s

def extract_ts_flat_object(content, var_name, locale):
    """
    Extract a flat key:value object for a specific locale from a TS
    const translations / Record object.

    Handles forms like:
      const translations: Record<string, ...> = {
        en: { key: 'val', ... },
        he: { ... }
      }
    """
    idx = content.find(f'const {var_name}')
    if idx == -1:
        return {}
    # find locale block
    loc_idx = content.find(f'\n  {locale}:', idx)
    if loc_idx == -1:
        return {}
    block_start = content.find('{', loc_idx)
    if block_start == -1:
        return {}
    # find matching closing brace
    depth = 0
    i = block_start
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                block = content[block_start:i+1]
                break
        i += 1
    else:
        return {}
    return parse_flat_ts_object(block)

def parse_flat_ts_object(block):
    """Parse a simple flat TS object {key: 'val', ...} into a Python dict."""
    result = {}
    # Remove outer braces
    inner = block.strip()
    if inner.startswith('{'):
        inner = inner[1:]
    if inner.endswith('}'):
        inner = inner[:-1]

    # Match: key: 'value' or key: "value" or key: `value`
    pattern = re.compile(
        r'''(\w+)\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`)''',
        re.DOTALL
    )
    for m in pattern.finditer(inner):
        key = m.group(1)
        value = m.group(2) or m.group(3) or m.group(4) or ''
        # unescape basic escapes
        value = value.replace("\\'", "'").replace('\\"', '"').replace('\\n', '\n').replace('\\\\', '\\')
        result[key] = value
    return result

def extract_instructions_data(content, locale):
    """
    Extract instructionsData for a locale into flat keys:
      instructions.step0Icon, instructions.step0Title, instructions.step0Desc
      instructions.control0Icon, instructions.control0Desc
      instructions.tip
    """
    idx = content.find('const instructionsData')
    if idx == -1:
        return {}

    loc_idx = content.find(f'\n  {locale}:', idx)
    if loc_idx == -1:
        return {}

    block_start = content.find('{', loc_idx)
    if block_start == -1:
        return {}

    # Find matching brace
    depth = 0
    i = block_start
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                block = content[block_start:i+1]
                break
        i += 1
    else:
        return {}

    result = {}

    # Extract instructions array items
    instr_match = re.search(r'instructions\s*:\s*\[', block)
    if instr_match:
        arr_start = block.find('[', instr_match.start())
        arr_end = find_matching_bracket(block, arr_start, '[', ']')
        if arr_end != -1:
            arr_content = block[arr_start:arr_end+1]
            items = extract_array_objects(arr_content)
            for i2, item in enumerate(items):
                icon = extract_field_value(item, 'icon')
                title = extract_field_value(item, 'title')
                desc = extract_field_value(item, 'description')
                if icon:
                    result[f'instructions.step{i2}Icon'] = icon
                if title:
                    result[f'instructions.step{i2}Title'] = title
                if desc:
                    result[f'instructions.step{i2}Desc'] = desc

    # Extract controls array items
    ctrl_match = re.search(r'controls\s*:\s*\[', block)
    if ctrl_match:
        arr_start = block.find('[', ctrl_match.start())
        arr_end = find_matching_bracket(block, arr_start, '[', ']')
        if arr_end != -1:
            arr_content = block[arr_start:arr_end+1]
            items = extract_array_objects(arr_content)
            for i2, item in enumerate(items):
                icon = extract_field_value(item, 'icon')
                desc = extract_field_value(item, 'description')
                if icon:
                    result[f'instructions.control{i2}Icon'] = icon
                if desc:
                    result[f'instructions.control{i2}Desc'] = desc

    # Extract tip
    tip_match = re.search(r"tip\s*:\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"|`((?:[^`\\]|\\.)*)`)", block)
    if tip_match:
        tip = tip_match.group(1) or tip_match.group(2) or tip_match.group(3) or ''
        tip = tip.replace("\\'", "'").replace('\\"', '"')
        if tip:
            result['instructions.tip'] = tip

    return result

def find_matching_bracket(s, start, open_char, close_char):
    depth = 0
    for i in range(start, len(s)):
        if s[i] == open_char:
            depth += 1
        elif s[i] == close_char:
            depth -= 1
            if depth == 0:
                return i
    return -1

def extract_array_objects(arr_content):
    """Extract individual object strings from an array string."""
    items = []
    i = 0
    while i < len(arr_content):
        if arr_content[i] == '{':
            end = find_matching_bracket(arr_content, i, '{', '}')
            if end != -1:
                items.append(arr_content[i:end+1])
                i = end + 1
            else:
                i += 1
        else:
            i += 1
    return items

def extract_field_value(obj_str, field_name):
    """Extract a simple field value from an object string."""
    # Pattern: field: 'value' or field: "value" or field: `value`
    pattern = re.compile(
        rf'''\b{field_name}\s*:\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`)''',
        re.DOTALL
    )
    m = pattern.search(obj_str)
    if m:
        val = m.group(1) or m.group(2) or m.group(3) or ''
        val = val.replace("\\'", "'").replace('\\"', '"').replace('\\n', '\n').replace('\\\\', '\\')
        # Handle multiline template literals - normalize whitespace
        val = re.sub(r'\n\s+', ' ', val).strip()
        return val
    return ''

def extract_inline_locale_field(obj_str, field_name, locale):
    """
    Extract ternary-style locale value:
    field: locale === 'he' ? 'val' : locale === 'zh' ? 'val2' : 'default'
    """
    # Try direct field extraction first
    val = extract_field_value(obj_str, field_name)
    if val:
        return val
    return ''

def extract_getinstructions_func(content, locale):
    """
    Extract instructions from a getInstructions(locale) function that uses
    inline ternary expressions like:
    { icon: '🏎️', title: locale === 'he' ? '...' : ... : 'en_default' }
    """
    idx = content.find('function getInstructions')
    if idx == -1:
        return {}
    end = content.find('\n}\n', idx)
    if end == -1:
        return {}
    func_content = content[idx:end+3]

    result = {}

    # Extract instructions array
    instr_match = re.search(r'instructions\s*:\s*\[', func_content)
    if instr_match:
        arr_start = func_content.find('[', instr_match.start())
        arr_end = find_matching_bracket(func_content, arr_start, '[', ']')
        if arr_end != -1:
            arr_content = func_content[arr_start:arr_end+1]
            items = extract_array_objects(arr_content)
            for i, item in enumerate(items):
                icon = extract_ternary_value(item, 'icon', locale)
                title = extract_ternary_value(item, 'title', locale)
                desc = extract_ternary_value(item, 'description', locale)
                if icon:
                    result[f'instructions.step{i}Icon'] = icon
                if title:
                    result[f'instructions.step{i}Title'] = title
                if desc:
                    result[f'instructions.step{i}Desc'] = desc

    # Extract controls array
    ctrl_match = re.search(r'controls\s*:\s*\[', func_content)
    if ctrl_match:
        arr_start = func_content.find('[', ctrl_match.start())
        arr_end = find_matching_bracket(func_content, arr_start, '[', ']')
        if arr_end != -1:
            arr_content = func_content[arr_start:arr_end+1]
            items = extract_array_objects(arr_content)
            for i, item in enumerate(items):
                # Controls use t.key references - extract from translations object
                icon = extract_ternary_value(item, 'icon', locale)
                desc_match = re.search(r'description\s*:\s*t\.(\w+)', item)
                if icon:
                    result[f'instructions.control{i}Icon'] = icon
                if desc_match:
                    # Will be resolved from translations object
                    result[f'instructions.control{i}DescKey'] = desc_match.group(1)

    # Extract tip
    tip_match = re.search(
        r"tip\s*:\s*locale\s*===\s*'he'\s*\?\s*(?:'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)\s*:\s*"
        r"locale\s*===\s*'zh'\s*\?\s*(?:'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)\s*:\s*"
        r"locale\s*===\s*'es'\s*\?\s*(?:'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)\s*:\s*"
        r"(?:'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)",
        func_content
    )
    if tip_match:
        if locale == 'he':
            val = tip_match.group(1) or tip_match.group(2) or ''
        elif locale == 'zh':
            val = tip_match.group(3) or tip_match.group(4) or ''
        elif locale == 'es':
            val = tip_match.group(5) or tip_match.group(6) or ''
        else:  # en
            val = tip_match.group(7) or tip_match.group(8) or ''
        if val:
            result['instructions.tip'] = val.replace("\\'", "'").replace('\\"', '"')

    return result

def extract_ternary_value(item, field, locale):
    """
    Extract value from a ternary expression:
    field: locale === 'he' ? 'val' : locale === 'zh' ? 'val2' : locale === 'es' ? 'val3' : 'en_default'
    """
    # First try direct string
    direct = extract_field_value(item, field)
    if direct:
        return direct

    # Try ternary pattern
    pattern = re.compile(
        rf'''\b{field}\s*:\s*'''
        rf"""locale\s*===\s*'he'\s*\?\s*(?:'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)\s*:\s*"""
        rf"""locale\s*===\s*'zh'\s*\?\s*(?:'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)\s*:\s*"""
        rf"""locale\s*===\s*'es'\s*\?\s*(?:'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)\s*:\s*"""
        rf"""(?:'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)\s*""",
        re.DOTALL
    )
    m = pattern.search(item)
    if m:
        if locale == 'he':
            return (m.group(1) or m.group(2) or '').replace("\\'", "'")
        elif locale == 'zh':
            return (m.group(3) or m.group(4) or '').replace("\\'", "'")
        elif locale == 'es':
            return (m.group(5) or m.group(6) or '').replace("\\'", "'")
        else:  # en
            return (m.group(7) or m.group(8) or '').replace("\\'", "'")
    return ''

# ─── game definitions ─────────────────────────────────────────────────────────

# Games where we extract translations + instructionsData from the TSX
GAME_FILES = {
    'snake':        'src/features/games/snake/SnakeGame.tsx',
    'whackAMole':   'src/features/games/whack-a-mole/WhackAMoleGame.tsx',
    'dinoRun':      'src/features/games/dino-run/DinoRunGame.tsx',
    'towerDefense': 'src/features/games/tower-defense/TowerDefenseGame.tsx',
    'sprintRace':   'src/features/games/sprint-race/SprintRaceGame.tsx',
    'brickBreaker': 'src/features/games/brick-breaker/BrickBreakerGame.tsx',
    'pingPong':     'src/features/games/ping-pong/PingPongGame.tsx',
    'nascarCars':   'src/features/games/nascar-cars/NascarCarsGame.tsx',
    'potionCraft':  'src/features/games/potion-craft/PotionCraftGame.tsx',
    'armyRunner':   'src/features/games/army-runner/ArmyRunnerGame.tsx',
    'tetris':       'src/features/games/tetris/TetrisGame.tsx',
    'flappyBird':   'src/features/games/flappy-bird/FlappyBirdGame.tsx',
    'chickenInvaders': 'src/features/games/chicken-invaders/ChickenInvadersGame.tsx',
    'numberTower3D': 'src/features/games/number-tower-3d/NumberTower3DGame.tsx',
    'shapeSorter3D': 'src/features/games/shape-sorter-3d/ShapeSorter3DGame.tsx',
    'solarSystem3D': 'src/features/games/solar-system-3d/SolarSystem3DGame.tsx',
    'checkers':     'src/features/games/checkers/CheckersGame.tsx',
    'memoryCards':  'src/features/games/memory-cards/MemoryCardsGame.tsx',
}

# Games using getInstructions function (inline ternaries)
GETINSTRUCTIONS_GAMES = {'pingPong', 'nascarCars'}

# Games that only have a title in translations (Phaser)
PHASER_TITLE_GAMES = {
    'sprintRacePhaser': {
        'en': 'Olympic Sprint',
        'he': 'ספרינט אולימפי',
        'zh': '奥运短跑',
        'es': 'Sprint Olímpico',
    },
    'backgammonPhaser': {
        'en': 'Backgammon (Phaser)',
        'he': 'שש בש (פייזר)',
        'zh': '双陆棋 (Phaser)',
        'es': 'Backgammon (Phaser)',
    },
}

# Games that already have complete translation namespaces - only add instructionsData
INSTDATA_ONLY_GAMES = {'checkers', 'memoryCards'}

# Games where we should NOT extract translations (they're already complete and correct)
SKIP_TRANS_GAMES = {'checkers', 'memoryCards'}

def build_namespace_for_locale(namespace, locale, file_path):
    """Build translation namespace dict for a given locale from TSX file."""
    content = open(file_path, encoding='utf-8').read()
    result = {}

    # Extract flat translations object (skip for games that already have complete namespaces)
    if namespace not in SKIP_TRANS_GAMES:
        flat = extract_ts_flat_object(content, 'translations', locale)
        # Remove 'instructions' key if present (it was the old inline string)
        flat.pop('instructions', None)
        result.update(flat)

    # Extract instructionsData
    if namespace in GETINSTRUCTIONS_GAMES:
        instr_flat = extract_getinstructions_func(content, locale)
        # Resolve t.key references for controls
        trans_flat = extract_ts_flat_object(content, 'translations', locale)
        new_instr_flat = {}
        for k, v in instr_flat.items():
            if k.endswith('DescKey'):
                # resolve from translations
                ctrl_idx = k.replace('DescKey', 'Desc')
                real_key = v
                new_instr_flat[ctrl_idx] = trans_flat.get(real_key, real_key)
            else:
                new_instr_flat[k] = v
        result.update(new_instr_flat)
    else:
        instr_flat = extract_instructions_data(content, locale)
        result.update(instr_flat)

    return result

def flatten_to_nested(data):
    """
    Convert a dict with dotted keys like 'instructions.step0Icon'
    into a nested dict structure.
    """
    nested = {}
    for k, v in data.items():
        parts = k.split('.')
        d = nested
        for part in parts[:-1]:
            d = d.setdefault(part, {})
        d[parts[-1]] = v
    return nested

def main():
    print('Reading existing messages...')
    existing = {}
    for locale in LOCALES:
        existing[locale] = read_json(locale)

    for locale in LOCALES:
        print(f'\n--- Processing locale: {locale} ---')
        data = existing[locale]

        # 1. Standard games
        for namespace, file_path in GAME_FILES.items():
            print(f'  {namespace}...', end='')
            try:
                ns_flat = build_namespace_for_locale(namespace, locale, file_path)
                ns_nested = flatten_to_nested(ns_flat)
                if namespace not in data:
                    data[namespace] = {}
                deep_merge(data[namespace], ns_nested)
                print(f' {len(ns_flat)} keys')
            except Exception as e:
                print(f' ERROR: {e}')

        # 2. Phaser title-only games
        for namespace, titles in PHASER_TITLE_GAMES.items():
            print(f'  {namespace} (phaser)...', end='')
            if namespace not in data:
                data[namespace] = {}
            if 'title' not in data[namespace]:
                data[namespace]['title'] = titles[locale]
            print(' 1 key')

        write_json(locale, data)

    print('\n✅ All messages files updated!')

if __name__ == '__main__':
    main()

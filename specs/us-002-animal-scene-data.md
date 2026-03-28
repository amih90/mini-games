# Spec: US-002 — Animal Data, Scene Definitions, and Translations

## Overview
This story creates the complete data layer for Wild Friends — 15 animals across 5 continents, 6 scene definitions, and ~80 UI translation keys in 4 languages. This data drives every scene, challenge, and UI element in the game.

## Detailed Requirements

### animals.ts
Export a `ANIMALS` record keyed by animal ID with this structure per animal:
```typescript
interface AnimalData {
  id: string;                    // e.g., 'lion'
  emoji: string;                 // e.g., '🦁'
  continent: string;             // e.g., 'africa'
  name: Record<string, string>;  // { en: 'Lion', he: 'אריה', zh: '狮子', es: 'León' }
  fact: Record<string, string>;  // Localized fun fact (1 sentence, preschool-friendly)
  challengeType: string;         // e.g., 'soundMatch'
  challengeConfig: object;       // Challenge-specific params
}
```

**15 Animals by continent:**
- Africa: lion, elephant, giraffe
- Amazon: frog, sloth, toucan
- Arctic: penguin, polarBear, seal
- Australia: kangaroo, koala, platypus
- Ocean: dolphin, seaTurtle, blueWhale

### scenes.ts
Export a `SCENES` array ordered by progression:
```typescript
interface SceneData {
  id: string;            // e.g., 'africa'
  order: number;         // 1-5
  continentName: Record<string, string>;
  biomeEmoji: string;    // e.g., '🌍'
  animalIds: string[];   // ['lion', 'elephant', 'giraffe']
  storyIntro: Record<string, string>;  // Kiwi's opening line per locale
  storyOutro: Record<string, string>;  // Kiwi's completion line per locale
}
```

### translations.ts
Export `UI_STRINGS` with these key categories:
- Menu: title, play, difficulty labels, album button
- Gameplay: discover, tapAnimal, great, tryAgain, nextAnimal, sceneComplete
- Kiwi: generic encouragement lines, celebration lines
- Challenges: instruction text for each challenge type
- Hub: explore, collection, completedCount
- Finale: congratulations, worldExplorer, playAgain

## Technical Approach
Use the inline translations pattern (like SnakeGame.tsx) since this is an R3F game, not a next-intl React game. All text accessed via `translations[locale][key]` pattern.

## Constraints
- All Hebrew strings must be valid RTL text
- Chinese translations should use Simplified Chinese (zh-CN)
- Facts must be age-appropriate for 3-5 year olds (simple vocabulary, 1 sentence)
- Challenge configs must match the ChallengeType union defined in types.ts

## Test Scenarios
- All 15 animals have all 4 locale translations
- All scenes have valid animalIds referencing animals that exist
- No missing translation keys in any locale
- TypeScript compiles with strict typing

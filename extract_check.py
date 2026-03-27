import re, os, json

games = [
    ('snake', 'SnakeGame.tsx'),
    ('tetris', 'TetrisGame.tsx'),
    ('whack-a-mole', 'WhackAMoleGame.tsx'),
    ('dino-run', 'DinoRunGame.tsx'),
    ('tower-defense', 'TowerDefenseGame.tsx'),
    ('sprint-race', 'SprintRaceGame.tsx'),
    ('sprint-race-phaser', 'SprintRacePhaserGame.tsx'),
    ('brick-breaker', 'BrickBreakerGame.tsx'),
    ('ping-pong', 'PingPongGame.tsx'),
    ('nascar-cars', 'NascarCarsGame.tsx'),
    ('potion-craft', 'PotionCraftGame.tsx'),
    ('army-runner', 'ArmyRunnerGame.tsx'),
    ('backgammon-phaser', 'BackgammonPhaserGame.tsx'),
    ('flappy-bird', 'FlappyBirdGame.tsx'),
    ('chicken-invaders', 'ChickenInvadersGame.tsx'),
    ('number-tower-3d', 'NumberTower3DGame.tsx'),
    ('shape-sorter-3d', 'ShapeSorter3DGame.tsx'),
    ('solar-system-3d', 'SolarSystem3DGame.tsx'),
    ('checkers', 'CheckersGame.tsx'),
    ('memory-cards', 'MemoryCardsGame.tsx'),
]

for slug, fname in games:
    path = f'src/features/games/{slug}/{fname}'
    if not os.path.exists(path):
        print(f'=== {slug}: FILE NOT FOUND ===')
        continue
    content = open(path).read()
    
    # Find translations block start line
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if 'const translations' in line and '{' in line:
            print(f'=== {slug}: translations starts at line {i+1} ===')
            # Print 5 lines of context
            for j in range(i, min(i+5, len(lines))):
                print(f'  {j+1}: {lines[j]}')
            break
    
    # Check for instructionsData
    for i, line in enumerate(lines):
        if 'const instructionsData' in line or 'function getInstructions' in line:
            print(f'  instructionsData/getInstructions at line {i+1}: {line[:80]}')
            break


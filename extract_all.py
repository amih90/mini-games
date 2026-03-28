import re, os

games = [
    ('snake', 'SnakeGame.tsx', 50),
    ('tetris', 'TetrisGame.tsx', 75),
    ('whack-a-mole', 'WhackAMoleGame.tsx', 93),
    ('dino-run', 'DinoRunGame.tsx', 175),
    ('tower-defense', 'TowerDefenseGame.tsx', 140),
    ('sprint-race', 'SprintRaceGame.tsx', 111),
    ('brick-breaker', 'BrickBreakerGame.tsx', 79),
    ('ping-pong', 'PingPongGame.tsx', 17),
    ('nascar-cars', 'NascarCarsGame.tsx', 22),
    ('potion-craft', 'PotionCraftGame.tsx', 15),
    ('army-runner', 'ArmyRunnerGame.tsx', 15),
    ('flappy-bird', 'FlappyBirdGame.tsx', 85),
    ('chicken-invaders', 'ChickenInvadersGame.tsx', 128),
    ('number-tower-3d', 'NumberTower3DGame.tsx', 53),
    ('shape-sorter-3d', 'ShapeSorter3DGame.tsx', 55),
    ('solar-system-3d', 'SolarSystem3DGame.tsx', 115),
]

for slug, fname, start_line in games:
    path = f'src/features/games/{slug}/{fname}'
    if not os.path.exists(path):
        print(f'=== {slug}: FILE NOT FOUND')
        continue
    lines = open(path).readlines()
    # Print lines from start_line (1-indexed) showing just the english block
    print(f'\n=== {slug} (line {start_line}) ===')
    # Extract from start_line to find the closing of the translations object
    content_from = ''.join(lines[start_line-1:start_line+180])
    # Show first 2500 chars  
    print(content_from[:2500])

'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { GAME_CONSTANTS, GameState } from './usePingPongGame';

const { TABLE_WIDTH, TABLE_DEPTH, TABLE_Y, BALL_RADIUS, PLAYER_Z, AI_Z } = GAME_CONSTANTS;

interface PingPongSceneProps {
  gameStateRef: React.MutableRefObject<GameState>;
  paddleWidth: number;
  paused: boolean;
  gameActive: boolean;
  onPlayerMove: (x: number) => void;
  onFrame: (delta: number) => void;
  playerScoreDisplay: number;
  aiScoreDisplay: number;
  locale: string;
}

// ─── Table Component ─────────────────────────────────────────
function Table() {
  return (
    <group position={[0, 0, 0]}>
      {/* Table surface */}
      <mesh position={[0, TABLE_Y, 0]} receiveShadow>
        <boxGeometry args={[TABLE_WIDTH, 0.15, TABLE_DEPTH]} />
        <meshStandardMaterial color="#1a6b3c" roughness={0.3} />
      </mesh>

      {/* White border lines */}
      {/* Side lines */}
      <mesh position={[TABLE_WIDTH / 2 - 0.05, TABLE_Y + 0.08, 0]}>
        <boxGeometry args={[0.06, 0.01, TABLE_DEPTH - 0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-(TABLE_WIDTH / 2 - 0.05), TABLE_Y + 0.08, 0]}>
        <boxGeometry args={[0.06, 0.01, TABLE_DEPTH - 0.1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* End lines */}
      <mesh position={[0, TABLE_Y + 0.08, TABLE_DEPTH / 2 - 0.05]}>
        <boxGeometry args={[TABLE_WIDTH - 0.1, 0.01, 0.06]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0, TABLE_Y + 0.08, -(TABLE_DEPTH / 2 - 0.05)]}>
        <boxGeometry args={[TABLE_WIDTH - 0.1, 0.01, 0.06]} />
        <meshStandardMaterial color="white" />
      </mesh>
      {/* Center line */}
      <mesh position={[0, TABLE_Y + 0.08, 0]}>
        <boxGeometry args={[TABLE_WIDTH - 0.2, 0.01, 0.04]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.3} />
      </mesh>

      {/* Net */}
      <mesh position={[0, TABLE_Y + 0.2, 0]}>
        <boxGeometry args={[TABLE_WIDTH + 0.4, 0.25, 0.05]} />
        <meshStandardMaterial color="white" transparent opacity={0.85} roughness={0.8} />
      </mesh>
      {/* Net posts */}
      <mesh position={[TABLE_WIDTH / 2 + 0.2, TABLE_Y + 0.15, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
        <meshStandardMaterial color="#666" metalness={0.8} />
      </mesh>
      <mesh position={[-(TABLE_WIDTH / 2 + 0.2), TABLE_Y + 0.15, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />
        <meshStandardMaterial color="#666" metalness={0.8} />
      </mesh>

      {/* Table legs */}
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([xSign, zSign], i) => (
        <mesh key={i} position={[xSign * (TABLE_WIDTH / 2 - 0.3), TABLE_Y / 2 - 0.1, zSign * (TABLE_DEPTH / 2 - 0.4)]}>
          <cylinderGeometry args={[0.08, 0.1, TABLE_Y, 8]} />
          <meshStandardMaterial color="#333" metalness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Paddle Component ────────────────────────────────────────
function Paddle({
  position,
  color,
  width,
}: {
  position: [number, number, number];
  color: string;
  width: number;
}) {
  return (
    <group position={position}>
      <RoundedBox args={[width, 0.12, 0.4]} radius={0.05} smoothness={4} castShadow>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
      </RoundedBox>
      {/* Handle */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.15, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.6} />
      </mesh>
    </group>
  );
}

// ─── Ball Component ──────────────────────────────────────────
function Ball({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
      <meshStandardMaterial
        color="#ff8800"
        emissive="#ff6600"
        emissiveIntensity={0.4}
        roughness={0.2}
        metalness={0.1}
      />
    </mesh>
  );
}

// ─── Score Display ───────────────────────────────────────────
function ScoreDisplay({
  playerScore,
  aiScore,
  locale,
}: {
  playerScore: number;
  aiScore: number;
  locale: string;
}) {
  const labels: Record<string, [string, string]> = {
    en: ['You', 'AI'],
    he: ['אתה', 'מחשב'],
    zh: ['你', '电脑'],
    es: ['Tú', 'IA'],
  };
  const [playerLabel, aiLabel] = labels[locale] || labels.en;

  return (
    <group position={[0, 3, 0]}>
      <Text
        position={[-1.5, 0, 0]}
        fontSize={0.6}
        color="#4fc3f7"
        anchorX="center"
        anchorY="middle"
      >
        {`${playerLabel}: ${playerScore}`}
      </Text>
      <Text
        position={[1.5, 0, 0]}
        fontSize={0.6}
        color="#ef5350"
        anchorX="center"
        anchorY="middle"
      >
        {`${aiLabel}: ${aiScore}`}
      </Text>
    </group>
  );
}

// ─── Floor ───────────────────────────────────────────────────
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#1a1a2e" roughness={0.9} />
    </mesh>
  );
}

// ─── Main Scene ──────────────────────────────────────────────
export function PingPongScene({
  gameStateRef,
  paddleWidth,
  paused,
  gameActive,
  onPlayerMove,
  onFrame,
  playerScoreDisplay,
  aiScoreDisplay,
  locale,
}: PingPongSceneProps) {
  const ballRef = useRef<THREE.Mesh>(null);
  const playerPaddleRef = useRef<THREE.Group>(null);
  const aiPaddleRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // ── Pointer tracking ──
  const handlePointerMove = useCallback(
    (e: THREE.Event & { point: THREE.Vector3 }) => {
      if (!gameActive || paused) return;
      const x = (e.point?.x ?? 0);
      onPlayerMove(x);
    },
    [gameActive, paused, onPlayerMove],
  );

  // ── Keyboard input ──
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysRef.current.add(e.key);
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ── Game loop ──
  useFrame((_, delta) => {
    if (paused || !gameActive) return;

    // Keyboard movement
    const keys = keysRef.current;
    const moveSpeed = 8;
    let playerX = gameStateRef.current.playerX;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
      playerX -= moveSpeed * delta;
    }
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
      playerX += moveSpeed * delta;
    }
    if (keys.has('ArrowLeft') || keys.has('ArrowRight') || keys.has('a') || keys.has('A') || keys.has('d') || keys.has('D')) {
      onPlayerMove(playerX);
    }

    // Update game logic
    onFrame(delta);

    // Sync 3D positions with game state
    const state = gameStateRef.current;
    const ball = state.ballState;

    if (ballRef.current) {
      ballRef.current.position.set(ball.x, ball.y, ball.z);
    }
    if (playerPaddleRef.current) {
      playerPaddleRef.current.position.x = state.playerX;
    }
    if (aiPaddleRef.current) {
      aiPaddleRef.current.position.x = state.aiX;
    }
  });

  return (
    <>
      {/* Background color */}
      <color attach="background" args={['#0d1b2a']} />
      <fog attach="fog" args={['#0d1b2a', 15, 35]} />

      {/* Environment lighting */}
      <pointLight position={[0, 6, 0]} intensity={30} color="#fff5e6" />
      <pointLight position={[-4, 4, -3]} intensity={8} color="#4fc3f7" />
      <pointLight position={[4, 4, 3]} intensity={8} color="#ce93d8" />

      {/* Interactive plane for mouse tracking */}
      <mesh
        position={[0, TABLE_Y + 0.2, PLAYER_Z]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
        onPointerMove={handlePointerMove}
      >
        <planeGeometry args={[viewport.width * 2, viewport.height * 2]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      <Floor />
      <Table />

      {/* Ball */}
      <mesh ref={ballRef} castShadow position={[0, TABLE_Y + 0.5, 0]}>
        <sphereGeometry args={[BALL_RADIUS, 16, 16]} />
        <meshStandardMaterial
          color="#ff8800"
          emissive="#ff6600"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>

      {/* Player paddle */}
      <group ref={playerPaddleRef} position={[0, TABLE_Y + 0.15, PLAYER_Z]}>
        <RoundedBox args={[paddleWidth, 0.12, 0.4]} radius={0.05} smoothness={4} castShadow>
          <meshStandardMaterial color="#4fc3f7" roughness={0.2} metalness={0.1} emissive="#4fc3f7" emissiveIntensity={0.15} />
        </RoundedBox>
      </group>

      {/* AI paddle */}
      <group ref={aiPaddleRef} position={[0, TABLE_Y + 0.15, AI_Z]}>
        <RoundedBox args={[paddleWidth, 0.12, 0.4]} radius={0.05} smoothness={4} castShadow>
          <meshStandardMaterial color="#ef5350" roughness={0.2} metalness={0.1} emissive="#ef5350" emissiveIntensity={0.15} />
        </RoundedBox>
      </group>

      {/* Score display */}
      <ScoreDisplay playerScore={playerScoreDisplay} aiScore={aiScoreDisplay} locale={locale} />


    </>
  );
}

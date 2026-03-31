'use client';

import { Html } from '@react-three/drei';
import { Tank } from '../types';

interface HPBarProps {
  tank: Tank;
  isBattle?: boolean;
}

/** Billboard HP bar rendered as HTML overlay – sits above each tank */
export function HPBar({ tank, isBattle = false }: HPBarProps) {
  if (!tank.isAlive) return null;

  const pct = Math.max(0, tank.hp / tank.maxHp);
  const barColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#eab308' : '#ef4444';

  // Horizontal layout: player on RIGHT (+x), enemy on LEFT (-x)
  // During battle, melee tanks advance to the centre — mirror getTankBattleX logic
  const z = (tank.row - 1) * 1.5;
  const localX = (tank.col - 1.5) * 1.5;
  const armyX = tank.owner === 'player' ? 4.5 : -4.5;
  const x = isBattle && tank.type === 'melee'
    ? (tank.owner === 'player' ? 1.5 + localX * 0.3 : -1.5 + localX * 0.3)
    : armyX + localX;

  return (
    <Html
      position={[x, 1.3, z]}
      center
      distanceFactor={8}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        width: '52px',
        background: 'rgba(0,0,0,0.65)',
        borderRadius: '4px',
        padding: '2px 3px',
        userSelect: 'none',
      }}>
        <div style={{
          width: '100%',
          height: '6px',
          background: '#333',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct * 100}%`,
            height: '100%',
            background: barColor,
            transition: 'width 0.3s ease, background-color 0.3s ease',
            borderRadius: '3px',
          }} />
        </div>
        <div style={{
          textAlign: 'center',
          fontSize: '9px',
          color: '#ddd',
          fontFamily: 'monospace',
          marginTop: '1px',
          lineHeight: 1,
        }}>
          {tank.hp}/{tank.maxHp}
        </div>
      </div>
    </Html>
  );
}

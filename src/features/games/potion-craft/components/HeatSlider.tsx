'use client';

import React from 'react';

interface HeatSliderProps {
  heatLevel: number;
  onChange: (level: number) => void;
  disabled?: boolean;
}

export function HeatSlider({ heatLevel, onChange, disabled }: HeatSliderProps) {
  const percentage = Math.round(heatLevel * 100);

  const gradientColor = heatLevel < 0.3
    ? '#3b82f6'
    : heatLevel < 0.6
      ? '#eab308'
      : heatLevel < 0.85
        ? '#f97316'
        : '#ef4444';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        pointerEvents: disabled ? 'none' : 'auto',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: '12px', color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
        🔥 {percentage}%
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={percentage}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{
          width: '120px',
          accentColor: gradientColor,
          cursor: 'pointer',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '120px' }}>
        <span style={{ fontSize: '10px', color: '#93c5fd' }}>❄️</span>
        <span style={{ fontSize: '10px', color: '#fbbf24' }}>🔥</span>
        <span style={{ fontSize: '10px', color: '#ef4444' }}>🌋</span>
      </div>
    </div>
  );
}

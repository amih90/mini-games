export type ActionSymbol = 'move' | 'attack' | 'defend' | 'wait' | 'heal' | 'revive' | 'train' | 'evolve' | 'rest' | 'bench' | 'play' | 'coin' | 'settings' | 'field' | 'back' | 'help' | 'pause' | 'fire' | 'water' | 'grass' | 'electric' | 'rock' | 'ghost' | 'ice';

export function ActionIcon({ kind }: { kind: ActionSymbol }) {
  const paths: Record<ActionSymbol, React.ReactNode> = {
    move: <><path d="M13 7h11v15l9 7v9H12v-9l4-6z" fill="#bcecff" /><path d="M8 40h29M8 12l-4 5 4 5M4 17h8" /></>,
    attack: <><path d="m12 32 19-23 8-2-1 9-20 23z" fill="#fff3a1" /><path d="m10 27 13 13M7 41l10-10" /></>,
    defend: <><path d="M24 5 7 12v13c1 11 17 18 17 18s16-7 17-18V12z" fill="#92cfff" /><path d="m15 24 6 6 13-14" /></>,
    wait: <><path d="M12 6h24M12 42h24M15 7c0 10 4 11 9 17-5 6-9 8-9 17M33 7c0 10-4 11-9 17 5 6 9 8 9 17" /><path d="m18 35 6-7 6 7z" fill="#ffe686" /></>,
    heal: <g strokeWidth="2"><rect x="16" y="3" width="16" height="7" rx="2" fill="#dbc897" /><path d="M18 10v7l-7 8v16a3 3 0 0 0 3 3h20a3 3 0 0 0 3-3V25l-7-8v-7z" fill="#a7d5cb" /><path d="M14 29h20v11H14z" fill="#64a89a" stroke="none" /><rect x="16" y="23" width="16" height="14" rx="3" fill="#fff6df" /><path d="M24 26v8m-4-4h8" stroke="#bd645b" strokeWidth="3" /><path d="M15 24v-2l5-6" stroke="#e0f0e5" /></g>,
    revive: <><path d="m24 4 6 13 14 2-10 10 3 15-13-7-13 7 3-15L4 19l14-2z" fill="#ffd96d" /><path d="M24 15v17M17 24h14" /></>,
    train: <g strokeWidth="2"><path d="M12 33 8 44m23-11 5 11" stroke="#d7bc84" strokeWidth="4" /><circle cx="23" cy="22" r="17" fill="#e9d8af" /><circle cx="23" cy="22" r="12" fill="#b46d58" /><circle cx="23" cy="22" r="7" fill="#f7e9c9" /><circle cx="23" cy="22" r="3" fill="#b46d58" stroke="none" /><path d="m23 22 17-15" stroke="#f2e1af" strokeWidth="3" /><path d="m34 6 8-2-1 8-7 1z" fill="#86b3a2" /><path d="m4 7 2-4 2 4 4 2-4 2-2 4-2-4-3-2z" fill="#f3d99a" stroke="none" /></g>,
    evolve: <><path d="M8 31c0-17 29-20 30-5M32 18l6 8 5-9" stroke="#dac593" /><path d="m16 19 5 10 11 2-8 8 2 10-10-5-9 5 2-10-8-8 11-2z" fill="#dac593" transform="translate(6 -8)" /></>,
    rest: <g strokeWidth="2"><path d="M4 42h40" stroke="#7ca793" strokeWidth="4" /><path d="M21 5 3 39h40L25 5z" fill="#d6bd85" /><path d="m23 17 10 22H13z" fill="#577b6c" /><path d="M23 17v22" stroke="#ede0b7" /><path d="m23 8-8 19" stroke="#ead8ac" /><circle cx="37" cy="12" r="10" fill="#e5efe0" /><path d="M32 9c-4-4-8 2 5 9 13-7 9-13 5-9l-5 4z" fill="#b86d61" stroke="none" /><path d="M37 7v8m-4-4h8" stroke="#b86d61" strokeWidth="3" /></g>,
    bench: <g strokeWidth="2"><path d="M11 20V9m25 11V9" stroke="#798883" strokeWidth="4" /><rect x="6" y="8" width="36" height="7" rx="2" fill="#ceab76" /><rect x="6" y="17" width="36" height="7" rx="2" fill="#ceab76" /><path d="M4 28h40l-3 7H7z" fill="#e0bf87" /><path d="M10 35v9m28-9v9" stroke="#a4b1a5" strokeWidth="4" /><path d="M10 11h28M10 20h28M9 31h30" stroke="#f0d5a5" strokeWidth="1" /></g>,
    play: <path d="m14 7 26 17-26 17z" fill="#b8f2a3" />,
    coin: <><circle cx="24" cy="24" r="18" fill="#ffe083" /><path d="M24 11v26M30 16H20c-7 0-7 8 0 8h8c7 0 7 8 0 8H17" /></>,
    settings: <><path d="m19 5-2 8-7-1-5 9 6 6-2 8 10 6 6-5 8 2 7-9-4-7 2-8-10-6z" fill="#c1d9eb" /><circle cx="24" cy="24" r="7" fill="#4c7186" /></>,
    field: <><rect x="5" y="5" width="38" height="38" rx="6" fill="#b6e4fc" /><path d="M18 5v38M31 5v38M5 18h38M5 31h38" /></>,
    back: <path d="m22 9-16 15 16 15M7 24h34" />,
    help: <><circle cx="24" cy="24" r="19" fill="#d6c1ff" /><path d="M17 17c0-9 16-9 16 0 0 7-9 5-9 13M24 35v1" /></>,
    pause: <><rect x="11" y="7" width="9" height="34" rx="3" fill="#ffe19a" /><rect x="28" y="7" width="9" height="34" rx="3" fill="#ffe19a" /></>,
    fire: <><path d="M24 3c5 13 15 14 15 26 0 20-30 20-30 0 0-7 5-11 7-15l3 7c6-5 7-10 5-18z" fill="#ff8549" /><path d="M24 23c-15 17 13 22 9 8" fill="#fff48c" /></>,
    water: <path d="M24 3C20 12 8 22 8 30c0 19 32 19 32 0C40 22 28 12 24 3z" fill="#9fefff" />,
    grass: <><path d="M41 6C6 2 3 37 18 40 38 42 42 22 41 6z" fill="#b6f28c" /><path d="m9 44 25-28M20 33l-1-11M25 28l11 1" /></>,
    electric: <path d="m29 3-20 25h14l-4 17 20-26H25z" fill="#fff49b" />,
    rock: <><path d="m12 10 22 1 10 21-10 10H10L4 28z" fill="#dcc7a8" /><path d="m12 10 5 20-7 12M17 30l16-5 11 7M33 25l1-14" /></>,
    ghost: <><path d="M8 41V22C8 0 40 0 40 22v19l-8-6-8 6-8-6z" fill="#e0c6ff" /><circle cx="18" cy="21" r="3" fill="#24394f" /><circle cx="30" cy="21" r="3" fill="#24394f" /><path d="M20 30h8" /></>,
    ice: <><path d="M24 4v40M7 14l34 20M7 34l34-20M17 8l7 6 7-6M17 40l7-6 7 6M6 22l9-3-1-9M42 26l-9 3 1 9M14 38l1-9-9-3M34 10l-1 9 9 3" stroke="#d1f7ff" strokeWidth="4" /></>,
  };
  return <svg viewBox="0 0 48 48" fill="none" stroke="#24394f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

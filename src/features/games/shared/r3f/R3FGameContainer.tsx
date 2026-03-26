'use client';

import { ReactNode, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

interface R3FGameContainerProps {
  children: ReactNode;
  className?: string;
  camera?: {
    position?: [number, number, number];
    fov?: number;
    near?: number;
    far?: number;
  };
}

// Check WebGL support once and cache the result
let webGLSupported: boolean | null = null;
function isWebGLSupported(): boolean {
  if (webGLSupported !== null) return webGLSupported;
  if (typeof window === 'undefined') return true;
  try {
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
    if (gl) {
      // Release the test context immediately
      const loseExt = gl.getExtension('WEBGL_lose_context');
      if (loseExt) loseExt.loseContext();
    }
    webGLSupported = !!gl;
  } catch {
    webGLSupported = false;
  }
  return webGLSupported;
}

function WebGLFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
      <div className="text-center p-8">
        <div className="text-5xl mb-4">😔</div>
        <p className="text-xl font-bold text-slate-700 mb-2">3D Not Supported</p>
        <p className="text-slate-500">Your browser doesn&apos;t support WebGL 3D games.</p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🎮</div>
        <p className="text-xl font-bold text-slate-600">Loading 3D...</p>
      </div>
    </div>
  );
}

/**
 * Reusable React Three Fiber canvas wrapper.
 * Manages Canvas lifecycle, responsive sizing, default camera/lights, and WebGL fallback.
 */
export function R3FGameContainer({
  children,
  className = '',
  camera = { position: [0, 8, 12], fov: 50 },
}: R3FGameContainerProps) {
  if (!isWebGLSupported()) return <WebGLFallback />;

  return (
    <div className={`w-full aspect-[4/3] max-w-[800px] mx-auto ${className}`}>
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{
            position: camera.position,
            fov: camera.fov ?? 50,
            near: camera.near ?? 0.1,
            far: camera.far ?? 1000,
          }}
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          style={{ borderRadius: '0.75rem' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          {children}
        </Canvas>
      </Suspense>
    </div>
  );
}

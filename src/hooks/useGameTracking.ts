'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { trackGameComplete, event } from '@/lib/gtag';

function useGameSlug(): string | undefined {
  const pathname = usePathname();
  const segments = pathname.split('/');
  const gamesIdx = segments.indexOf('games');
  return gamesIdx !== -1 ? segments[gamesIdx + 1] : undefined;
}

export function useGameTracking() {
  const slug = useGameSlug();

  const trackComplete = useCallback(
    (score?: number) => {
      if (slug) trackGameComplete(slug, score);
    },
    [slug]
  );

  const trackEvent = useCallback(
    (action: string, label?: string) => {
      if (slug) {
        event({
          action,
          category: 'games',
          label: label ?? slug,
        });
      }
    },
    [slug]
  );

  return { slug, trackComplete, trackEvent };
}

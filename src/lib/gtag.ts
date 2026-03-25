export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export function pageview(url: string) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

type GTagEvent = {
  action: string;
  category: string;
  label?: string;
  value?: number;
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export function event({ action, category, label, value }: GTagEvent) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// Track when a game is started/loaded
export function trackGamePlay(gameSlug: string) {
  event({
    action: 'game_play',
    category: 'games',
    label: gameSlug,
  });
}

// Track game difficulty selection
export function trackDifficultySelect(gameSlug: string, difficulty: string) {
  event({
    action: 'select_difficulty',
    category: 'games',
    label: `${gameSlug}:${difficulty}`,
  });
}

// Track game completion
export function trackGameComplete(gameSlug: string, score?: number) {
  event({
    action: 'game_complete',
    category: 'games',
    label: gameSlug,
    value: score,
  });
}

// Track locale/language changes
export function trackLocaleChange(locale: string) {
  event({
    action: 'change_locale',
    category: 'engagement',
    label: locale,
  });
}

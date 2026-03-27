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

// Track when a game is started/loaded — sends game_slug as a custom parameter
// so GA4 can break down reports by individual game.
// Register "game_slug" as a custom dimension in GA4 Admin > Custom definitions.
export function trackGamePlay(gameSlug: string) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('event', 'game_play', {
    event_category: 'games',
    event_label: gameSlug,
    game_slug: gameSlug,
  });
}

// Track how long a user spent in a game (fired on exit/unmount)
export function trackGameSession(gameSlug: string, durationSeconds: number) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('event', 'game_session', {
    event_category: 'games',
    event_label: gameSlug,
    game_slug: gameSlug,
    duration_seconds: Math.round(durationSeconds),
    value: Math.round(durationSeconds),
  });
}

// Track game completion
export function trackGameComplete(gameSlug: string, score?: number) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('event', 'game_complete', {
    event_category: 'games',
    event_label: gameSlug,
    game_slug: gameSlug,
    value: score,
  });
}

// Track game card click on listing page
export function trackGameCardClick(gameSlug: string) {
  if (!GA_MEASUREMENT_ID) return;
  window.gtag('event', 'game_card_click', {
    event_category: 'games',
    event_label: gameSlug,
    game_slug: gameSlug,
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

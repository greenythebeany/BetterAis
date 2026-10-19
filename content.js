// Runs at document_start, before <body> exists, so the theme has to land on <html>.
// Preferences are read synchronously from localStorage first (instant, zero flash),
// then reconciled against chrome.storage.local (source of truth) shortly after.
(function () {
  'use strict';

  const root = document.documentElement;
  const DEFAULT_THEME = 'light';
  const DEFAULT_LINK = '#7a1030'; // STU's own heritage maroon
  const DEFAULT_FORCED = ''; // empty = no preset, use theme+linkColor below
  // Dark-mode schedule: off by default, 22:00 -> 06:00 when switched on.
  const DEFAULT_SCHEDULE = { enabled: false, start: '22:00', end: '06:00' };
  const CACHE_THEME_KEY = 'betterais:theme';
  const CACHE_LINK_KEY = 'betterais:linkColor';
  const CACHE_FORCED_KEY = 'betterais:forcedTheme';
  const CACHE_SCHEDULE_KEY = 'betterais:schedule';
  // Presets whose background is light enough to need the light-mode branch
  // (logo inversion, etc.) - see apply() below for why this matters.
  const LIGHT_PRESETS = new Set(['catppuccin-latte', 'gruvbox-light', 'solarized-light', 'rose-pine-dawn']);

  function apply(theme, linkColor, forcedTheme) {
    // Not every themed thing in style.css reads the --bg/--surface/etc
    // variables themes.css overrides - a few (the header logo's invert
    // filter, for one) are keyed directly off this light-mode/dark-mode
    // class instead, because they're not colors so much as "which asset
    // variant to show." A preset's own light/dark-ness has to drive this
    // class too, or those few things stay stuck on whatever the last manual
    // dark/light pick was - e.g. a dark preset chosen while in light mode
    // left the logo inverted to black on a now-dark background.
    const isLight = forcedTheme ? LIGHT_PRESETS.has(forcedTheme) : theme === 'light';
    root.classList.remove('dark-mode', 'light-mode');
    root.classList.add(isLight ? 'light-mode' : 'dark-mode');
    // --link-raw is the user's exact chosen color, unmodified - style.css
    // derives the theme-facing --link from it (lightened in dark mode, kept
    // as-is in light mode) so accent text stays legible against a dark
    // surface without needing every individual rule touched.
    root.style.setProperty('--link-raw', linkColor);
    // A preset theme (themes.css) overrides --bg/--surface/--ink/--link/etc
    // via html[data-theme="<slug>"] - setting or clearing this attribute is
    // the only thing needed to switch a preset on/off, since that file's
    // bridge rule reads from whichever preset block matched.
    if (forcedTheme) {
      root.setAttribute('data-theme', forcedTheme);
    } else {
      root.removeAttribute('data-theme');
    }
  }

  // "HH:MM" -> minutes since midnight, or null if malformed.
  function toMinutes(hhmm) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  // True when `now` falls in [start, end). A window whose end is earlier
  // than its start wraps past midnight (22:00 -> 06:00). start === end is
  // treated as an empty window rather than "always dark".
  function inDarkWindow(schedule, now) {
    const start = toMinutes(schedule.start);
    const end = toMinutes(schedule.end);
    if (start === null || end === null || start === end) return false;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return start < end
      ? minutes >= start && minutes < end
      : minutes >= start || minutes < end;
  }

  // The schedule only decides dark vs light; an active preset still wins
  // over both in apply(), same as it does over a manual pick.
  function effectiveTheme(theme, schedule) {
    if (!schedule.enabled) return theme;
    return inDarkWindow(schedule, new Date()) ? 'dark' : 'light';
  }

  function cache(theme, linkColor, forcedTheme, schedule) {
    try {
      localStorage.setItem(CACHE_THEME_KEY, theme);
      localStorage.setItem(CACHE_LINK_KEY, linkColor);
      localStorage.setItem(CACHE_FORCED_KEY, forcedTheme);
      localStorage.setItem(CACHE_SCHEDULE_KEY, JSON.stringify(schedule));
    } catch (_) {
      // localStorage unavailable (private mode, quota, etc.) - not fatal
    }
  }

  function normalizeSchedule(value) {
    return Object.assign({}, DEFAULT_SCHEDULE, value || {});
  }

  let theme = DEFAULT_THEME;
  let linkColor = DEFAULT_LINK;
  let forcedTheme = DEFAULT_FORCED;
  let schedule = DEFAULT_SCHEDULE;
  try {
    theme = localStorage.getItem(CACHE_THEME_KEY) || DEFAULT_THEME;
    linkColor = localStorage.getItem(CACHE_LINK_KEY) || DEFAULT_LINK;
    forcedTheme = localStorage.getItem(CACHE_FORCED_KEY) || DEFAULT_FORCED;
    schedule = normalizeSchedule(JSON.parse(localStorage.getItem(CACHE_SCHEDULE_KEY)));
  } catch (_) {
    // fall back to defaults below
  }

  function render() {
    apply(effectiveTheme(theme, schedule), linkColor, forcedTheme);
  }

  // A tab left open across 22:00 / 06:00 should flip on its own. Checking
  // once a minute is cheap and, unlike a single long setTimeout to the next
  // boundary, survives sleep/hibernate and system clock changes.
  let scheduleTimer = null;
  function syncScheduleTimer() {
    if (schedule.enabled && !scheduleTimer) {
      scheduleTimer = setInterval(render, 60 * 1000);
    } else if (!schedule.enabled && scheduleTimer) {
      clearInterval(scheduleTimer);
      scheduleTimer = null;
    }
  }
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && schedule.enabled) render();
  });

  // One-off cleanup after the removed UA/RU translation feature: its stale
  // language pick and per-page translation caches.
  chrome.storage.local.remove('language');
  try {
    Object.keys(localStorage)
      .filter((key) => key === 'betterais:language' || key.startsWith('betterais:tcache:'))
      .forEach((key) => localStorage.removeItem(key));
  } catch (_) {
    // localStorage unavailable - nothing to clean
  }

  // Paints immediately, before Chrome's storage round-trip resolves.
  render();
  syncScheduleTimer();

  chrome.storage.local.get(['theme', 'linkColor', 'forcedTheme', 'schedule'], (data) => {
    theme = data.theme || DEFAULT_THEME;
    linkColor = data.linkColor || DEFAULT_LINK;
    forcedTheme = data.forcedTheme || DEFAULT_FORCED;
    schedule = normalizeSchedule(data.schedule);
    render();
    syncScheduleTimer();
    cache(theme, linkColor, forcedTheme, schedule);
  });

  chrome.runtime.onMessage.addListener((message) => {
    theme = message.theme || theme;
    linkColor = message.linkColor || linkColor;
    forcedTheme = message.forcedTheme === undefined ? forcedTheme : message.forcedTheme;
    if (message.schedule) schedule = normalizeSchedule(message.schedule);
    render();
    syncScheduleTimer();
    cache(theme, linkColor, forcedTheme, schedule);
  });
})();

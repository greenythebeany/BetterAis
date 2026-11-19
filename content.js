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
  // Interface style: 'default' (flat intranet) or 'nothing' (Nothing OS look,
  // same system as BeanyDrive/Triptych - see nothing.css).
  const DEFAULT_STYLE = 'default';
  const CACHE_THEME_KEY = 'betterais:theme';
  const CACHE_LINK_KEY = 'betterais:linkColor';
  const CACHE_FORCED_KEY = 'betterais:forcedTheme';
  const CACHE_SCHEDULE_KEY = 'betterais:schedule';
  const CACHE_STYLE_KEY = 'betterais:uiStyle';
  // Animácie switch (popup): on by default, even with OS reduced motion
  const CACHE_MOTION_KEY = 'betterais:animations';
  let animations = true;
  try {
    animations = localStorage.getItem(CACHE_MOTION_KEY) !== 'false';
  } catch (_) {
    // keep the default
  }
  function applyMotion() {
    root.setAttribute('data-motion', animations ? 'on' : 'off');
    try {
      localStorage.setItem(CACHE_MOTION_KEY, String(animations));
    } catch (_) {
      // not fatal
    }
  }
  applyMotion();
  // Presets whose background is light enough to need the light-mode branch
  // (logo inversion, etc.) - see apply() below for why this matters.
  const LIGHT_PRESETS = new Set(['catppuccin-latte', 'gruvbox-light', 'solarized-light', 'rose-pine-dawn']);

  // Content-script CSS can't point url() at extension files, so the Nothing
  // style's fonts (Doto, Space Mono - fonts/, SIL OFL) are declared here with
  // runtime URLs, once, the first time the style is switched on.
  let fontsInjected = false;
  function injectNothingFonts() {
    if (fontsInjected) return;
    fontsInjected = true;
    const url = (file) => chrome.runtime.getURL(`fonts/${file}`);
    const face = (family, weight, file, range) =>
      `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;` +
      `src:url(${url(file)}) format('woff2');unicode-range:${range};}`;
    const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
    const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
    const style = document.createElement('style');
    style.id = 'betterais-nothing-fonts';
    style.textContent =
      face('Doto', 700, 'doto-latin-700-normal.woff2', LATIN) +
      face('Doto', 700, 'doto-latin-ext-700-normal.woff2', LATIN_EXT) +
      face('Space Mono', 400, 'space-mono-latin-400-normal.woff2', LATIN) +
      face('Space Mono', 400, 'space-mono-latin-ext-400-normal.woff2', LATIN_EXT) +
      face('Space Mono', 700, 'space-mono-latin-700-normal.woff2', LATIN);
    (document.head || document.documentElement).appendChild(style);
  }

  function apply(theme, linkColor, forcedTheme, uiStyle) {
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
    if (uiStyle === 'nothing') {
      root.setAttribute('data-ui', 'nothing');
      injectNothingFonts();
    } else {
      root.removeAttribute('data-ui');
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

  function cache(theme, linkColor, forcedTheme, schedule, uiStyle) {
    try {
      localStorage.setItem(CACHE_STYLE_KEY, uiStyle);
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
  let uiStyle = DEFAULT_STYLE;
  try {
    uiStyle = localStorage.getItem(CACHE_STYLE_KEY) || DEFAULT_STYLE;
    theme = localStorage.getItem(CACHE_THEME_KEY) || DEFAULT_THEME;
    linkColor = localStorage.getItem(CACHE_LINK_KEY) || DEFAULT_LINK;
    forcedTheme = localStorage.getItem(CACHE_FORCED_KEY) || DEFAULT_FORCED;
    schedule = normalizeSchedule(JSON.parse(localStorage.getItem(CACHE_SCHEDULE_KEY)));
  } catch (_) {
    // fall back to defaults below
  }

  function render() {
    apply(effectiveTheme(theme, schedule), linkColor, forcedTheme, uiStyle);
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

  chrome.storage.local.get(['theme', 'linkColor', 'forcedTheme', 'schedule', 'uiStyle', 'animations'], (data) => {
    animations = data.animations !== false;
    applyMotion();
    theme = data.theme || DEFAULT_THEME;
    linkColor = data.linkColor || DEFAULT_LINK;
    forcedTheme = data.forcedTheme || DEFAULT_FORCED;
    schedule = normalizeSchedule(data.schedule);
    uiStyle = data.uiStyle || DEFAULT_STYLE;
    render();
    syncScheduleTimer();
    cache(theme, linkColor, forcedTheme, schedule, uiStyle);
  });

  chrome.runtime.onMessage.addListener((message) => {
    theme = message.theme || theme;
    linkColor = message.linkColor || linkColor;
    forcedTheme = message.forcedTheme === undefined ? forcedTheme : message.forcedTheme;
    if (message.schedule) schedule = normalizeSchedule(message.schedule);
    if (message.uiStyle) uiStyle = message.uiStyle;
    if (typeof message.animations === 'boolean') {
      animations = message.animations;
      applyMotion();
    }
    render();
    syncScheduleTimer();
    cache(theme, linkColor, forcedTheme, schedule, uiStyle);
  });
})();

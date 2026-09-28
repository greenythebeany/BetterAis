// Runs at document_start, before <body> exists, so the theme has to land on <html>.
// Preferences are read synchronously from localStorage first (instant, zero flash),
// then reconciled against chrome.storage.local (source of truth) shortly after.
(function () {
  'use strict';

  const root = document.documentElement;
  const DEFAULT_THEME = 'light';
  const DEFAULT_LINK = '#7a1030'; // STU's own heritage maroon
  const DEFAULT_FORCED = ''; // empty = no preset, use theme+linkColor below
  const CACHE_THEME_KEY = 'betterais:theme';
  const CACHE_LINK_KEY = 'betterais:linkColor';
  const CACHE_FORCED_KEY = 'betterais:forcedTheme';
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

  function cache(theme, linkColor, forcedTheme) {
    try {
      localStorage.setItem(CACHE_THEME_KEY, theme);
      localStorage.setItem(CACHE_LINK_KEY, linkColor);
      localStorage.setItem(CACHE_FORCED_KEY, forcedTheme);
    } catch (_) {
      // localStorage unavailable (private mode, quota, etc.) - not fatal
    }
  }

  let theme = DEFAULT_THEME;
  let linkColor = DEFAULT_LINK;
  let forcedTheme = DEFAULT_FORCED;
  try {
    theme = localStorage.getItem(CACHE_THEME_KEY) || DEFAULT_THEME;
    linkColor = localStorage.getItem(CACHE_LINK_KEY) || DEFAULT_LINK;
    forcedTheme = localStorage.getItem(CACHE_FORCED_KEY) || DEFAULT_FORCED;
  } catch (_) {
    // fall back to defaults below
  }

  // Paints immediately, before Chrome's storage round-trip resolves.
  apply(theme, linkColor, forcedTheme);

  chrome.storage.local.get(['theme', 'linkColor', 'forcedTheme'], (data) => {
    const storedTheme = data.theme || DEFAULT_THEME;
    const storedLink = data.linkColor || DEFAULT_LINK;
    const storedForced = data.forcedTheme || DEFAULT_FORCED;
    if (storedTheme !== theme || storedLink !== linkColor || storedForced !== forcedTheme) {
      apply(storedTheme, storedLink, storedForced);
    }
    theme = storedTheme;
    linkColor = storedLink;
    forcedTheme = storedForced;
    cache(storedTheme, storedLink, storedForced);
  });

  chrome.runtime.onMessage.addListener((message) => {
    const nextTheme = message.theme || theme;
    const nextLink = message.linkColor || linkColor;
    const nextForced = message.forcedTheme === undefined ? forcedTheme : message.forcedTheme;
    apply(nextTheme, nextLink, nextForced);
    theme = nextTheme;
    linkColor = nextLink;
    forcedTheme = nextForced;
    cache(nextTheme, nextLink, nextForced);
  });
})();

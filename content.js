// Runs at document_start, before <body> exists, so the theme has to land on <html>.
// Preferences are read synchronously from localStorage first (instant, zero flash),
// then reconciled against chrome.storage.local (source of truth) shortly after.
(function () {
  'use strict';

  const root = document.documentElement;
  const DEFAULT_THEME = 'light';
  const DEFAULT_LINK = '#7a1030'; // STU's own heritage maroon
  const CACHE_THEME_KEY = 'betterais:theme';
  const CACHE_LINK_KEY = 'betterais:linkColor';

  function apply(theme, linkColor) {
    root.classList.remove('dark-mode', 'light-mode');
    root.classList.add(theme === 'light' ? 'light-mode' : 'dark-mode');
    // --link-raw is the user's exact chosen color, unmodified - style.css
    // derives the theme-facing --link from it (lightened in dark mode, kept
    // as-is in light mode) so accent text stays legible against a dark
    // surface without needing every individual rule touched.
    root.style.setProperty('--link-raw', linkColor);
  }

  function cache(theme, linkColor) {
    try {
      localStorage.setItem(CACHE_THEME_KEY, theme);
      localStorage.setItem(CACHE_LINK_KEY, linkColor);
    } catch (_) {
      // localStorage unavailable (private mode, quota, etc.) - not fatal
    }
  }

  let theme = DEFAULT_THEME;
  let linkColor = DEFAULT_LINK;
  try {
    theme = localStorage.getItem(CACHE_THEME_KEY) || DEFAULT_THEME;
    linkColor = localStorage.getItem(CACHE_LINK_KEY) || DEFAULT_LINK;
  } catch (_) {
    // fall back to defaults below
  }

  // Paints immediately, before Chrome's storage round-trip resolves.
  apply(theme, linkColor);

  chrome.storage.local.get(['theme', 'linkColor'], (data) => {
    const storedTheme = data.theme || DEFAULT_THEME;
    const storedLink = data.linkColor || DEFAULT_LINK;
    if (storedTheme !== theme || storedLink !== linkColor) {
      apply(storedTheme, storedLink);
    }
    theme = storedTheme;
    linkColor = storedLink;
    cache(storedTheme, storedLink);
  });

  chrome.runtime.onMessage.addListener((message) => {
    const nextTheme = message.theme || theme;
    const nextLink = message.linkColor || linkColor;
    apply(nextTheme, nextLink);
    theme = nextTheme;
    linkColor = nextLink;
    cache(nextTheme, nextLink);
  });
})();

// Strings for BetterAis's own UI (popup + things injected into AIS pages).
// AIS's own content stays in whatever language the site is set to - this
// only covers text the extension itself adds. Loaded as a plain script by
// popup.html and listed before timetable.js in the manifest, so both see
// the same global.
(function (global) {
  'use strict';

  const LANGUAGES = ['sk', 'cs', 'en'];
  const FALLBACK = 'en';

  const STRINGS = {
    en: {
      brandSub: 'for is.stuba.sk',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      scheduleLabel: 'Dark mode on a schedule',
      scheduleFrom: 'From',
      scheduleTo: 'To',
      scheduleHint: 'Dark from {start} to {end}, light otherwise. Now: {now}.',
      scheduleSame: 'Start and end are the same - dark mode never turns on.',
      accent: 'Accent color',
      presets: 'Preset themes',
      presetNone: 'None',
      language: 'Language',
      languageAuto: 'Auto',
      reload: 'Apply & reload page',
      footer: 'applies instantly — no flash on reload',
      icsButton: 'Export to calendar (.ics)',
      icsLoading: 'Loading timetable…',
      icsEmpty: 'No events found in the timetable.',
      icsDone: 'Done - {count} events. Open the file in Google, Apple or Outlook calendar.',
      icsError: 'Export failed ({error}).',
      icsCalendarName: 'STU timetable',
      credits: 'Credits & licenses',
    },
    sk: {
      brandSub: 'pre is.stuba.sk',
      theme: 'Téma',
      dark: 'Tmavá',
      light: 'Svetlá',
      scheduleLabel: 'Tmavý režim podľa času',
      scheduleFrom: 'Od',
      scheduleTo: 'Do',
      scheduleHint: 'Tmavá od {start} do {end}, inak svetlá. Teraz: {now}.',
      scheduleSame: 'Začiatok a koniec sú rovnaké – tmavý režim sa nezapne.',
      accent: 'Farba zvýraznenia',
      presets: 'Prednastavené témy',
      presetNone: 'Žiadna',
      language: 'Jazyk',
      languageAuto: 'Auto',
      reload: 'Použiť a obnoviť stránku',
      footer: 'prejaví sa okamžite — bez blikania pri načítaní',
      icsButton: 'Exportovať do kalendára (.ics)',
      icsLoading: 'Načítavam rozvrh…',
      icsEmpty: 'V rozvrhu sa nenašli žiadne akcie.',
      icsDone: 'Hotovo – {count} udalostí. Otvorte súbor v kalendári Google, Apple alebo Outlook.',
      icsError: 'Export zlyhal ({error}).',
      icsCalendarName: 'Rozvrh STU',
      credits: 'Zdroje a licencie',
    },
    cs: {
      brandSub: 'pro is.stuba.sk',
      theme: 'Motiv',
      dark: 'Tmavý',
      light: 'Světlý',
      scheduleLabel: 'Tmavý režim podle času',
      scheduleFrom: 'Od',
      scheduleTo: 'Do',
      scheduleHint: 'Tmavý od {start} do {end}, jinak světlý. Teď: {now}.',
      scheduleSame: 'Začátek a konec jsou stejné – tmavý režim se nezapne.',
      accent: 'Barva zvýraznění',
      presets: 'Přednastavené motivy',
      presetNone: 'Žádný',
      language: 'Jazyk',
      languageAuto: 'Auto',
      reload: 'Použít a obnovit stránku',
      footer: 'projeví se okamžitě — bez blikání při načítání',
      icsButton: 'Exportovat do kalendáře (.ics)',
      icsLoading: 'Načítám rozvrh…',
      icsEmpty: 'V rozvrhu nebyly nalezeny žádné akce.',
      icsDone: 'Hotovo – {count} událostí. Otevřete soubor v kalendáři Google, Apple nebo Outlook.',
      icsError: 'Export selhal ({error}).',
      icsCalendarName: 'Rozvrh STU',
      credits: 'Zdroje a licence',
    },
  };

  // Language AIS rendered the current page in, or null off-AIS (popup).
  // The URL usually says (AIS separates params with ';'); otherwise AIS only
  // shows flags for the languages you're NOT in, so the missing one is it.
  function pageLanguage() {
    if (typeof document === 'undefined' || !/(^|\.)stuba\.sk$/.test(location.hostname)) return null;
    const pattern = /[?;&]lang=(sk|en|cz)\b/;
    const fromUrl = pattern.exec(location.href);
    if (fromUrl) return fromUrl[1];
    const offered = new Set(Array.from(document.querySelectorAll('#vlajky a'))
      .map((a) => (pattern.exec(a.getAttribute('href') || '') || [])[1])
      .filter(Boolean));
    if (!offered.size) return null;
    return ['sk', 'en', 'cz'].find((lang) => !offered.has(lang)) || null;
  }

  // 'auto' (or anything unknown) follows the AIS page's language when there
  // is one - an English AIS gets an English button, a Czech one a Czech
  // button - and the browser's UI language otherwise.
  function resolve(setting) {
    if (LANGUAGES.includes(setting)) return setting;
    const page = pageLanguage();
    if (page) return { sk: 'sk', cz: 'cs', en: 'en' }[page];
    const browser = (navigator.language || '').toLowerCase().slice(0, 2);
    return LANGUAGES.includes(browser) ? browser : FALLBACK;
  }

  // t('scheduleHint', { start: '22:00' }) - unknown keys fall back to
  // English, then to the key itself, so a missing string is visible
  // rather than blank.
  function translator(lang) {
    const table = STRINGS[lang] || STRINGS[FALLBACK];
    return function t(key, vars) {
      const template = table[key] || STRINGS[FALLBACK][key] || key;
      return template.replace(/\{(\w+)\}/g, (match, name) => (vars && name in vars ? vars[name] : match));
    };
  }

  global.BetterAisI18n = { LANGUAGES, resolve, translator };
})(typeof window !== 'undefined' ? window : globalThis);

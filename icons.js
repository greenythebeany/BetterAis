// Replaces the site's mixed icon systems (a .uf-icon SVG sprite for
// breadcrumb/alerts, a separate menitka.svg sprite for section cards) with
// a single consistent set - Tabler Icons (MIT, github.com/tabler/tabler-icons).
// Runs after DOMContentLoaded (icons don't exist yet at document_start),
// plus a light MutationObserver since some sections are built by the site's
// own JS (menitka.js) slightly after initial load.
(function () {
  'use strict';

  // Filled/solid variants (Tabler Icons "filled" set) - matches the flat
  // modern intranet direction better than thin outline strokes. A few icons
  // have no filled original in the set, substituted with a close filled
  // equivalent: cake->gift, devices->device-desktop, logout->square-arrow-right,
  // notebook->book, notes->clipboard-text, user-x->shield.
  const ICONS = {
    home: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.707 2.293l9 9c.63 .63 .184 1.707 -.707 1.707h-1v6a3 3 0 0 1 -3 3h-1v-7a3 3 0 0 0 -2.824 -2.995l-.176 -.005h-2a3 3 0 0 0 -3 3v7h-1a3 3 0 0 1 -3 -3v-6h-1c-.89 0 -1.337 -1.077 -.707 -1.707l9 -9a1 1 0 0 1 1.414 0m.293 11.707a1 1 0 0 1 1 1v7h-4v-7a1 1 0 0 1 .883 -.993l.117 -.007z"/></svg>',
    help: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3.34a10 10 0 1 1 -10 17.32a10 10 0 0 1 10 -17.32m-5 12.66a1 1 0 0 0 -.993 .883l-.007 .127a1 1 0 0 0 1.993 .117l.007 -.127a1 1 0 0 0 -1 -1m1.173 -9.856a3.6 3.6 0 0 0 -3.97 1.252a1 1 0 0 0 1.512 1.304l.082 -.096a1.6 1.6 0 1 1 1.846 2.462a2.49 2.49 0 0 0 -1.641 2.49a1 1 0 0 0 1.996 .004v-.117a.5 .5 0 0 1 .259 -.466l.075 -.034a3.61 3.61 0 0 0 2.338 -3.47a3.6 3.6 0 0 0 -2.497 -3.329"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3.072a8 8 0 0 1 2.32 11.834l5.387 5.387a1 1 0 0 1 -1.414 1.414l-5.388 -5.387a8 8 0 1 1 -.905 -13.249"/></svg>',
    'info-circle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c5.523 0 10 4.477 10 10a10 10 0 0 1 -19.995 .324l-.005 -.324l.004 -.28c.148 -5.393 4.566 -9.72 9.996 -9.72zm0 9h-1l-.117 .007a1 1 0 0 0 0 1.986l.117 .007v3l.007 .117a1 1 0 0 0 .876 .876l.117 .007h1l.117 -.007a1 1 0 0 0 .876 -.876l.007 -.117l-.007 -.117a1 1 0 0 0 -.764 -.857l-.112 -.02l-.117 -.006v-3l-.007 -.117a1 1 0 0 0 -.876 -.876l-.117 -.007zm.01 -3l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007z"/></svg>',
    'alert-circle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c5.523 0 10 4.477 10 10a10 10 0 0 1 -19.995 .324l-.005 -.324l.004 -.28c.148 -5.393 4.566 -9.72 9.996 -9.72zm.01 13l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007zm-.01 -8a1 1 0 0 0 -.993 .883l-.007 .117v4l.007 .117a1 1 0 0 0 1.986 0l.007 -.117v-4l-.007 -.117a1 1 0 0 0 -.993 -.883z"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6.707 5.293l5.293 5.292l5.293 -5.292a1 1 0 0 1 1.414 1.414l-5.292 5.293l5.292 5.293a1 1 0 0 1 -1.414 1.414l-5.293 -5.292l-5.293 5.292a1 1 0 1 1 -1.414 -1.414l5.292 -5.293l-5.292 -5.293a1 1 0 0 1 1.414 -1.414"/></svg>',
    notebook: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 5.134a1 1 0 0 1 .493 .748l.007 .118v13a1 1 0 0 1 -1.5 .866a8 8 0 0 0 -7.5 -.266v-15.174a10 10 0 0 1 8.5 .708m-10.5 -.707l.001 15.174a8 8 0 0 0 -7.234 .117l-.327 .18l-.103 .044l-.049 .016l-.11 .026l-.061 .01l-.117 .006h-.042l-.11 -.012l-.077 -.014l-.108 -.032l-.126 -.056l-.095 -.056l-.089 -.067l-.06 -.056l-.073 -.082l-.064 -.089l-.022 -.036l-.032 -.06l-.044 -.103l-.016 -.049l-.026 -.11l-.01 -.061l-.004 -.049l-.002 -13.068a1 1 0 0 1 .5 -.866a10 10 0 0 1 8.5 -.707"/></svg>',
    flask: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15 2a1 1 0 0 1 0 2v5.674l.062 .03a7 7 0 0 1 3.85 5.174l.037 .262a7 7 0 0 1 -3.078 6.693a1 1 0 0 1 -.553 .167h-6.635a1 1 0 0 1 -.552 -.166a7 7 0 0 1 .807 -12.134l.062 -.028v-5.672a1 1 0 1 1 0 -2h6zm-2 2h-2v6.34a1 1 0 0 1 -.551 .894l-.116 .049a5 5 0 0 0 -2.92 2.717h9.172a5 5 0 0 0 -2.918 -2.715a1 1 0 0 1 -.667 -.943v-6.342z"/></svg>',
    messages: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.901 14.995l-.044 -.006a.4 .4 0 0 1 -.102 -.02l-.045 -.012l-.048 -.017l-.045 -.016l-.043 -.02l-.045 -.022l-.04 -.024l-.044 -.026l-.043 -.032l-.036 -.027a1 1 0 0 1 -.073 -.066l-2.707 -2.707h-6.586a2 2 0 0 1 -2 -2v-6a2 2 0 0 1 2 -2h9a2 2 0 0 1 2 2v10a1 1 0 0 1 -.076 .383l-.02 .043l-.022 .045l-.024 .04l-.026 .044l-.032 .043l-.027 .036a1 1 0 0 1 -.578 .347l-.052 .008l-.044 .006a1 1 0 0 1 -.198 0"/><path d="M7 8.999v1.001a4 4 0 0 0 4 4h4v3a2 2 0 0 1 -2 2h-6.586l-2.707 2.707c-.63 .63 -1.707 .184 -1.707 -.707v-10a2 2 0 0 1 2 -2z"/></svg>',
    notes: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17.997 4.17a3 3 0 0 1 2.003 2.83v12a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 2.003 -2.83a4 4 0 0 0 3.997 3.83h4a4 4 0 0 0 3.98 -3.597zm-2.997 10.83h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m0 -4h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m-1 -9a2 2 0 1 1 0 4h-4a2 2 0 1 1 0 -4z"/></svg>',
    devices: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 21a1 1 0 0 1 0 -2h1v-2h-4a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-4v2h1a1 1 0 0 1 0 2zm7 -4h-4v2h4z"/></svg>',
    lifebuoy: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14.757 16.172l3.571 3.571a10.004 10.004 0 0 1 -12.656 0l3.57 -3.571a5 5 0 0 0 2.758 .828c1.02 0 1.967 -.305 2.757 -.828m-10.5 -10.5l3.571 3.57a5 5 0 0 0 -.828 2.758c0 1.02 .305 1.967 .828 2.757l-3.57 3.572a10 10 0 0 1 -2.258 -6.329l.005 -.324a10 10 0 0 1 2.252 -6.005m17.743 6.329c0 2.343 -.82 4.57 -2.257 6.328l-3.571 -3.57a5 5 0 0 0 .828 -2.758c0 -1.02 -.305 -1.967 -.828 -2.757l3.571 -3.57a10 10 0 0 1 2.257 6.327m-5 -8.66q .707 .41 1.33 .918l-3.573 3.57a5 5 0 0 0 -2.757 -.828c-1.02 0 -1.967 .305 -2.757 .828l-3.573 -3.57a10 10 0 0 1 11.33 -.918"/></svg>',
    gamepad: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 4a6 6 0 0 1 5.945 5.187l1.532 7.883a3.3 3.3 0 0 1 -5.632 2.903l-3.776 -3.974l-3.14 .001l-3.719 3.916a3.3 3.3 0 0 1 -5.629 -2.92l1.634 -8.173a6 6 0 0 1 5.885 -4.823zm-7.5 3a1 1 0 0 0 -1 1v1h-1a1 1 0 1 0 0 2h1v1a1 1 0 0 0 2 0v-1h1a1 1 0 0 0 0 -2h-1v-1a1 1 0 0 0 -1 -1m10 2h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0 -2"/></svg>',
    school: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13.431v2.569c0 2.398 -3.205 4 -7 4s-7 -1.602 -7 -4v-2.569l5.886 2.354a3 3 0 0 0 2.011 .078l.217 -.078zm2 -2.955l-8.629 3.452a1 1 0 0 1 -.742 0l-10 -4c-.839 -.335 -.839 -1.521 0 -1.856l10 -4a1 1 0 0 1 .245 -.064l.126 -.008l.126 .008a1 1 0 0 1 .245 .064l10.032 4.013l.108 .055l.099 .068l.088 .076l.075 .082l.035 .044l.073 .115l.052 .115l.034 .102l.025 .135l.006 .058l.002 6.065a1 1 0 0 1 -2 0z"/></svg>',
    settings: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14.647 4.081a.724 .724 0 0 0 1.08 .448c2.439 -1.485 5.23 1.305 3.745 3.744a.724 .724 0 0 0 .447 1.08c2.775 .673 2.775 4.62 0 5.294a.724 .724 0 0 0 -.448 1.08c1.485 2.439 -1.305 5.23 -3.744 3.745a.724 .724 0 0 0 -1.08 .447c-.673 2.775 -4.62 2.775 -5.294 0a.724 .724 0 0 0 -1.08 -.448c-2.439 1.485 -5.23 -1.305 -3.745 -3.744a.724 .724 0 0 0 -.447 -1.08c-2.775 -.673 -2.775 -4.62 0 -5.294a.724 .724 0 0 0 .448 -1.08c-1.485 -2.439 1.305 -5.23 3.744 -3.745a.722 .722 0 0 0 1.08 -.447c.673 -2.775 4.62 -2.775 5.294 0zm-2.647 4.919a3 3 0 1 0 0 6a3 3 0 0 0 0 -6"/></svg>',
    headset: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a9 9 0 0 1 9 9v6a3 3 0 0 1 -2.152 2.879c-.678 1.901 -3.538 3.121 -6.848 3.121a1 1 0 0 1 0 -2c1.889 0 3.482 -.482 4.334 -1.075a3 3 0 0 1 -2.334 -2.925l.001 -3.051l.004 -.051a2.995 2.995 0 0 1 2.995 -2.898h1c.351 0 .688 .06 1 .171v-.171a7 7 0 0 0 -13.996 -.24l-.004 .41c.313 -.11 .65 -.17 1 -.17h1a3 3 0 0 1 3 3v3a3 3 0 0 1 -3 3h-1a3 3 0 0 1 -3 -3v-6a9 9 0 0 1 9 -9"/></svg>',
    'user-x': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.884 2.007l.114 -.007l.118 .007l.059 .008l.061 .013l.111 .034a.993 .993 0 0 1 .217 .112l.104 .082l.255 .218a11 11 0 0 0 7.189 2.537l.342 -.01a1 1 0 0 1 1.005 .717a13 13 0 0 1 -9.208 16.25a1 1 0 0 1 -.502 0a13 13 0 0 1 -9.209 -16.25a1 1 0 0 1 1.005 -.717a11 11 0 0 0 7.531 -2.527l.263 -.225l.096 -.075a.993 .993 0 0 1 .217 -.112l.112 -.034a.97 .97 0 0 1 .119 -.021z"/></svg>',
    mobile: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2a3 3 0 0 1 2.995 2.824l.005 .176v14a3 3 0 0 1 -2.824 2.995l-.176 .005h-8a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005h8zm-4 14a1 1 0 0 0 -.993 .883l-.007 .117l.007 .127a1 1 0 0 0 1.986 0l.007 -.117l-.007 -.127a1 1 0 0 0 -.993 -.883zm1 -12h-2l-.117 .007a1 1 0 0 0 0 1.986l.117 .007h2l.117 -.007a1 1 0 0 0 0 -1.986l-.117 -.007z"/></svg>',
    'chevron-down': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.707 8.293a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1 -1.414 0l-6 -6a1 1 0 0 1 1.414 -1.414l5.293 5.293l5.293 -5.293a1 1 0 0 1 1.414 0"/></svg>',
    logout: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 2a3 3 0 0 1 3 3v14a3 3 0 0 1 -3 3h-14a3 3 0 0 1 -3 -3v-14a3 3 0 0 1 3 -3zm-6.387 5.21a1 1 0 0 0 -1.32 .083l-.083 .094a1 1 0 0 0 .083 1.32l2.292 2.293h-5.585l-.117 .007a1 1 0 0 0 .117 1.993h5.585l-2.292 2.293l-.083 .094a1 1 0 0 0 1.497 1.32l4 -4l.073 -.082l.074 -.104l.052 -.098l.044 -.11l.03 -.112l.017 -.126l.003 -.075l-.007 -.118l-.029 -.148l-.035 -.105l-.054 -.113l-.071 -.111a1.008 1.008 0 0 0 -.097 -.112l-4 -4z"/></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2a1 1 0 0 1 .993 .883l.007 .117v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 1.993 -.117l.007 .117v1h6v-1a1 1 0 0 1 1 -1zm3 7h-14v9.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16v-9.625z"/><path d="M12 12a1 1 0 0 1 .993 .883l.007 .117v3a1 1 0 0 1 -1.993 .117l-.007 -.117v-2a1 1 0 0 1 -.117 -1.993l.117 -.007h1z"/></svg>',
    cake: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 14v8h-4a3 3 0 0 1 -3 -3v-4a1 1 0 0 1 1 -1h6zm8 0a1 1 0 0 1 1 1v4a3 3 0 0 1 -3 3h-4v-8h6zm-2.5 -12a3.5 3.5 0 0 1 3.163 5h.337a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-7v-5h-2v5h-7a2 2 0 0 1 -2 -2v-1a2 2 0 0 1 2 -2h.337a3.486 3.486 0 0 1 -.337 -1.5c0 -1.933 1.567 -3.5 3.483 -3.5c1.755 -.03 3.312 1.092 4.381 2.934l.136 .243c1.033 -1.914 2.56 -3.114 4.291 -3.175l.209 -.002zm-9 2a1.5 1.5 0 0 0 0 3h3.143c-.741 -1.905 -1.949 -3.02 -3.143 -3zm8.983 0c-1.18 -.02 -2.385 1.096 -3.126 3h3.143a1.5 1.5 0 1 0 -.017 -3z"/></svg>',
  };

  function svgWithStyle(name, style) {
    const svg = ICONS[name];
    if (!svg) return null;
    return style ? svg.replace('<svg ', `<svg style="${style}" `) : svg;
  }

  // .uf-icon spans: breadcrumb home/help/search, alert info/error, remove-x.
  // `tone` maps to a .betterais-icon-* class so style.css owns the color in
  // each theme; untoned icons simply inherit surrounding text color.
  const UF_ICON_MAP = {
    'base-home': { icon: 'home' },
    'base-help': { icon: 'help' },
    'crumbs-search': { icon: 'search' },
    'vypis-info': { icon: 'info-circle', tone: 'info' },
    'vypis-ko': { icon: 'alert-circle', tone: 'danger' },
    'stav-odebrat': { icon: 'x', tone: 'danger' },
  };

  // .polozky-obr svg: the big icon on each #menitko section card
  const POLOZKY_MAP = {
    info: 'info-circle',
    'spiral-bound-booklet': 'notebook',
    'glass-jar': 'flask',
    'group-message': 'messages',
    'writing-down': 'notes',
    'device-manager': 'devices',
    lifebuoy: 'lifebuoy',
    'slot-machine': 'gamepad',
    learning: 'school',
    cog: 'settings',
    'computer-support': 'headset',
    'blocked-account-male': 'user-x',
    ms2: 'mobile',
  };

  function replaceUfIcons(root) {
    root.querySelectorAll('.uf-icon[data-sysid]').forEach((span) => {
      const map = UF_ICON_MAP[span.getAttribute('data-sysid')];
      if (!map) return;
      const svg = span.querySelector('svg');
      if (svg && !siteIconId(svg)) return; // already ours
      const markup = svgWithStyle(map.icon);
      if (!markup) return;
      span.innerHTML = markup.replace(
        '<svg ',
        `<svg class="betterais-icon${map.tone ? ` betterais-icon-${map.tone}` : ''}" `
      );
      span.setAttribute('data-betterais', '1');
    });
  }

  // Reads the site's icon id off an <svg>, whether it's exposed as a
  // data-sysid attribute or only as the fragment of its <use> href
  // (e.g. /menitka.svg?123#glass-jar).
  function siteIconId(svg) {
    const attr = svg.getAttribute('data-sysid');
    if (attr) return attr;
    const use = svg.querySelector('use');
    if (!use) return null;
    const href = use.getAttribute('xlink:href') || use.getAttribute('href') || '';
    const hash = href.indexOf('#');
    return hash === -1 ? null : href.slice(hash + 1);
  }

  function replacePolozkyIcons(root) {
    // NOTE: deliberately does NOT skip on a data-betterais marker. The site's
    // menitka.js re-renders section markup when sections are collapsed into
    // #closed-sections, restoring the original icon while our marker survives
    // - which left those icons permanently un-themed. Detect the site's own
    // icon by content instead, so re-rendered ones get picked up again.
    //
    // Wrapper varies: an expanded card uses .polozky-obr, but a section that
    // starts (or ends up) collapsed in #closed-sections has NO wrapper at all
    // - it's a bare <svg data-sysid="..."> directly inside an <a>. Matching
    // the svg itself, not a specific wrapper class, covers both.
    root.querySelectorAll('.polozky-obr svg, .closed-section svg').forEach((svg) => {
      const id = siteIconId(svg);
      if (!id) return; // already ours - our icons carry no site id
      const iconName = POLOZKY_MAP[id];
      const markup = svgWithStyle(iconName, 'width:100%;height:100%');
      if (!markup) return;
      const wrapper = svg.parentElement;
      wrapper.innerHTML = markup;
      wrapper.setAttribute('data-betterais', '1');
    });
  }

  // Colors come from CSS classes (.betterais-icon-{info,warn}) rather than
  // inline values, so both themes can tune them independently in style.css.
  function replaceZasadkaIcons(root) {
    root.querySelectorAll('.zasadky-info svg, .zasadky-crit svg').forEach((svg) => {
      if (!siteIconId(svg)) return; // already ours
      const isCrit = !!svg.closest('.zasadky-crit');
      const markup = svgWithStyle(isCrit ? 'alert-circle' : 'info-circle', 'width:28px;height:28px');
      if (!markup) return;
      svg.outerHTML = markup.replace(
        '<svg ',
        `<svg class="betterais-icon ${isCrit ? 'betterais-icon-warn' : 'betterais-icon-info'}" `
      );
    });
  }

  // The header's own icons are plain raster <img class="in-header"> tags
  // served from img.pl, not .uf-icon sprites - so nothing above touches them.
  // Keyed by the userunid in their src.
  const HEADER_IMG_MAP = {
    187642: 'logout',   // sign out
    153970: 'calendar', // today's date
    153971: 'cake',     // name day
  };
  const HEADER_IMG_SEPARATOR = '153852'; // thin divider graphic

  // Language flags. The originals are 17x11px PNGs - far too small to enlarge
  // without going blurry - so they're redrawn as vectors that stay crisp at
  // any size. All use a 3:2 box so they line up evenly with each other.
  const FLAGS = {
    189884: {
      label: 'English',
      svg:
        '<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" role="img">' +
        '<clipPath id="betterais-flag-uk"><path d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z"/></clipPath>' +
        '<rect width="60" height="40" fill="#012169"/>' +
        '<path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" stroke-width="8"/>' +
        '<path d="M0,0 L60,40 M60,0 L0,40" clip-path="url(#betterais-flag-uk)" stroke="#c8102e" stroke-width="5"/>' +
        '<path d="M30,0 v40 M0,20 h60" stroke="#fff" stroke-width="13"/>' +
        '<path d="M30,0 v40 M0,20 h60" stroke="#c8102e" stroke-width="8"/>' +
        '</svg>',
    },
    189883: {
      label: 'Česky',
      svg:
        '<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" role="img">' +
        '<rect width="60" height="20" fill="#fff"/>' +
        '<rect y="20" width="60" height="20" fill="#d7141a"/>' +
        '<path d="M0,0 L30,20 L0,40 Z" fill="#11457e"/>' +
        '</svg>',
    },
    189882: {
      label: 'Slovensky',
      svg:
        '<svg viewBox="0 0 60 40" xmlns="http://www.w3.org/2000/svg" role="img">' +
        '<rect width="60" height="40" fill="#ee1c25"/>' +
        '<rect width="60" height="26.67" fill="#0b4ea2"/>' +
        '<rect width="60" height="13.33" fill="#fff"/>' +
        // shield + double cross, simplified so it still reads at 24px wide
        '<path d="M13.5 10.5h17v12.2c0 4.5-3.4 7-8.5 9.1-5.1-2.1-8.5-4.6-8.5-9.1z" fill="#fff"/>' +
        '<path d="M15 12h14v10.7c0 3.9-2.9 6.1-7 7.9-4.1-1.8-7-4-7-7.9z" fill="#ee1c25"/>' +
        '<path d="M20.7 13.4h2.6v2.5h3.2v2.5h-3.2v2.3h3.9v2.5h-3.9v3.1h-2.6v-3.1h-3.9v-2.5h3.9v-2.3h-3.2v-2.5h3.2z" fill="#fff"/>' +
        '</svg>',
    },
  };

  function replaceHeaderImages(root) {
    root.querySelectorAll('#hlavicka img.in-header').forEach((img) => {
      const src = img.getAttribute('src') || '';
      const match = src.match(/userunid=(\d+)/);
      if (!match) return;
      const id = match[1];

      // dividers are drawn with CSS borders instead (see style.css)
      if (id === HEADER_IMG_SEPARATOR) {
        img.remove();
        return;
      }

      const flag = FLAGS[id];
      if (flag) {
        const span = document.createElement('span');
        span.className = 'betterais-flag';
        span.setAttribute('title', img.getAttribute('title') || flag.label);
        span.setAttribute('aria-label', flag.label);
        span.innerHTML = flag.svg;
        img.replaceWith(span);
        return;
      }

      const iconName = HEADER_IMG_MAP[id];
      if (!iconName) return;
      const markup = svgWithStyle(iconName);
      if (!markup) return;
      const span = document.createElement('span');
      span.className = 'betterais-header-icon';
      span.innerHTML = markup.replace('<svg ', '<svg class="betterais-icon" ');
      img.replaceWith(span);
    });
  }

  function run() {
    replaceUfIcons(document);
    replacePolozkyIcons(document);
    replaceZasadkaIcons(document);
    replaceHeaderImages(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  // #menitko sections and late notice boxes can be built slightly after
  // load by the site's own JS - catch those without re-scanning constantly.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      run();
    }, 200);
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
})();

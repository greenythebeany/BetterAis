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
    search: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M10 2a8 8 0 0 1 6.32 12.906l5.387 5.387a1 1 0 0 1 -1.414 1.414l-5.387 -5.387a8 8 0 1 1 -4.906 -14.32m0 2a6 6 0 1 0 0 12a6 6 0 0 0 0 -12"/></svg>',
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
    pencil: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14.3 4.3a2.5 2.5 0 0 1 3.5 0l1.9 1.9a2.5 2.5 0 0 1 0 3.5l-1.2 1.2l-5.4 -5.4z"/><path d="M12.4 6.2l5.4 5.4l-8.5 8.5l-7.3 1.9l1.9 -7.3z"/></svg>',
    'chart-bar': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 12h3a1 1 0 0 1 1 1v7a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-7a1 1 0 0 1 1 -1m6.5 -5h3a1 1 0 0 1 1 1v12a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-12a1 1 0 0 1 1 -1m6.5 -4h3a1 1 0 0 1 1 1v16a1 1 0 0 1 -1 1h-3a1 1 0 0 1 -1 -1v-16a1 1 0 0 1 1 -1"/></svg>',
    calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2a1 1 0 0 1 .993 .883l.007 .117v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 1.993 -.117l.007 .117v1h6v-1a1 1 0 0 1 1 -1zm3 7h-14v9.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16v-9.625z"/><path d="M12 12a1 1 0 0 1 .993 .883l.007 .117v3a1 1 0 0 1 -1.993 .117l-.007 -.117v-2a1 1 0 0 1 -.117 -1.993l.117 -.007h1z"/></svg>',
    cake: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 14v8h-4a3 3 0 0 1 -3 -3v-4a1 1 0 0 1 1 -1h6zm8 0a1 1 0 0 1 1 1v4a3 3 0 0 1 -3 3h-4v-8h6zm-2.5 -12a3.5 3.5 0 0 1 3.163 5h.337a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-7v-5h-2v5h-7a2 2 0 0 1 -2 -2v-1a2 2 0 0 1 2 -2h.337a3.486 3.486 0 0 1 -.337 -1.5c0 -1.933 1.567 -3.5 3.483 -3.5c1.755 -.03 3.312 1.092 4.381 2.934l.136 .243c1.033 -1.914 2.56 -3.114 4.291 -3.175l.209 -.002zm-9 2a1.5 1.5 0 0 0 0 3h3.143c-.741 -1.905 -1.949 -3.02 -3.143 -3zm8.983 0c-1.18 -.02 -2.385 1.096 -3.126 3h3.143a1.5 1.5 0 1 0 -.017 -3z"/></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 1 1 -5 5l.005 -.217a5 5 0 0 1 4.995 -4.783z"/><path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z"/></svg>',
    folder: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3a1 1 0 0 1 .608 .206l.1 .087l2.706 2.707h6.586a3 3 0 0 1 2.995 2.824l.005 .176v8a3 3 0 0 1 -2.824 2.995l-.176 .005h-14a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-11a3 3 0 0 1 2.824 -2.995l.176 -.005h4z"/></svg>',
    // Moje štúdium app grid, thesis column and table toolbar (UF_ICON_MAP)
    'calendar-week': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2c.183 0 .355 .05 .502 .135l.033 .02c.28 .177 .465 .49 .465 .845v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 .514 -.874l.093 -.046l.066 -.025l.1 -.029l.107 -.019l.12 -.007q .083 0 .161 .013l.122 .029l.04 .012l.06 .023c.328 .135 .568 .44 .61 .806l.007 .117v1h6v-1a1 1 0 0 1 1 -1m3 7h-14v9.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16z" /><path d="M9.015 13a1 1 0 0 1 -1 1a1.001 1.001 0 1 1 -.005 -2c.557 0 1.005 .448 1.005 1" /><path d="M13.015 13a1 1 0 0 1 -1 1a1.001 1.001 0 1 1 -.005 -2c.557 0 1.005 .448 1.005 1" /><path d="M17.02 13a1 1 0 0 1 -1 1a1.001 1.001 0 1 1 -.005 -2c.557 0 1.005 .448 1.005 1" /><path d="M12.02 15a1 1 0 0 1 0 2a1.001 1.001 0 1 1 -.005 -2z" /><path d="M9.015 16a1 1 0 0 1 -1 1a1.001 1.001 0 1 1 -.005 -2c.557 0 1.005 .448 1.005 1" /></svg>',
    'calendar-month': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 12a1 1 0 0 1 1 1v4a1 1 0 0 1 -2 0v-4a1 1 0 0 1 1 -1" /><path d="M12 12a1 1 0 0 1 1 1v4a1 1 0 0 1 -2 0v-4a1 1 0 0 1 1 -1" /><path d="M16 12a1 1 0 0 1 1 1v4a1 1 0 0 1 -2 0v-4a1 1 0 0 1 1 -1" /><path d="M16 2a1 1 0 0 1 .993 .883l.007 .117v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 1.993 -.117l.007 .117v1h6v-1a1 1 0 0 1 1 -1m3 7h-14v9.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16z" /></svg>',
    'calendar-event': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 2a1 1 0 0 1 .993 .883l.007 .117v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 1.993 -.117l.007 .117v1h6v-1a1 1 0 0 1 1 -1m3 8h-14v8.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16zm-9 4a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-2a1 1 0 0 1 -1 -1v-2a1 1 0 0 1 1 -1z" /></svg>',
    'map-pin': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6" /></svg>',
    award: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19.496 13.983l1.966 3.406a1.001 1.001 0 0 1 -.705 1.488l-.113 .011l-.112 -.001l-2.933 -.19l-1.303 2.636a1.001 1.001 0 0 1 -1.608 .26l-.082 -.094l-.072 -.11l-1.968 -3.407a8.994 8.994 0 0 0 6.93 -3.999z" /><path d="M11.43 17.982l-1.966 3.408a1.001 1.001 0 0 1 -1.622 .157l-.076 -.1l-.064 -.114l-1.304 -2.635l-2.931 .19a1.001 1.001 0 0 1 -1.022 -1.29l.04 -.107l.05 -.1l1.968 -3.409a8.994 8.994 0 0 0 6.927 4.001z" /><path d="M12 2l.24 .004a7 7 0 0 1 6.76 6.996l-.003 .193l-.007 .192l-.018 .245l-.026 .242l-.024 .178a6.985 6.985 0 0 1 -.317 1.268l-.116 .308l-.153 .348a7.001 7.001 0 0 1 -12.688 -.028l-.13 -.297l-.052 -.133l-.08 -.217l-.095 -.294a6.96 6.96 0 0 1 -.093 -.344l-.06 -.271l-.049 -.271l-.02 -.139l-.039 -.323l-.024 -.365l-.006 -.292a7 7 0 0 1 6.76 -6.996l.24 -.004z" /></svg>',
    'medical-cross': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11 2l-.15 .005a2 2 0 0 0 -1.85 1.995v2.803l-2.428 -1.401a2 2 0 0 0 -2.732 .732l-1 1.732l-.073 .138a2 2 0 0 0 .805 2.594l2.427 1.402l-2.427 1.402a2 2 0 0 0 -.732 2.732l1 1.732l.083 .132a2 2 0 0 0 2.649 .6l2.428 -1.402v2.804a2 2 0 0 0 2 2h2l.15 -.005a2 2 0 0 0 1.85 -1.995v-2.804l2.428 1.403a2 2 0 0 0 2.732 -.732l1 -1.732l.073 -.138a2 2 0 0 0 -.805 -2.594l-2.428 -1.403l2.428 -1.402a2 2 0 0 0 .732 -2.732l-1 -1.732l-.083 -.132a2 2 0 0 0 -2.649 -.6l-2.428 1.4v-2.802a2 2 0 0 0 -2 -2h-2z" /></svg>',
    'file-description': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005zm3 14h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2m0 -4h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2" /><path d="M19 7h-4l-.001 -4.001z" /></svg>',
    archive: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2 5a2 2 0 0 1 2 -2h16a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2z" /><path d="M19 9c.513 0 .936 .463 .993 1.06l.007 .14v7.2c0 1.917 -1.249 3.484 -2.824 3.594l-.176 .006h-10c-1.598 0 -2.904 -1.499 -2.995 -3.388l-.005 -.212v-7.2c0 -.663 .448 -1.2 1 -1.2h14zm-5 2h-4l-.117 .007a1 1 0 0 0 0 1.986l.117 .007h4l.117 -.007a1 1 0 0 0 0 -1.986l-.117 -.007z" /></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" /></svg>',
    rosette: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 2.011a3.2 3.2 0 0 1 2.113 .797l.154 .145l.698 .698a1.2 1.2 0 0 0 .71 .341l.135 .008h1a3.2 3.2 0 0 1 3.195 3.018l.005 .182v1c0 .27 .092 .533 .258 .743l.09 .1l.697 .698a3.2 3.2 0 0 1 .147 4.382l-.145 .154l-.698 .698a1.2 1.2 0 0 0 -.341 .71l-.008 .135v1a3.2 3.2 0 0 1 -3.018 3.195l-.182 .005h-1a1.2 1.2 0 0 0 -.743 .258l-.1 .09l-.698 .697a3.2 3.2 0 0 1 -4.382 .147l-.154 -.145l-.698 -.698a1.2 1.2 0 0 0 -.71 -.341l-.135 -.008h-1a3.2 3.2 0 0 1 -3.195 -3.018l-.005 -.182v-1a1.2 1.2 0 0 0 -.258 -.743l-.09 -.1l-.697 -.698a3.2 3.2 0 0 1 -.147 -4.382l.145 -.154l.698 -.698a1.2 1.2 0 0 0 .341 -.71l.008 -.135v-1l.005 -.182a3.2 3.2 0 0 1 3.013 -3.013l.182 -.005h1a1.2 1.2 0 0 0 .743 -.258l.1 -.09l.698 -.697a3.2 3.2 0 0 1 2.269 -.944z" /></svg>',
    'chart-pie': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9.883 2.207a1.9 1.9 0 0 1 2.087 1.522l.025 .167l.005 .104v7a1 1 0 0 0 .883 .993l.117 .007h6.8a2 2 0 0 1 2 2a1 1 0 0 1 -.026 .226a10 10 0 1 1 -12.27 -11.933l.27 -.067l.11 -.02z" /><path d="M14 3.5v5.5a1 1 0 0 0 1 1h5.5a1 1 0 0 0 .943 -1.332a10 10 0 0 0 -6.11 -6.111a1 1 0 0 0 -1.333 .943z" /></svg>',
    coin: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3.34a10 10 0 1 1 -15 8.66l.005 -.324a10 10 0 0 1 14.995 -8.336zm-5 2.66a1 1 0 0 0 -1 1a3 3 0 1 0 0 6v2a1.024 1.024 0 0 1 -.866 -.398l-.068 -.101a1 1 0 0 0 -1.732 .998a3 3 0 0 0 2.505 1.5h.161a1 1 0 0 0 .883 .994l.117 .007a1 1 0 0 0 1 -1l.176 -.005a3 3 0 0 0 -.176 -5.995v-2c.358 -.012 .671 .14 .866 .398l.068 .101a1 1 0 0 0 1.732 -.998a3 3 0 0 0 -2.505 -1.501h-.161a1 1 0 0 0 -1 -1zm1 7a1 1 0 0 1 0 2v-2zm-2 -4v2a1 1 0 0 1 0 -2z" /></svg>',
    'cash-banknote': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-14a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3zm-7 4a3 3 0 0 0 -2.996 2.85l-.004 .15a3 3 0 1 0 3 -3m6.01 2h-.01a1 1 0 0 0 0 2h.01a1 1 0 0 0 0 -2m-12 0h-.01a1 1 0 1 0 .01 2a1 1 0 0 0 0 -2" /></svg>',
    'credit-card': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22 10v6a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-6h20zm-14.99 4h-.01a1 1 0 1 0 .01 2a1 1 0 0 0 0 -2m5.99 0h-2a1 1 0 0 0 0 2h2a1 1 0 0 0 0 -2zm5 -10a4 4 0 0 1 4 4h-20a4 4 0 0 1 4 -4h12z" /></svg>',
    'shopping-cart': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2a1 1 0 0 1 .993 .883l.007 .117v1.068l13.071 .935a1 1 0 0 1 .929 1.024l-.01 .114l-1 7a1 1 0 0 1 -.877 .853l-.113 .006h-12v2h10a3 3 0 1 1 -2.995 3.176l-.005 -.176l.005 -.176c.017 -.288 .074 -.564 .166 -.824h-5.342a3 3 0 1 1 -5.824 1.176l-.005 -.176l.005 -.176a3.002 3.002 0 0 1 1.995 -2.654v-12.17h-1a1 1 0 0 1 -.993 -.883l-.007 -.117a1 1 0 0 1 .883 -.993l.117 -.007h2zm0 16a1 1 0 1 0 0 2a1 1 0 0 0 0 -2m11 0a1 1 0 1 0 0 2a1 1 0 0 0 0 -2" /></svg>',
    plane: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.868 2.504l3.712 6.496h3.42a3 3 0 0 1 0 6h-3.42l-3.712 6.496a1 1 0 0 1 -.868 .504h-3a1 1 0 0 1 -.962 -1.275l1.636 -5.725h-2.26l-1.707 1.707a1 1 0 0 1 -.707 .293h-3a1 1 0 0 1 -.894 -1.447l1.776 -3.553l-1.776 -3.553a1 1 0 0 1 .894 -1.447h3a1 1 0 0 1 .707 .293l1.707 1.707h2.26l-1.636 -5.725a1 1 0 0 1 .962 -1.275h3a1 1 0 0 1 .868 .504" /></svg>',
    book: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21.5 5.134a1 1 0 0 1 .493 .748l.007 .118v13a1 1 0 0 1 -1.5 .866a8 8 0 0 0 -7.5 -.266v-15.174a10 10 0 0 1 8.5 .708m-10.5 -.707l.001 15.174a8 8 0 0 0 -7.234 .117l-.327 .18l-.103 .044l-.049 .016l-.11 .026l-.061 .01l-.117 .006h-.042l-.11 -.012l-.077 -.014l-.108 -.032l-.126 -.056l-.095 -.056l-.089 -.067l-.06 -.056l-.073 -.082l-.064 -.089l-.022 -.036l-.032 -.06l-.044 -.103l-.016 -.049l-.026 -.11l-.01 -.061l-.004 -.049l-.002 -13.068a1 1 0 0 1 .5 -.866a10 10 0 0 1 8.5 -.707" /></svg>',
    'caret-up-down': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.293 3.293a1 1 0 0 1 1.414 0l6 6a.95 .95 0 0 1 .073 .082l.006 .008l.016 .022l.042 .059l.009 .015l.007 .01l.014 .027l.024 .044l.007 .017l.01 .02l.012 .032l.015 .034l.007 .025l.008 .02l.005 .026l.012 .037l.004 .028l.006 .025l.003 .026l.006 .033l.002 .03l.003 .028v.026l.002 .033l-.002 .033v.026l-.003 .026l-.002 .032l-.005 .029l-.004 .03l-.006 .024l-.004 .03l-.012 .035l-.005 .027l-.008 .019l-.007 .026l-.015 .033l-.012 .034l-.01 .018l-.007 .018l-.024 .043l-.014 .028l-.007 .009l-.009 .016l-.042 .058l-.012 .019l-.004 .003l-.006 .01a1.006 1.006 0 0 1 -.155 .154l-.009 .006l-.022 .016l-.058 .042l-.016 .009l-.009 .007l-.028 .014l-.043 .024l-.018 .007l-.018 .01l-.034 .012l-.033 .015l-.024 .006l-.021 .009l-.027 .005l-.036 .012l-.029 .004l-.024 .006l-.028 .003l-.031 .006l-.032 .002l-.026 .003h-.026l-.033 .002h-12c-.89 0 -1.337 -1.077 -.707 -1.707l6 -6z" /><path d="M18 13l.033 .002h.026l.026 .003l.032 .002l.031 .006l.028 .003l.024 .006l.03 .004l.035 .012l.027 .005l.019 .008l.026 .007l.033 .015l.034 .012l.018 .01l.018 .007l.043 .024l.028 .014l.009 .007l.016 .009l.051 .037l.026 .017l.003 .004l.01 .006a.982 .982 0 0 1 .154 .155l.006 .009l.015 .02l.043 .06l.009 .016l.007 .009l.014 .028l.024 .043l.005 .013l.012 .023l.012 .034l.015 .033l.007 .026l.008 .02l.005 .026l.012 .036l.004 .029l.006 .024l.003 .028l.006 .031l.002 .032l.003 .026v.026l.002 .033l-.002 .033v.026l-.003 .026l-.002 .032l-.006 .031l-.003 .028l-.006 .024l-.004 .03l-.012 .035l-.005 .027l-.008 .019l-.007 .026l-.015 .033l-.012 .034l-.01 .018l-.007 .018l-.024 .043l-.014 .028l-.007 .009l-.009 .016l-.042 .058l-.012 .019l-.004 .003l-.006 .01l-.073 .081l-6 6a1 1 0 0 1 -1.414 0l-6 -6c-.63 -.63 -.184 -1.707 .707 -1.707h12z" /></svg>',
    filter: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-16a1 1 0 0 0 -1 1v2.227l.008 .223a3 3 0 0 0 .772 1.795l4.22 4.641v8.114a1 1 0 0 0 1.316 .949l6 -2l.108 -.043a1 1 0 0 0 .576 -.906v-6.586l4.121 -4.12a3 3 0 0 0 .879 -2.123v-2.171a1 1 0 0 0 -1 -1z" /></svg>',
    'layout-list': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18 3a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-2a3 3 0 0 1 3 -3z" /><path d="M18 13a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-2a3 3 0 0 1 3 -3z" /></svg>',
    'file-download': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005zm0 8a1 1 0 0 0 -1 1v3.585l-.793 -.792a1 1 0 0 0 -1.32 -.083l-.094 .083a1 1 0 0 0 0 1.414l2.5 2.5l.044 .042l.068 .055l.11 .071l.114 .054l.105 .035l.15 .03l.116 .006l.117 -.007l.117 -.02l.108 -.033l.081 -.034l.098 -.052l.092 -.064l.094 -.083l2.5 -2.5a1 1 0 0 0 0 -1.414l-.094 -.083a1 1 0 0 0 -1.32 .083l-.793 .791v-3.584a1 1 0 0 0 -.883 -.993zm2.999 -7.001l4.001 4.001h-4z" /></svg>',
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
    // Portál študenta "Reg./Zápisy" column - the site's sprite hardcodes a
    // white fill, so it vanished on light surfaces
    'studevid-zapis': { icon: 'notes' },
    // same column set: exam sign-up and thesis topic, so the whole row of
    // action icons reads as one consistent, theme-colored set
    'prihlasovani-zkousky': { icon: 'pencil' },
    'studevid-diplomka-navrh': { icon: 'notebook' },
    'hodnoceni-prubezne': { icon: 'chart-bar' },
    'post-slozky': { icon: 'folder' },
    // Miesta odovzdania: "Zobraziť súbory" - the site sprite is white-only
    'base-op': { icon: 'folder' },
    // Portál študenta "Záverečná práca" column - was a lone teal book
    'studevid-diplomka': { icon: 'book' },
    // Moje štúdium -> "Podpora zvoleného štúdia" app grid (a.app-ikona):
    // the site's own glyphs are a mixed clip-art set, so swap the lot for
    // one consistent family
    'studevid-osobni-rozvrh': { icon: 'calendar-week' },
    'harmonogram-vyuky': { icon: 'calendar-month' },
    'obdobi-harmonogram': { icon: 'calendar-event' },
    'pracoviste-studijni-oddeleni': { icon: 'map-pin' },
    'prohlidka-statnich-zkousek': { icon: 'award' },
    'studevid-kc': { icon: 'headset' },
    'studevid-omluvenka': { icon: 'medical-cross' },
    'studevid-tisk': { icon: 'file-description' }, // Tabler has no filled printer
    'studevid-uloziste-dokumentu': { icon: 'archive' },
    'dekorace-evaluace-predmetu': { icon: 'star' },
    'cestne-prohlaseni': { icon: 'rosette' },
    'studevid-platova-trida': { icon: 'chart-pie' },
    'studevid-fin-stud': { icon: 'coin' },
    'studevid-stipendia-frank': { icon: 'cash-banknote' },
    'studevid-bank': { icon: 'credit-card' },
    'base-shopping-basket-green-32': { icon: 'shopping-cart' },
    'podani-prihlasky-pobyt': { icon: 'plane' },
    // data-table toolbar (sort / filter / row numbers / export / help)
    'table-sort': { icon: 'caret-up-down' },
    'table-filter': { icon: 'filter' },
    'table-number': { icon: 'layout-list' },
    'table-export': { icon: 'file-download' },
    'table-help': { icon: 'help' },
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
    // public (logged-out) homepage and the navratka pages use their own set
    person: 'user',
    student: 'user',
    id: 'devices',
    'edit-property': 'notes',
    'folder-info': 'folder',
    'glass-jar-info': 'flask',
    'folder-open': 'folder',
    is4u: 'info-circle',
    warning: 'alert-circle',
    info: 'info-circle',
  };

  // Uploaded files (data-sysid="mime-<ext>"): the site draws the same
  // generic glyph for every type, so you can't tell a PDF from a .zip.
  // Each gets a page icon with its real extension printed on a coloured
  // band; the colour follows the file's family (see .betterais-file-* in
  // style.css), so a whole folder listing scans at a glance.
  const FILE_FAMILIES = {
    pdf: ['pdf'],
    archive: ['zip', 'rar', '7z', '7zip', 'tar', 'gz', 'tgz', 'bz2', 'xz', 'zst'],
    doc: ['doc', 'docx', 'odt', 'rtf', 'pages'],
    sheet: ['xls', 'xlsx', 'ods', 'csv', 'numbers'],
    slides: ['ppt', 'pptx', 'odp', 'key'],
    image: ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp', 'tif', 'tiff', 'heic'],
    video: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv'],
    audio: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'],
    code: ['m', 'mat', 'mlx', 'slx', 'mdl', 'py', 'ipynb', 'c', 'h', 'cpp', 'hpp', 'cs', 'java',
      'js', 'ts', 'html', 'css', 'php', 'sql', 'r', 'json', 'xml', 'sh', 'bat', 'ino', 'vhd', 'v', 'asm'],
    text: ['txt', 'md', 'log', 'tex'],
  };

  function fileFamily(ext) {
    for (const family in FILE_FAMILIES) {
      if (FILE_FAMILIES[family].includes(ext)) return family;
    }
    return 'other';
  }

  function fileIconMarkup(ext) {
    const label = ext.length > 4 ? ext.slice(0, 4) : ext;
    const size = label.length >= 4 ? 5.6 : label.length === 3 ? 6.8 : 8;
    const family = fileFamily(ext);
    return (
      `<svg class="betterais-icon betterais-icon-file betterais-file-${family}" ` +
      'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">' +
      '<path opacity=".28" d="M7 2h7l6 6v12a2 2 0 0 1 -2 2h-11a2 2 0 0 1 -2 -2v-16a2 2 0 0 1 2 -2"/>' +
      '<path d="M14 2l6 6h-5a1 1 0 0 1 -1 -1z"/>' +
      '<rect x="1" y="12" width="22" height="9" rx="2"/>' +
      `<text x="12" y="18.7" text-anchor="middle" font-size="${size}" font-weight="700" ` +
      'style="fill: var(--surface); font-family: var(--font-sans); letter-spacing: .02em">' +
      `${label.toUpperCase()}</text></svg>`
    );
  }

  function replaceUfIcons(root) {
    root.querySelectorAll('.uf-icon[data-sysid^="mime-"]').forEach((span) => {
      if (span.hasAttribute('data-betterais')) return;
      const ext = (span.getAttribute('data-mime') || span.getAttribute('data-sysid').slice(5))
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      if (!ext) return;
      span.innerHTML = fileIconMarkup(ext);
      if (!span.getAttribute('title')) span.setAttribute('title', `.${ext}`);
      if (!span.getAttribute('aria-label')) span.setAttribute('aria-label', `.${ext}`);
      span.setAttribute('data-betterais', '1');
    });

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
  // .zasadky-warning ("POZOR: ..." critical notices) uses the site's OWN
  // menitka.svg sprite rather than a .uf-icon, and was missed here entirely
  // until now - it kept the raw site icon while every other notice card got
  // our unified set, which is what made it look inconsistent with the rest.
  function replaceZasadkaIcons(root) {
    root.querySelectorAll('.zasadky-info svg, .zasadky-crit svg, .zasadky-warning svg').forEach((svg) => {
      if (!siteIconId(svg)) return; // already ours
      const isWarn = !!svg.closest('.zasadky-crit, .zasadky-warning');
      const markup = svgWithStyle(isWarn ? 'alert-circle' : 'info-circle', 'width:28px;height:28px');
      if (!markup) return;
      svg.outerHTML = markup.replace(
        '<svg ',
        `<svg class="betterais-icon ${isWarn ? 'betterais-icon-warn' : 'betterais-icon-info'}" `
      );
    });
  }

  // style.css lays .zasadky-container out as CSS multicol, which packs
  // cards by real height instead of row-locking them to the tallest one -
  // but multicol only ever reads DOM order, ignoring the inline "order"
  // style the site uses to put critical notices ahead of routine ones. Sort
  // the cards into that same order for real, once, so multicol's own
  // left-to-right, top-to-bottom fill already matches it.
  function reorderZasadky(root) {
    root.querySelectorAll('.zasadky-container').forEach((container) => {
      const items = Array.from(container.children).filter((el) => el.classList.contains('zasadka'));
      const sorted = items
        .map((el, i) => ({ el, order: parseInt(el.style.order, 10) || 0, i }))
        .sort((a, b) => a.order - b.order || a.i - b.i)
        .map((entry) => entry.el);
      const alreadySorted = sorted.every((el, i) => el === items[i]);
      if (alreadySorted) return; // avoid a no-op DOM write on every observer tick
      sorted.forEach((el) => container.appendChild(el));
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
    reorderZasadky(document);
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

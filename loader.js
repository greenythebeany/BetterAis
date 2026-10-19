// Full-screen page-transition loader. AIS is a classic multi-page site, so
// every click is a full navigation: the old page freezes while the server
// works, then the new one snaps in half-built. Instead:
//
//  - the moment a navigation starts, a frosted cover fades in over the page
//    with a graduation cap and a 0 -> 100 progress bar in the middle;
//  - the next page starts already covered (this script runs at
//    document_start), the bar snaps to 100% once its DOM - and our icon
//    swaps - are in place, and the cover dissolves;
//  - style.css opts AIS into cross-document View Transitions and gives the
//    cover its own transition name, so it stays perfectly steady across the
//    page swap instead of blinking.
(function () {
  'use strict';

  const ARRIVING_KEY = 'betterais:navigating';
  // Hard stop so the cover can never trap the page (e.g. a navigation that
  // silently turned into a file download).
  const GIVE_UP_MS = 10000;
  // How long the bar takes to snap to 100% before the cover fades out
  // (matches .is-complete in style.css), and the fade itself.
  const COMPLETE_MS = 280;
  const FADE_MS = 400;
  // Responses that download a file instead of replacing the page - showing
  // the cover for those would leave it over a page that never goes away.
  const DOWNLOAD_URL = /[?;&](format|typ|vystup)=(pdf|xls|xlsx|csv|ics|doc|docx|zip|rtf)\b|download|stahnout|export|\.(pdf|zip|docx?|xlsx?|csv|ics|rar|7z)(\?|$)/i;
  const DOWNLOAD_FORMATS = /^(pdf|xls|xlsx|csv|ics|doc|docx|zip|rtf)$/i;

  const CAP =
    '<svg class="bl-cap" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M19 13.431v2.569c0 2.398 -3.205 4 -7 4s-7 -1.602 -7 -4v-2.569l5.886 2.354a3 3 0 0 0 2.011 .078l.217 -.078zm2 -2.955l-8.629 3.452a1 1 0 0 1 -.742 0l-10 -4c-.839 -.335 -.839 -1.521 0 -1.856l10 -4a1 1 0 0 1 .245 -.064l.126 -.008l.126 .008a1 1 0 0 1 .245 .064l10.032 4.013l.108 .055l.099 .068l.088 .076l.075 .082l.035 .044l.073 .115l.052 .115l.034 .102l.025 .135l.006 .058l.002 6.065a1 1 0 0 1 -2 0z"/></svg>';

  let cover = null;
  let giveUpTimer = null;
  let hideTimers = [];

  function ensureCover() {
    if (!cover) {
      cover = document.createElement('div');
      cover.id = 'betterais-loader';
      cover.setAttribute('aria-hidden', 'true');
      cover.innerHTML =
        `<div class="bl-mark">${CAP}</div>` +
        '<div class="bl-bar"><div class="bl-fill"></div></div>';
      // escape hatch: a click anywhere dismisses it
      cover.addEventListener('click', hide);
    }
    // At document_start <body> doesn't exist yet - <html> is fine for a
    // fixed-position layer.
    if (!cover.isConnected) (document.body || document.documentElement).appendChild(cover);
    return cover;
  }

  function clearHideTimers() {
    hideTimers.forEach(clearTimeout);
    hideTimers = [];
  }

  function show(instant) {
    const el = ensureCover();
    clearHideTimers();
    el.classList.remove('is-complete');
    el.classList.toggle('is-instant', !!instant);
    el.classList.add('is-on');
    clearTimeout(giveUpTimer);
    giveUpTimer = setTimeout(hide, GIVE_UP_MS);
  }

  // Bar to 100%, then fade the cover; the bar resets to 0 only once the
  // cover is fully invisible, so it never visibly jumps backwards.
  function hide() {
    clearTimeout(giveUpTimer);
    if (!cover || !cover.classList.contains('is-on') || hideTimers.length) return;
    cover.classList.add('is-complete');
    hideTimers.push(setTimeout(() => {
      cover.classList.remove('is-instant', 'is-on');
    }, COMPLETE_MS));
    hideTimers.push(setTimeout(() => {
      cover.classList.remove('is-complete');
      hideTimers = [];
    }, COMPLETE_MS + FADE_MS));
  }

  function looksLikeDownload(event) {
    if (event.downloadRequest !== null) return true;
    if (DOWNLOAD_URL.test(event.destination.url)) return true;
    // POST forms carry the output format in the body (e.g. the timetable's
    // "PDF" option), not the URL
    const data = event.formData;
    if (data) {
      for (const value of data.values()) {
        if (typeof value === 'string' && DOWNLOAD_FORMATS.test(value)) return true;
      }
    }
    return false;
  }

  // The Navigation API reports every navigation of this tab - links, form
  // submits (GET and POST), location changes from AIS's own scripts.
  if (window.navigation) {
    window.navigation.addEventListener('navigate', (event) => {
      if (event.hashChange || event.destination.sameDocument) return;
      if (looksLikeDownload(event)) return;
      show(false);
      try {
        sessionStorage.setItem(ARRIVING_KEY, '1');
      } catch (_) {
        // no sessionStorage - the next page just won't start covered
      }
    });
    window.navigation.addEventListener('navigateerror', hide);
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') hide();
  });

  // Back/forward can restore this page from the bfcache with the cover still
  // up from when we left - drop it.
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) hide();
  });

  // Arriving from a navigation the previous page started: begin fully
  // covered with the bar near the end, then complete and dissolve once the
  // DOM is ready. Two frames let icons.js / mobile.js (whose
  // DOMContentLoaded handlers run right after this one) finish their swaps
  // underneath first.
  let arriving = false;
  try {
    arriving = sessionStorage.getItem(ARRIVING_KEY) === '1';
    sessionStorage.removeItem(ARRIVING_KEY);
  } catch (_) {
    arriving = false;
  }
  if (arriving) {
    show(true);
    const reveal = () => requestAnimationFrame(() => requestAnimationFrame(hide));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal, { once: true });
    else reveal();
  }
})();

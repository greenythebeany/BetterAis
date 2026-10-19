// Phone support. Two jobs, both prerequisites for the max-width media block
// at the end of style.css - the CSS alone can't do either:
//
// 1. The site ships no <meta name="viewport">, so phone browsers lay every
//    page out at a ~980px virtual width and zoom it out until it fits -
//    everything ends up tiny and no media query ever sees a phone width.
//    Injecting the tag is what makes the phone layout kick in at all.
//
// 2. Data tables (thead > tr.zahlavi) become stacked cards on a phone, and
//    each cell needs its column header as a visible label once the header
//    row is hidden. CSS can't read a header into a cell, so it's copied
//    here into data-label, which style.css shows via ::before. The desktop
//    layout ignores these attributes entirely.
(function () {
  'use strict';

  function addViewport() {
    if (document.querySelector('meta[name="viewport"]')) return;
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.head.prepend(meta);
  }

  // Runs at document_start, before <head> exists - wait for the parser to
  // create it instead of inserting the tag somewhere it may be ignored.
  if (document.head) {
    addViewport();
  } else {
    const headWatch = new MutationObserver(() => {
      if (!document.head) return;
      headWatch.disconnect();
      addViewport();
    });
    headWatch.observe(document.documentElement, { childList: true });
  }

  function isBlankCell(cell) {
    if (cell.classList.contains('UISTMNumberCellHidden')) return true;
    if (cell.textContent.replace(/\u00a0/g, ' ').trim() !== '') return false;
    return !cell.querySelector('img, svg, input, select, textarea, button, a, .uf-icon');
  }

  const TITLE_LABEL = /^(predmet|názov|nazev|subject|title|name|štúdium|studium|study|dokument|document|súbor|soubor|file|meno|jméno|téma|tema|topic|vec|věc)\b/i;
  const NUMBER_LABEL = /^(por\.?|poř\.?|p\. ?č\.?|č\.|#|no\.?)$/i;

  function cellText(cell) {
    return cell.textContent.replace(/\s+/g, ' ').trim();
  }

  function labelRow(tr, labels) {
    const titleCol = labels.findIndex((l) => TITLE_LABEL.test(l));
    Array.from(tr.children).forEach((cell, i) => {
      cell.setAttribute('data-label', labels[i]);
      const text = cellText(cell);
      if (isBlankCell(cell) || NUMBER_LABEL.test(labels[i]) || (labels[i] === '' && /^\d+\.?$/.test(text))) {
        cell.classList.add('betterais-cell-blank');
      } else if (i === titleCol) {
        cell.classList.add('betterais-cell-title');
      } else if (text.length > 22) {
        cell.classList.add('betterais-cell-wide');
      }
    });
  }

  // a row that isn't data: empty spacer, or a single-cell heading
  // ("1. semester ZS 2026/2027") - both tagged so either layout can style them
  function markNonDataRow(tr) {
    const visible = Array.from(tr.children).filter((c) => !c.classList.contains('UISTMNumberCellHidden'));
    if (!visible.some((c) => !isBlankCell(c))) {
      tr.classList.add('betterais-row-empty');
    } else if (visible.length === 1) {
      tr.classList.add('betterais-row-title');
    }
    tr.classList.add('betterais-card-span');
  }

  function labelTables(root) {
    root.querySelectorAll('table:not(.betterais-cards):not(.portal_menu)').forEach((table) => {
      const headRow = table.querySelector(':scope > thead > tr.zahlavi');
      const bodyRows = Array.from(table.querySelectorAll(':scope > tbody > tr'));

      if (headRow) {
        const heads = Array.from(headRow.children);
        // spanned headers (timetable, grouped columns) don't map one header
        // to one cell - those tables keep their grid and scroll sideways
        if (heads.some((th) => th.colSpan > 1)) return;
        const labels = heads.map(cellText);
        bodyRows.forEach((tr) => {
          if (tr.children.length === labels.length) labelRow(tr, labels);
          else markNonDataRow(tr);
        });
        table.classList.add('betterais-cards');
        return;
      }

      // No <thead>: some pages (Kontrola plánu, ...) put the header in the
      // body as a plain tr.zahlavi row - possibly several, one per section.
      // Each header row labels the data rows that follow it.
      const headerRows = bodyRows.filter((tr) => tr.classList.contains('zahlavi'));
      if (!headerRows.length || table.querySelector('td[class^="rozvrh-"]')) return;
      if (headerRows.some((tr) => Array.from(tr.children).some((c) => c.colSpan > 1))) return;
      let labels = null;
      bodyRows.forEach((tr) => {
        if (tr.classList.contains('zahlavi')) {
          labels = Array.from(tr.children).map(cellText);
          tr.classList.add('betterais-card-head');
        } else if (labels && tr.children.length === labels.length) {
          labelRow(tr, labels);
        } else {
          markNonDataRow(tr);
        }
      });
      table.classList.add('betterais-cards', 'betterais-rowtable');
    });
  }

  // ---- burger menu ---------------------------------------------------------
  // On a phone the site header (logo row, title, faculty links, counts,
  // logged-in name, sign-out) is replaced by one slim bar with a burger
  // button; everything from the header - plus the page's main tab strip -
  // moves into a slide-in drawer. Built from the site's own links (cloned
  // hrefs), so nothing here hardcodes a URL. Hidden on desktop by CSS.

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function cleanText(node) {
    return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function drawerLink(href, label, extra) {
    const a = el('a', 'ba-drawer-link');
    a.href = href;
    a.append(el('span', 'ba-drawer-label', label));
    if (extra) a.append(extra);
    return a;
  }

  function drawerSection(title, links) {
    const section = el('section', 'ba-drawer-section');
    if (title) section.append(el('h2', 'ba-drawer-heading', title));
    links.forEach((link) => section.append(link));
    return section;
  }

  function buildMobileNav() {
    if (document.getElementById('betterais-mbar')) return;
    const header = document.getElementById('hlavicka');
    if (!header) return;

    const lang = (new URLSearchParams(location.search).get('lang') || 'sk').toLowerCase();
    const loggedIn = !!document.getElementById('log');
    const sections = [];

    // the page's primary tab strip (Portál študenta: Moje štúdium, E-index...)
    const tabs = document.querySelector('.mainpage table.portal_menu');
    if (tabs) {
      const links = Array.from(tabs.querySelectorAll('td.odsazena a')).map((a) => {
        const link = drawerLink(a.href, cleanText(a));
        if (a.closest('b')) link.classList.add('is-active');
        return link;
      });
      if (links.length) {
        const title = cleanText(document.querySelector('#titulek h1')) || 'Navigácia';
        sections.push(drawerSection(title, links));
        tabs.classList.add('betterais-in-drawer');
      }
    }

    // messages / documents / tasks: the site renders each as two separate
    // links (count, label) to the same URL - merge them into one row
    const counts = new Map();
    header.querySelectorAll('#ema a').forEach((a) => {
      const entry = counts.get(a.href) || { count: '', label: '' };
      const text = cleanText(a);
      if (/^\d+$/.test(text)) entry.count = text;
      else entry.label = text;
      counts.set(a.href, entry);
    });
    if (counts.size) {
      const links = Array.from(counts, ([href, { count, label }]) => {
        const badge = el('span', 'ba-drawer-badge', count || '0');
        if (count && count !== '0') badge.classList.add('is-nonzero');
        const name = label ? label.charAt(0).toUpperCase() + label.slice(1) : href;
        return drawerLink(href, name, badge);
      });
      sections.push(drawerSection('Schránka', links));
    }

    const langLinks = Array.from(header.querySelectorAll('#vlajky a')).map((a) => {
      const label = a.querySelector('[title]')?.getAttribute('title') || a.title || cleanText(a);
      return drawerLink(a.href, label);
    });
    if (langLinks.length) sections.push(drawerSection('Jazyk', langLinks));

    const facultyLinks = Array.from(header.querySelectorAll('#odkazy_fakult a')).map((a) => {
      const link = drawerLink(a.href, cleanText(a));
      link.target = '_blank';
      link.rel = 'noopener';
      return link;
    });
    if (facultyLinks.length) {
      const details = el('details', 'ba-drawer-section ba-drawer-faculties');
      details.append(el('summary', 'ba-drawer-heading', 'Fakulty'));
      const grid = el('div', 'ba-drawer-grid');
      facultyLinks.forEach((link) => grid.append(link));
      details.append(grid);
      sections.push(details);
    }

    const logout = header.querySelector('#ikonky a[href*="logout"]');
    if (logout) {
      const link = drawerLink(logout.href, logout.title || 'Odhlásiť sa');
      link.classList.add('ba-drawer-logout');
      sections.push(drawerSection('', [link]));
    }

    // bar
    const bar = el('div', '');
    bar.id = 'betterais-mbar';
    const home = el('a', 'ba-mbar-home');
    home.href = loggedIn ? `/auth/?lang=${lang}` : `/?lang=${lang}`;
    home.setAttribute('aria-label', cleanText(document.getElementById('univerzita')) || 'Domov');
    home.append(el('span', 'ba-mbar-logo'), el('span', 'ba-mbar-title', 'UIS'));
    const burger = el('button', 'ba-mbar-burger');
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'betterais-drawer');
    burger.append(el('span'), el('span'), el('span'));
    bar.append(home, burger);

    // drawer
    const scrim = el('div', '');
    scrim.id = 'betterais-scrim';
    const drawer = el('nav', '');
    drawer.id = 'betterais-drawer';
    drawer.setAttribute('aria-label', 'Menu');
    drawer.setAttribute('aria-hidden', 'true');
    const top = el('div', 'ba-drawer-top');
    const who = el('div', 'ba-drawer-user');
    const name = cleanText(document.getElementById('log')).replace(/^[^:]*:\s*/, '');
    who.textContent = name || cleanText(document.getElementById('univerzita'));
    const close = el('button', 'ba-drawer-close');
    close.type = 'button';
    close.setAttribute('aria-label', 'Zavrieť');
    top.append(who, close);
    drawer.append(top, ...sections);
    // stagger index for the open animation (see .ba-drawer-link in style.css)
    drawer.querySelectorAll('.ba-drawer-heading, .ba-drawer-link').forEach((node, i) => {
      node.style.setProperty('--ba-i', Math.min(i, 14));
    });

    function setOpen(open) {
      document.documentElement.classList.toggle('betterais-drawer-open', open);
      burger.setAttribute('aria-expanded', String(open));
      drawer.setAttribute('aria-hidden', String(!open));
    }
    burger.addEventListener('click', () => setOpen(true));
    close.addEventListener('click', () => setOpen(false));
    scrim.addEventListener('click', () => setOpen(false));
    drawer.addEventListener('click', (e) => {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });

    document.body.prepend(bar, scrim, drawer);
  }

  function run() {
    labelTables(document);
    buildMobileNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

// Adds an "export to calendar" button to the personal timetable page
// (rozvrhy_view.pl). The grid on that page is a weekly summary with no
// dates, so instead of scraping it we re-submit the page's own form in
// "Zoznam rozvrhových akcii" + "konkrétny v dňoch" mode: AIS then lists every
// single occurrence with its real date, which already accounts for holidays,
// odd/even weeks and one-off changes. That list becomes an .ics file.
(function () {
  'use strict';

  // Wide enough to cover any semester the timetable belongs to - AIS only
  // returns events from the selected period, so the extra months are free.
  const RANGE_MONTHS = 7;
  const TZID = 'Europe/Bratislava';

  // Language comes from the popup's setting (i18n.js is loaded before this
  // file). Starts on the 'auto' guess and is corrected once storage answers.
  const i18n = window.BetterAisI18n;
  let t = i18n.translator(i18n.resolve('auto'));

  // Column order of #tmtab_1 in the list view (same in SK and EN):
  // Deň | Od | Do | Predmet | Akcia | Miestnosť | Vyučujúci | ...
  const COL = { day: 0, from: 1, to: 2, subject: 3, kind: 4, room: 5, teacher: 6 };

  function findForm() {
    const select = document.querySelector('select[name="format"]');
    const form = select && select.form;
    if (!form || !form.querySelector('input[name="rozvrh_student"]')) return null;
    return form;
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function aisDate(date) {
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
  }

  function shiftMonths(months) {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date;
  }

  async function fetchEventList(form) {
    const data = new FormData(form);
    data.set('format', 'list');
    data.set('typ_vypisu', 'konani');
    data.set('konani_od', aisDate(shiftMonths(-RANGE_MONTHS)));
    data.set('konani_do', aisDate(shiftMonths(RANGE_MONTHS)));
    data.set('zobraz2', '1');
    const response = await fetch(form.action, { method: 'POST', body: data, credentials: 'include' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return new DOMParser().parseFromString(await response.text(), 'text/html');
  }

  // Cell text without the <sup>(1,2)</sup> footnote markers AIS appends.
  function cellText(cell) {
    if (!cell) return '';
    const clone = cell.cloneNode(true);
    clone.querySelectorAll('sup').forEach((sup) => sup.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  // "Po 05.10.2026" + "8.00" -> "20261005T080000"
  function icsDateTime(dayCell, time) {
    const date = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(dayCell);
    const clock = /(\d{1,2})[.:](\d{2})/.exec(time);
    if (!date || !clock) return null;
    return `${date[3]}${pad(date[2])}${pad(date[1])}T${pad(clock[1])}${clock[2]}00`;
  }

  function parseEvents(doc) {
    const table = doc.querySelector('#tmtab_1');
    if (!table || !table.tBodies[0]) return [];
    return Array.from(table.tBodies[0].rows).map((row) => {
      const cells = row.cells;
      const day = cellText(cells[COL.day]);
      return {
        start: icsDateTime(day, cellText(cells[COL.from])),
        end: icsDateTime(day, cellText(cells[COL.to])),
        subject: cellText(cells[COL.subject]),
        kind: cellText(cells[COL.kind]),
        room: cellText(cells[COL.room]),
        teacher: cellText(cells[COL.teacher]),
      };
    }).filter((event) => event.start && event.end && event.subject);
  }

  function escapeText(value) {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  // RFC 5545 caps lines at 75 octets; continuation lines start with a space.
  // Count UTF-8 bytes, not characters, so Slovak diacritics don't overflow.
  function fold(line) {
    const encoder = new TextEncoder();
    const parts = [];
    let current = '';
    let bytes = 0;
    for (const char of line) {
      const size = encoder.encode(char).length;
      const limit = parts.length ? 74 : 75; // continuation lines lose 1 to the space
      if (bytes + size > limit) {
        parts.push(current);
        current = '';
        bytes = 0;
      }
      current += char;
      bytes += size;
    }
    parts.push(current);
    return parts.join('\r\n ');
  }

  // Stable across exports, so re-importing updates events instead of
  // duplicating them in calendars that honour UIDs.
  function uid(event) {
    const key = `${event.start}|${event.subject}|${event.kind}|${event.room}`;
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
    return `${event.start}-${(hash >>> 0).toString(16)}@betterais`;
  }

  function buildIcs(events) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BetterAis//STU timetable//SK',
      'CALSCALE:GREGORIAN',
      `X-WR-CALNAME:${escapeText(t('icsCalendarName'))}`,
      `X-WR-TIMEZONE:${TZID}`,
      'BEGIN:VTIMEZONE',
      `TZID:${TZID}`,
      'BEGIN:DAYLIGHT',
      'TZOFFSETFROM:+0100',
      'TZOFFSETTO:+0200',
      'TZNAME:CEST',
      'DTSTART:19700329T020000',
      'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
      'END:DAYLIGHT',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0200',
      'TZOFFSETTO:+0100',
      'TZNAME:CET',
      'DTSTART:19701025T030000',
      'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
      'END:STANDARD',
      'END:VTIMEZONE',
    ];
    events.forEach((event) => {
      const summary = event.kind ? `${event.subject} (${event.kind})` : event.subject;
      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid(event)}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=${TZID}:${event.start}`,
        `DTEND;TZID=${TZID}:${event.end}`,
        `SUMMARY:${escapeText(summary)}`
      );
      if (event.room) lines.push(`LOCATION:${escapeText(event.room)}`);
      if (event.teacher) lines.push(`DESCRIPTION:${escapeText(event.teacher)}`);
      lines.push('END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  function download(filename, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function inject() {
    const form = findForm();
    if (!form || document.querySelector('.betterais-ics')) return;

    const bar = document.createElement('div');
    bar.className = 'betterais-ics';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'betterais-ics-btn';
    const status = document.createElement('span');
    status.className = 'betterais-ics-status';
    bar.append(button, status);

    // The last status shown, kept as a key + vars so a language switch can
    // re-render it instead of leaving a message in the old language.
    let lastStatus = null;
    function setStatus(key, vars) {
      lastStatus = key && { key, vars };
      status.textContent = key ? t(key, vars) : '';
    }
    function relabel() {
      button.textContent = t('icsButton');
      if (lastStatus) setStatus(lastStatus.key, lastStatus.vars);
    }
    relabel();

    function setLanguage(setting) {
      t = i18n.translator(i18n.resolve(setting));
      relabel();
    }
    // `uiLanguage` - see popup.js for why not the old `language` key
    chrome.storage.local.get('uiLanguage', (data) => setLanguage(data.uiLanguage || 'auto'));
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.uiLanguage) setLanguage(changes.uiLanguage.newValue || 'auto');
    });

    button.addEventListener('click', async () => {
      button.disabled = true;
      setStatus('icsLoading');
      try {
        const events = parseEvents(await fetchEventList(form));
        if (!events.length) {
          setStatus('icsEmpty');
          return;
        }
        download('rozvrh.ics', buildIcs(events));
        setStatus('icsDone', { count: events.length });
      } catch (error) {
        setStatus('icsError', { error: error.message });
      } finally {
        button.disabled = false;
      }
    });

    const title = document.getElementById('titulek');
    if (title) {
      title.after(bar);
    } else {
      form.before(bar);
    }
  }

  inject();
})();

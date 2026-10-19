// Preset themes vendored in themes.css from github.com/greenythebeany/
// jellywave. Swatch colors here are just for the picker preview - the real
// palette (a dozen-odd variables per theme) lives in themes.css and is
// applied by content.js setting the data-theme attribute to `slug`.
const PRESET_THEMES = [
    { slug: 'catppuccin-mocha', label: 'Catppuccin Mocha', bg: '#1e1e2e', accent: '#cba6f7' },
    { slug: 'catppuccin-macchiato', label: 'Catppuccin Macchiato', bg: '#24273a', accent: '#c6a0f6' },
    { slug: 'catppuccin-frappe', label: 'Catppuccin Frappé', bg: '#303446', accent: '#ca9ee6' },
    { slug: 'catppuccin-latte', label: 'Catppuccin Latte', bg: '#eff1f5', accent: '#8839ef' },
    { slug: 'dracula', label: 'Dracula', bg: '#282a36', accent: '#bd93f9' },
    { slug: 'nord', label: 'Nord', bg: '#2e3440', accent: '#88c0d0' },
    { slug: 'gruvbox-dark', label: 'Gruvbox Dark', bg: '#282828', accent: '#fe8019' },
    { slug: 'gruvbox-light', label: 'Gruvbox Light', bg: '#fbf1c7', accent: '#af3a03' },
    { slug: 'tokyonight', label: 'Tokyo Night', bg: '#1a1b26', accent: '#7aa2f7' },
    { slug: 'rose-pine', label: 'Rosé Pine', bg: '#191724', accent: '#c4a7e7' },
    { slug: 'rose-pine-moon', label: 'Rosé Pine Moon', bg: '#232136', accent: '#c4a7e7' },
    { slug: 'rose-pine-dawn', label: 'Rosé Pine Dawn', bg: '#faf4ed', accent: '#907aa9' },
    { slug: 'kanagawa', label: 'Kanagawa', bg: '#1f1f28', accent: '#957fb8' },
    { slug: 'solarized-dark', label: 'Solarized Dark', bg: '#002b36', accent: '#268bd2' },
    { slug: 'solarized-light', label: 'Solarized Light', bg: '#fdf6e3', accent: '#268bd2' },
];

document.addEventListener('DOMContentLoaded', function () {
    const themeButtons = document.querySelectorAll('#themeSwitch button');
    const reloadButton = document.getElementById('reload-button');
    const colorOptions = document.querySelectorAll('.color-option');
    const themeGrid = document.getElementById('themeGrid');
    const themeSwitch = document.getElementById('themeSwitch');
    const scheduleEnabled = document.getElementById('scheduleEnabled');
    const scheduleStart = document.getElementById('scheduleStart');
    const scheduleEnd = document.getElementById('scheduleEnd');
    const scheduleTimes = document.getElementById('scheduleTimes');
    const scheduleHint = document.getElementById('scheduleHint');

    const languageButtons = document.querySelectorAll('#languageSwitch button');
    let languageSetting = 'auto';
    let t = BetterAisI18n.translator(BetterAisI18n.resolve(languageSetting));

    // Fills every [data-i18n] element, then re-renders the bits built in JS
    // (schedule hint, "None" preset chip) that carry their own text.
    function applyLanguage(setting) {
        languageSetting = setting;
        const lang = BetterAisI18n.resolve(setting);
        t = BetterAisI18n.translator(lang);
        document.documentElement.lang = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = t(el.dataset.i18n);
        });
        languageButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === setting);
        });
        const noneLabel = themeGrid.querySelector('.theme-chip[data-slug=""] .theme-chip-label');
        if (noneLabel) noneLabel.textContent = t('presetNone');
        renderSchedule();
    }

    // Manual dark/light pick, kept separately from the schedule so turning
    // the schedule off restores whatever the user had chosen before.
    let manualTheme = 'light';

    // Mirrors inDarkWindow() in content.js - keep the two in sync.
    function toMinutes(hhmm) {
        const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
        return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    }

    function inDarkWindow(schedule, now) {
        const start = toMinutes(schedule.start);
        const end = toMinutes(schedule.end);
        if (start === null || end === null || start === end) return false;
        const minutes = now.getHours() * 60 + now.getMinutes();
        return start < end
            ? minutes >= start && minutes < end
            : minutes >= start || minutes < end;
    }

    function readSchedule() {
        return {
            enabled: scheduleEnabled.checked,
            start: scheduleStart.value || '22:00',
            end: scheduleEnd.value || '06:00',
        };
    }

    function setPopupTheme(theme) {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        document.body.classList.toggle('light-mode', theme === 'light');
    }

    // Reflects the schedule in the UI: locks the manual switch, highlights
    // whichever side is currently in effect, and explains it in a hint.
    function renderSchedule() {
        const schedule = readSchedule();
        scheduleTimes.classList.toggle('disabled', !schedule.enabled);
        themeSwitch.classList.toggle('locked', schedule.enabled);

        if (!schedule.enabled) {
            scheduleHint.textContent = '';
            setThemeButtons(manualTheme);
            setPopupTheme(manualTheme);
            return;
        }

        const effective = inDarkWindow(schedule, new Date()) ? 'dark' : 'light';
        setThemeButtons(effective);
        setPopupTheme(effective);
        scheduleHint.textContent = schedule.start === schedule.end
            ? t('scheduleSame')
            : t('scheduleHint', { start: schedule.start, end: schedule.end, now: t(effective).toLowerCase() });
    }

    function saveSchedule() {
        const schedule = readSchedule();
        chrome.storage.local.set({ schedule });
        renderSchedule();
        notifyContentScript({ schedule });
    }

    function setThemeButtons(theme) {
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    // A tiny page mock-up in the theme's own colours: its background, an
    // accent dot and title line, and a faded body line - reads as "what the
    // site will look like" rather than an abstract colour split.
    function swatchMarkup(bg, accent) {
        return `<span class="theme-swatch" style="--sw-bg: ${bg}; --sw-accent: ${accent}">` +
            '<span class="sw-dot"></span>' +
            '<span class="sw-lines"><span class="sw-line"></span><span class="sw-line sw-line-soft"></span></span>' +
            '</span>';
    }

    // Builds the "None" chip (falls back to the Theme/Accent color cards
    // above) plus one chip per PRESET_THEMES entry.
    function buildThemeGrid(activeSlug) {
        themeGrid.innerHTML = '';

        const none = document.createElement('button');
        none.type = 'button';
        none.className = 'theme-chip';
        none.dataset.slug = '';
        // "None" previews the manual Theme + Accent choice, via the popup's own vars
        none.innerHTML = swatchMarkup('var(--bg)', 'var(--link)') + '<span class="theme-chip-label"></span>';
        none.querySelector('.theme-chip-label').textContent = t('presetNone');
        themeGrid.appendChild(none);

        PRESET_THEMES.forEach(preset => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'theme-chip';
            chip.dataset.slug = preset.slug;
            chip.innerHTML = swatchMarkup(preset.bg, preset.accent) +
                `<span class="theme-chip-label">${preset.label}</span>`;
            themeGrid.appendChild(chip);
        });

        setActiveThemeChip(activeSlug);
    }

    function setActiveThemeChip(activeSlug) {
        themeGrid.querySelectorAll('.theme-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.slug === (activeSlug || ''));
        });
    }

    function notifyContentScript(payload) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, payload);
        });
    }

    // Load saved preferences (defaults must match content.js)
    chrome.storage.local.get(['theme', 'linkColor', 'forcedTheme', 'schedule', 'uiLanguage'], function (data) {
        const linkColor = data.linkColor || '#7a1030';
        const forcedTheme = data.forcedTheme || '';
        const schedule = Object.assign({ enabled: false, start: '22:00', end: '06:00' }, data.schedule || {});
        manualTheme = data.theme || 'light';

        scheduleEnabled.checked = schedule.enabled;
        scheduleStart.value = schedule.start;
        scheduleEnd.value = schedule.end;

        document.documentElement.style.setProperty('--link', linkColor);
        buildThemeGrid(forcedTheme);
        // Stored under `uiLanguage`, not the old `language` key: that one was
        // also written by AIS flag clicks (removed UA/RU feature), so it could
        // hold a pick the user never made here and pin the wrong language.
        // Anything not offered any more falls back to Auto.
        applyLanguage(BetterAisI18n.LANGUAGES.includes(data.uiLanguage) ? data.uiLanguage : 'auto');

        colorOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.color === linkColor);
        });
    });

    // Picking a preset overrides colors regardless of the Theme/Accent
    // color cards above; picking a Theme/Accent option below clears any
    // active preset so the manual choice visibly takes effect instead of
    // silently doing nothing.
    themeGrid.addEventListener('click', function (event) {
        const chip = event.target.closest('.theme-chip');
        if (!chip) return;
        const forcedTheme = chip.dataset.slug;

        chrome.storage.local.set({ forcedTheme });
        setActiveThemeChip(forcedTheme);
        notifyContentScript({ forcedTheme });
    });

    // Handle theme toggle
    themeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const theme = this.dataset.theme;

            manualTheme = theme;
            chrome.storage.local.set({ theme, forcedTheme: '' });
            setPopupTheme(theme);
            setThemeButtons(theme);
            setActiveThemeChip('');

            notifyContentScript({ theme, forcedTheme: '' });
        });
    });

    languageButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const language = this.dataset.lang;
            chrome.storage.local.set({ uiLanguage: language });
            applyLanguage(language);
        });
    });

    scheduleEnabled.addEventListener('change', saveSchedule);
    scheduleStart.addEventListener('change', saveSchedule);
    scheduleEnd.addEventListener('change', saveSchedule);

    // Handle color selection
    colorOptions.forEach(option => {
        option.addEventListener('click', function () {
            const linkColor = this.dataset.color;

            chrome.storage.local.set({ linkColor, forcedTheme: '' });
            document.documentElement.style.setProperty('--link', linkColor);
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            setActiveThemeChip('');

            notifyContentScript({ linkColor, forcedTheme: '' });
        });
    });

    // Credits & licenses page bundled with the extension (licenses.html)
    document.getElementById('creditsLink').addEventListener('click', function () {
        chrome.tabs.create({ url: chrome.runtime.getURL('licenses.html') });
    });

    // Reload the current tab so updated CSS/content scripts take effect.
    //
    // Do NOT call chrome.runtime.reload() here: it tears down the extension
    // synchronously, killing this popup's own JS context before the async
    // tabs callback can run - so the tab never actually reloaded. Reloading
    // the tab alone is enough, since content scripts and CSS are re-injected
    // on every page load anyway.
    reloadButton.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) chrome.tabs.reload(tabs[0].id);
            window.close();
        });
    });
});

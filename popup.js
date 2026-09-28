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

    function setThemeButtons(theme) {
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    // Builds the "None" chip (falls back to the Theme/Accent color cards
    // above) plus one chip per PRESET_THEMES entry.
    function buildThemeGrid(activeSlug) {
        themeGrid.innerHTML = '';

        const none = document.createElement('button');
        none.type = 'button';
        none.className = 'theme-chip';
        none.dataset.slug = '';
        none.innerHTML = '<span class="theme-swatch theme-swatch-none"></span><span class="theme-chip-label">None</span>';
        themeGrid.appendChild(none);

        PRESET_THEMES.forEach(preset => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'theme-chip';
            chip.dataset.slug = preset.slug;
            chip.innerHTML =
                `<span class="theme-swatch" style="background: linear-gradient(135deg, ${preset.bg} 55%, ${preset.accent} 55%)"></span>` +
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
    chrome.storage.local.get(['theme', 'linkColor', 'forcedTheme'], function (data) {
        const theme = data.theme || 'light';
        const linkColor = data.linkColor || '#7a1030';
        const forcedTheme = data.forcedTheme || '';

        document.body.classList.toggle('dark-mode', theme === 'dark');
        document.body.classList.toggle('light-mode', theme === 'light');
        document.documentElement.style.setProperty('--link', linkColor);
        setThemeButtons(theme);
        buildThemeGrid(forcedTheme);

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

            chrome.storage.local.set({ theme, forcedTheme: '' });
            document.body.classList.toggle('dark-mode', theme === 'dark');
            document.body.classList.toggle('light-mode', theme === 'light');
            setThemeButtons(theme);
            setActiveThemeChip('');

            notifyContentScript({ theme, forcedTheme: '' });
        });
    });

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

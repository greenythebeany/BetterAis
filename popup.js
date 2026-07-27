document.addEventListener('DOMContentLoaded', function () {
    const themeButtons = document.querySelectorAll('#themeSwitch button');
    const reloadButton = document.getElementById('reload-button');
    const colorOptions = document.querySelectorAll('.color-option');

    function setThemeButtons(theme) {
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    function notifyContentScript(payload) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, payload);
        });
    }

    // Load saved preferences (defaults must match content.js)
    chrome.storage.local.get(['theme', 'linkColor'], function (data) {
        const theme = data.theme || 'light';
        const linkColor = data.linkColor || '#7a1030';

        document.body.classList.toggle('dark-mode', theme === 'dark');
        document.body.classList.toggle('light-mode', theme === 'light');
        document.documentElement.style.setProperty('--link', linkColor);
        setThemeButtons(theme);

        colorOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.color === linkColor);
        });
    });

    // Handle theme toggle
    themeButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            const theme = this.dataset.theme;

            chrome.storage.local.set({ theme });
            document.body.classList.toggle('dark-mode', theme === 'dark');
            document.body.classList.toggle('light-mode', theme === 'light');
            setThemeButtons(theme);

            notifyContentScript({ theme });
        });
    });

    // Handle color selection
    colorOptions.forEach(option => {
        option.addEventListener('click', function () {
            const linkColor = this.dataset.color;

            chrome.storage.local.set({ linkColor });
            document.documentElement.style.setProperty('--link', linkColor);
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');

            notifyContentScript({ linkColor });
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

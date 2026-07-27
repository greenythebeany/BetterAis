# BetterAis - STU AIS Visual Redesign

BetterAis is a browser extension that rebuilds the interface of the STU Academic Information System
([is.stuba.sk](https://is.stuba.sk)). The site's own layout dates from the mid-2000s: fixed-width banner
tables, hardcoded pixel widths, inline `font-size: 10px` cells and a maroon header graphic. This extension
replaces that with a flat, modern intranet design in light and dark themes, without breaking any of the
site's functionality.

**Version 3.0**

---

## Design direction

The visual language is "flat modern intranet": real 1px borders instead of shadows, tight corner radii,
generous whitespace, and restrained use of color. Roboto throughout, no monospace.

The single most important rule is how the accent color is used. Almost every piece of content on AIS is a
link, so coloring all links with the accent turns entire pages into a wall of one color. Instead, body links
use normal text color, and the accent is reserved for items the site itself marks as important (wrapped in
`<b>`), primary buttons, active tabs, and hover feedback.

STU's own heritage maroon (`#7a1030`) is the default accent, and light mode is the default theme.

---

## Features

### Themes and color
- Light and dark themes, with light as the default.
- Custom accent color, chosen from a curated palette in the popup.
- The accent is stored raw as `--link-raw` and derived per theme into `--link`. In dark mode it is lightened
  slightly, because a dark saturated color used as text on a near-black surface has almost no contrast.
  Light mode uses the raw value unchanged.
- Preferences are saved in `chrome.storage.local` and mirrored to `localStorage`.

### Instant, flash-free load
The theme is read synchronously from `localStorage` and applied to `<html>` at `document_start`, before
`<body>` exists, so the original unstyled page is never visible. `chrome.storage.local` is treated as the
source of truth and reconciled immediately afterward.

### Unified icon set
The site ships several unrelated icon systems: an SVG sprite (`icons.svg`), a separate section sprite
(`menitka.svg`), and raster PNGs served from `img.pl`. `icons.js` replaces them with
[Tabler Icons](https://tabler.io/icons) (MIT), inlined as SVG so there are no external requests.

Replaced: breadcrumb icons, notice and alert icons, dashboard section icons, collapsed section icons, the
sign-out control, and the date and name-day icons.

Two categories are deliberately handled differently:

- **Sprites with an inline `--uc-fill-inner`** carry meaning through color - green for a passed subject, gold
  for a compulsory elective, navy for compulsory, red for a failure. These keep their original colors, since
  making them monochrome would discard information that is read at a glance in the grades table.
- **Sprites without it** are neutral interface glyphs (paginator arrows, refresh, tree chevrons). They had no
  theme-aware color at all and fell back to a fixed site default, so they follow the surrounding text color.

Language flags are redrawn as vectors. The originals are 17x11 pixel PNGs, far too small to enlarge without
blurring.

### Layout fixes
- Fixed-width centered content container, so the page no longer resizes when switching tabs. The original
  cause was the site's shrink-to-fit layout tables sizing the content column differently on every page.
- Data tables fill their container and size columns properly. The site's hardcoded `nowrap` attributes and
  inline header `white-space: nowrap` are overridden so columns distribute across the full width.
- Application pages (Portal studenta, e-index and similar) get styled tab strips, data tables with zebra
  striping and tabular numerals, application shortcut tiles, legends, and form controls. None of this was
  styled before.
- Detail tables that have no table header are matched structurally and styled as label/value blocks.
- The header logo is restored, sized from a single `--logo-h` token with width derived from the source
  image's 525x82 ratio so it cannot be clipped.

### Restored functionality
The site's own stylesheets are left enabled. They are not purely decorative: rules keyed to data attributes
control which two-factor fields are visible, and icon sizing is computed from CSS custom properties they
define. Disabling them breaks that logic, so every visual property is overridden explicitly instead.

One earlier regression is worth recording. Hiding `#titulek` sitewide, to remove a duplicated title on the
login page, also hid the page heading and the semester selector on the e-index page. It is now hidden only on
the login page.

---

## Installation

The extension is not on the Chrome Web Store, so it is installed manually.

1. Clone the repository:
   ```bash
   git clone https://github.com/greenythebeany/BetterAis.git
   ```
2. Open a Chromium-based browser (Chrome, Brave, or Edge).
3. Go to `chrome://extensions/` (or `brave://extensions/`).
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked**.
6. Select the project folder, the one containing `manifest.json`.

Pin the extension to the toolbar to keep the popup one click away.

### Applying changes during development
CSS and content scripts are only re-read when the extension itself is reloaded. After editing any file:

1. Open `chrome://extensions/` and click the reload icon on the BetterAis card.
2. Hard-refresh the AIS tab with `Ctrl+Shift+R`.

Changing theme or accent color in the popup applies live and does not need either step.

---

## File structure

```plaintext
BetterAis/
├── manifest.json     Extension configuration (Manifest V3)
├── content.js        Applies theme and accent at document_start
├── icons.js          Replaces the site's icon systems with Tabler Icons
├── style.css         Sitewide redesign
├── login.css         Login page only (/auth/ and /system/login.pl)
├── popup.html        Popup interface
├── popup.js          Popup logic and messaging
└── icons/            Extension icons, generated from icon_big.png
```

`login.css` is scoped to the login pages, which use the same markup at two different URLs.

---

## Notes and limitations

- Runs only on `is.stuba.sk`, as declared in `manifest.json`.
- Desktop only. The content container has a minimum width and there is no mobile layout.
- Slovak pages wrap the header row in `#ie1`, English pages use `#ie2`. Every header rule covers both,
  otherwise the English header loses its layout entirely.
- Brave Shields blocks the site's `cookiebar.min.js`, since its URL carries `tracking=1&thirdparty=1`. The
  resulting console error is unrelated to this extension and harmless.
- The site's `Feature-Policy` header warnings for `speaker` and `vr` also come from the server, not from here.

---

## Credits

Icons are [Tabler Icons](https://tabler.io/icons), MIT licensed.

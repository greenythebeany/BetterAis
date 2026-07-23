# BetterAis – STUBA Visual Enhancer

BetterAis is a Chrome extension that visually customizes the [is.stuba.sk](https://is.stuba.sk) website.  
It allows you to switch between **Dark** and **Light** themes and choose your own **link color** directly from a convenient popup menu.

---

## 🚀 Features
- 🌙 **Dark/Light theme toggle** – switch the site’s appearance instantly.  
- 🎨 **Custom colors** – pick from multiple predefined colors.  
- 💾 **Saved preferences** – settings are stored and auto-applied on reload.  
- ⚡ **Quick access popup** – manage all options in one click.  

---

## 📥 Installation (Developer Mode)
Since this extension is not on the Chrome Web Store, you must install it manually:

1. **Download or clone this repository**  
   ```bash
   git clone https://github.com/Greenythebeany/BetterAis.git
   ```
2. Open **Google Chrome** (or another Chromium-based browser such as Edge or Brave).  
3. Navigate to:  
   ```
   chrome://extensions/
   ```
4. In the top-right corner, enable **Developer mode**.  
5. Click **"Load unpacked"**.  
6. Select the project folder (the one containing `manifest.json`).  
7. The extension will now be installed and active.  

---

## 📌 Recommended Setup
- **Pin the extension to your toolbar**:  
  1. Click the puzzle piece icon (🔧 Extensions).  
  2. Find **BetterAis** in the list.  
  3. Click the 📌 **pin icon** to keep it in the toolbar.  

This way, the popup is always one click away for:  
- Switching between **dark/light** mode.  
- Changing your **link color**.  
- Managing preferences without reopening settings.  

---

## 📂 File Structure
```plaintext
betterais/
│
├── manifest.json        # Extension configuration
├── popup.html           # Popup interface
├── popup.js             # Popup logic (UI + messaging)
├── content.js           # Applies changes to is.stuba.sk
├── style.css            # Theme + link color styles
└── icons/               # Extension icons
```

---

## 📝 Notes
- Currently works only on **is.stuba.sk** (as defined in `manifest.json`).  
  

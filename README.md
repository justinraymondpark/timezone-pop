# Timezone Pop

A tiny browser extension that converts a time across your favorite timezones. Type `5pm ET`, `17:00 GMT`, `9:30am Irish` — get a neat list of the equivalent times in New York, London, Tokyo, and wherever else you work. Click any row to copy a pasteable string like `5pm ET / 2pm PT`.

No accounts. No network. No tracking. Everything happens on your device.

## Features

- Natural-language input: `3pm`, `15:00`, `9:30am CT`, `at 8 JST`, `11 irish`.
- Common zone abbreviations built in: ET/CT/MT/PT, GMT/UTC, BST, CET, JST, IST, HKT, AEST, NZST, and more.
- Disambiguates overlapping abbreviations (CST → US Central or China Standard; IST → India, Ireland, or Israel) via a one-time setting.
- Pick a **home zone** ⭐ — the source used when you type a time without specifying one.
- Customizable target list with labels, short-codes (e.g. `ET` instead of `EDT`), colors, and ordering.
- 12- or 24-hour format.
- Auto-detects times from your current tab's selection or focused field when you open the popup.
- Click-to-copy any row.

## Install

**Chrome / Edge / Brave**: [Chrome Web Store listing](#) _(coming soon)_
**Firefox**: [Mozilla Add-ons listing](#) _(coming soon)_

### Load unpacked (for development)

Chromium:
1. Go to `chrome://extensions`.
2. Enable _Developer mode_.
3. Click _Load unpacked_ and select this folder.

Firefox:
1. Go to `about:debugging#/runtime/this-firefox`.
2. Click _Load Temporary Add-on…_ and select `manifest.json`.

## Usage

Click the Timezone Pop icon (or pin it to the toolbar). Type a time. The popup instantly shows the equivalents in each of your target zones.

Input examples:

| You type                | Interpreted as                               |
| ----------------------- | -------------------------------------------- |
| `3pm`                   | 15:00 in your home zone                      |
| `15:30`                 | 15:30 in your home zone (24h)                |
| `9am ET`                | 09:00 America/New_York                       |
| `17:00 GMT`             | 17:00 UTC                                    |
| `8:30 JST`              | 08:30 Asia/Tokyo                             |
| `11 irish`              | 11:00 Europe/Dublin                          |
| `at 6pm pacific`        | 18:00 America/Los_Angeles                    |

If you open the popup while a time like `2pm PT` is selected on the page (or typed in a focused input), it's picked up automatically.

## Settings

Open the options page from the popup's footer _Settings_ link.

- **Target zones** — add/remove/reorder. Each target has an optional short-code override (displayed on its pill) and a color.
- **Home zone** — click ☆ on any target to mark it ★. This becomes the source zone for inputs that don't include one. If no target is starred, your system zone is used.
- **Format** — 12- or 24-hour.
- **Ambiguous abbreviations** — pick what `CST` and `IST` mean for you.

Preferences are stored via `chrome.storage.sync`, so they follow your browser profile across devices.

## Permissions, explained

| Permission    | Why                                                                                     |
| ------------- | --------------------------------------------------------------------------------------- |
| `storage`     | Save your target list, home zone, and format preferences.                               |
| `activeTab`   | When the popup is opened, read the current selection or focused field on the active tab so the converter can pre-fill with a time like "3pm ET" you're looking at. |
| `scripting`   | Runs a tiny one-shot function in the active tab (only at popup open) to grab that selection/field text. |

No host permissions are declared, no background/service worker runs, no network requests are made. See [PRIVACY.md](PRIVACY.md) for the full privacy statement.

## Project layout

```
manifest.json    MV3 manifest (Chrome + Firefox, gecko id included)
popup.html/.css  Popup UI
popup.js         Popup controller; pulls active-tab context via scripting
options.html/.css Options page
options.js       Settings editor
tz.js            Zone map, parser, wall-clock→instant math, formatting helpers
icons/           16/32/48/128 PNGs
make_icons.py    Regenerates icons from code (Pillow)
```

## Build

The extension is plain HTML/CSS/JS — no bundler, no build step. To regenerate the icon PNGs from `icons/greyscale-icon.svg`:

```bash
python3 -m pip install --user cairosvg
python3 make_icons.py
```

To produce a submission zip:

```bash
zip -r timezone-pop-0.1.0.zip . \
  -x '*.DS_Store' '__pycache__/*' '*.pyc' 'make_icons.py' \
     '.git/*' '*.zip' 'README.md' 'PRIVACY.md' 'LICENSE'
```

(Store reviewers don't need the README/LICENSE inside the package, though including them is harmless. Firefox AMO does want the source to match what's installed; since there's no minification or bundling, shipping the source as-is is fine.)

## License

[MIT](LICENSE) © Justin Raymond Park

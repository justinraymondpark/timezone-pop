# Store submission notes

Copy/paste fodder for the Chrome Web Store and Firefox AMO listings.

## Short description (both stores, ≤132 chars)

> Convert a time across your favorite timezones. Type "5pm ET" — see the equivalents in New York, London, Tokyo, and more.

## Long description

> Timezone Pop is the fastest way to check "what time is that for me?"
>
> Type a time like 5pm ET, 17:00 GMT, or 9:30am Irish, and instantly see the equivalent in each of your saved target zones. Click any row to copy a ready-to-paste string like "5pm ET / 2pm PT" into an email or calendar invite.
>
> • Natural-language input — 3pm, 15:00, 9am Tokyo, at 8 irish.
> • Customize your target list with labels, short-codes (ET instead of EDT), and colors.
> • Pick a home zone so unqualified times resolve the way you expect.
> • Disambiguate CST (US vs. China) and IST (India vs. Ireland vs. Israel) once, not every time.
> • 12- or 24-hour display.
> • Auto-fills from the time you have selected on the current page.
>
> Privacy-first by design: no accounts, no network requests, no analytics, no tracking. Everything runs on your device. Your preferences sync through your browser profile (Chrome Sync / Firefox Sync) only.

## Category

Productivity

## Permissions justifications

If the Chrome Web Store or AMO reviewer asks — paste these verbatim.

### `storage`
> Persists user preferences (target timezones, home zone, 12/24-hour format, CST/IST disambiguation choice) via `chrome.storage.sync` so they follow the user's browser profile. No other data is stored.

### `activeTab`
> When the popup opens, the extension reads the current text selection or focused input on the active tab so it can pre-fill the converter with a time-like string (e.g. "3pm ET") the user is looking at. No other tabs and no other content are accessed. The text is used in-memory only and is never transmitted or persisted.

### `scripting`
> Used in conjunction with `activeTab` to run a single small function (`collectContextInPage` in `popup.js`) in the active tab at the moment the popup is opened. The function returns only the selected/focused text for the pre-fill use case described above. The extension does not inject any persistent scripts.

## Privacy policy URL

Host `PRIVACY.md` at a stable URL (e.g. a GitHub Pages site, a section of thecollectedworks.com, or the repo's raw view) and paste that URL into the Privacy tab of each store listing.

## Single purpose (Chrome Web Store requires this)

> Convert a user-supplied time into the equivalent wall-clock times across the user's saved list of timezones.

## Assets you'll need to supply

**Chrome Web Store**
- 128×128 icon: `icons/icon128.png` ✅ already in the repo
- At least one screenshot: 1280×800 or 640×400 PNG/JPEG (popup doing its thing; popup + options side-by-side is nice)
- Small promo tile (optional but helps ranking): 440×280 PNG
- Marquee promo tile (optional): 1400×560 PNG

**Firefox AMO**
- Icon (64×64 minimum — Firefox will upscale 128): `icons/icon128.png` ✅
- At least one screenshot (no fixed size; 1280×800 recommended)

## Suggested screenshots

1. Popup with input `9am ET` showing rows for NY / London / Tokyo — home zone ET is starred.
2. Popup with empty input (just "current time" state) to show the zero-state.
3. Options page with a couple of targets and one starred.

## Build the submission zip

```bash
cd timezone-pop
zip -r ../timezone-pop-0.1.0.zip . \
  -x '*.DS_Store' '__pycache__/*' '*.pyc' 'make_icons.py' \
     '.git/*' '*.zip' 'STORE_SUBMISSION.md'
```

The zip's root must contain `manifest.json` directly (not inside a folder).

## Firefox-specific

- `manifest.json` already includes `browser_specific_settings.gecko.id` — good.
- AMO will ask if the submission contains any minified/compiled/generated code. Answer **No**; everything is hand-written plain JS.
- `strict_min_version` is set to 115.0, which covers MV3 popup extensions on current ESR and release channels.

## After first submission

- Tag the release (e.g. `git tag v0.1.0`) so you can match uploaded zips to source commits.
- Bump `manifest.json` `version` before each re-upload — stores reject identical versions.

# Timezone Pop Privacy Policy

_Last updated: 2026-04-15_

Timezone Pop is a browser extension that converts a time across timezones. It is designed to run entirely on your device.

## What we collect

**Nothing.** Timezone Pop does not collect, transmit, or share any personal data. There are no analytics, no telemetry, no crash reporting, and no remote servers.

## What the extension accesses

- **Your saved preferences** (target zones, 12/24-hour format, home zone, disambiguation choices) are stored locally using the browser's built-in `storage.sync` API. If you are signed in to your browser profile, these preferences sync between your own devices through your browser vendor (Google or Mozilla) under their respective privacy policies. Timezone Pop itself never receives this data.
- **The active tab, only when you open the popup.** When the popup opens, the extension uses the `activeTab` + `scripting` permissions to read the current text selection or the focused input field on the page. This is used solely to pre-fill the converter when a time-like string is detected (e.g. "3pm ET" selected in an email). The text is processed in-memory inside the popup and is never transmitted anywhere or persisted.

## What the extension does not do

- Does not read your browsing history.
- Does not read page content other than the current selection or focused field at the moment the popup is opened.
- Does not make network requests.
- Does not load remote code.
- Does not include third-party trackers or SDKs.

## Contact

Questions or concerns: studio@thecollectedworks.com

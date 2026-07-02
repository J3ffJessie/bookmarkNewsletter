# bookmarkNewsletter
Chrome extension to take bookmarks and then create a newsletter from the bookmarks and provide that to the user to engage with their bookmarks

## Features
- One-click bookmarking from the toolbar popup (title, URL, favicon, optional note/tag, optional auto-extracted page excerpt)
- Right-click "Add to Newsletter Bookmarks" context menu and a keyboard shortcut (`Ctrl+Shift+S` / `Cmd+Shift+S`) for instant saving
- Bookmarks stored locally via `chrome.storage.local` — no account or server required
- Newsletter tab: filter/select bookmarks, generate a Markdown newsletter with the Groq API, preview it, and export (copy to clipboard or download as `.md`/`.html`)
- Generated newsletters are archived locally so you can revisit past issues
- Works in "collector-only" mode with no API key — the key is only needed when you generate a newsletter
- Settings page for your Groq API key (stored locally, never synced), model, and newsletter tone/length/grouping preferences
- Mobile bookmarking via Chrome Sync: bookmark a page in Chrome on iOS/Android into a watched folder (default "Newsletter"), then import those into the extension from the popup or Settings — a workaround for platforms where Chrome extensions can't run

## Getting started
1. Open `chrome://extensions`, enable **Developer mode**, then click **Load unpacked** and select this project folder.
2. Click the extension icon and use **Save this page** to start collecting bookmarks.
3. Open **Settings** from the popup and add your Groq API key (get one at [console.groq.com/keys](https://console.groq.com/keys)).
4. Click **Newsletter** in the popup, select the bookmarks you want to include, and click **Generate newsletter**.

## Project structure
```
manifest.json
src/
  background/   background service worker (context menu, keyboard shortcut)
  popup/        toolbar popup (save + recent bookmarks)
  options/      settings page (API key, model, preferences)
  newsletter/   newsletter builder (select, generate, preview, export, archive)
  shared/       storage, bookmark capture, Chrome-bookmarks import, Groq API client, tiny Markdown renderer
```

No build step is required — everything is plain HTML/CSS/ES modules loaded directly by Chrome.

## Privacy Policy

_Last updated: 2026-07-01_

This extension does not operate any server, does not collect analytics, and does not sell or share your data with anyone except as described below.

**What's stored, and where.** Bookmarks (title, URL, favicon, your optional note/tag, an auto-extracted excerpt of the page's meta description/visible text, and a timestamp), your Groq API key, your model and newsletter preferences, and any newsletters you generate are all stored locally on your device using Chrome's `chrome.storage.local` — never `chrome.storage.sync`, so none of it is uploaded to Google's servers. Nothing leaves your device except the network request described below.

**What's sent to a third party, and when.** The only outbound data transfer happens when you click "Generate newsletter": the titles, URLs, notes, tags, and excerpts of the bookmarks you selected are sent directly from your browser to Groq's API (`api.groq.com`) using your own Groq API key, for the sole purpose of generating the newsletter text. This request goes straight from your browser to Groq — there is no intermediary server run by the developer of this extension. See [Groq's privacy policy](https://groq.com/privacy-policy) for how they handle that request. Your API key is never sent anywhere except in that request's authorization header.

**Why each permission is needed.**
- `storage` — save your bookmarks, preferences, API key, and newsletter archive locally.
- `activeTab` / `scripting` — when you explicitly click "Save this page" (or use the shortcut/context menu), read that tab's title, URL, and a text excerpt to enrich the bookmark. This never runs in the background or on tabs you haven't chosen to save.
- `contextMenus` — adds the right-click "Add to Newsletter Bookmarks" option.
- `bookmarks` — lets you import bookmarks you saved on another device (e.g. via Chrome on iOS, which can't run extensions) from a watched folder in your native Chrome bookmarks, as an alternative way to get pages into the extension.
- Host permission for `https://api.groq.com/*` — required to send the generate-newsletter request described above.

**Your control over the data.** You can delete individual bookmarks or newsletters from the popup/Newsletter page, or wipe all saved bookmarks at once from Settings. Uninstalling the extension deletes everything Chrome stored for it on your device.

**Contact.** Questions about this policy can be filed as an issue on this repository.

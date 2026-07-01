# Chrome Extension: Bookmark-to-Newsletter Plan 

## Overview
A Chrome extension that lets users collect bookmarks while browsing, then uses Claude to summarize and format those bookmarks into a newsletter.

## Goals
- Low-friction bookmarking (one click while browsing)
- Store bookmarks locally with metadata (title, URL, timestamp, optional note/tag)
- Generate a polished newsletter summary on demand using the Claude API
- Export the newsletter (copy, Markdown/HTML download, or email)

## Architecture

### 1. Manifest (`manifest.json`)
- Manifest V3
- Permissions: `storage`, `activeTab`, `scripting`
- Host permissions: `https://api.anthropic.com/*`
- Background service worker (for context menu / keyboard shortcut support)
- Popup UI entry point

### 2. Popup (`popup.html` / `popup.js`)
- Shows "Save this page" button
- Captures: page title, URL, timestamp, favicon
- Optional: text field for a personal note or tag
- Optional: "grab page summary" using `scripting` to extract main text/meta description
- List of recently saved bookmarks with delete option

### 3. Storage Layer
- `chrome.storage.local` for the bookmark list
- Data model per bookmark:
  ```json
  {
    "id": "uuid",
    "title": "Page Title",
    "url": "https://...",
    "note": "optional user note",
    "excerpt": "optional extracted text",
    "tag": "optional category",
    "savedAt": "ISO timestamp"
  }
  ```

### 4. Options Page (`options.html` / `options.js`)
- Field to store Anthropic API key (stored in `chrome.storage.local`, never synced/exported)
- Newsletter preferences: tone, length, grouping style (by tag/date/theme)
- Clear-all-bookmarks button

### 5. Newsletter Generator (`newsletter.html` / `newsletter.js`)
- Select date range or tags to include
- "Generate Newsletter" button:
  - Bundles selected bookmarks into a prompt
  - Calls Claude API (`api.anthropic.com/v1/messages`)
  - Prompt instructs Claude to group by theme, write short blurbs, and produce a newsletter-style output (intro, sections, sign-off)
- Rendered output area (Markdown preview)
- Export options:
  - Copy to clipboard
  - Download as `.md` or `.html`
  - "Open in email client" (mailto: link with plain text body)

### 6. Background Service Worker (`background.js`)
- Optional: right-click context menu "Add to Newsletter Bookmarks"
- Optional: keyboard shortcut (`commands` API) to save current tab instantly

## Data Flow
1. User browses → clicks extension icon or context menu → page saved to `chrome.storage.local`
2. User opens Newsletter tab → selects bookmarks → clicks Generate
3. Extension builds a prompt with all bookmark data → sends to Claude API
4. Claude returns formatted newsletter text
5. User reviews, edits, and exports

## Claude API Integration Notes
- Use `fetch` directly to `https://api.anthropic.com/v1/messages`
- Model: current Claude model (confirm latest via API docs at build time)
- API key entered by user in Options page (BYO-key model, avoids needing a backend server)
- Consider a system prompt template like:
  > "You are a newsletter editor. Given a list of bookmarked articles (title, URL, note), group them by theme, write a 1-2 sentence summary for each, and produce a friendly newsletter draft with an intro and sign-off."

## Nice-to-Have Enhancements (Phase 2)
- Auto-fetch full article text via `scripting` for richer summaries (not just title/URL)
- Tagging/categorization UI with filters
- Scheduled reminders ("You have 8 unused bookmarks — generate this week's newsletter?")
- Multiple newsletter templates (short digest vs. long-form)
- Sync via `chrome.storage.sync` for cross-device bookmark lists (size-limited, so may need hybrid local/sync approach)

## Build Order (Suggested)
1. Manifest + popup save/list UI + local storage — get basic bookmarking working
2. Options page with API key storage
3. Newsletter generation page with Claude API call and Markdown output
4. Export/copy features
5. Polish: context menu, shortcuts, page-text extraction

## Open Questions to Decide Before Building
- Should the API key be required upfront, or can the extension work in "collector only" mode without it?
- Should newsletters be saved/archived, or generated fresh each time?
- Any preferred newsletter tone/format (professional, casual, bullet digest vs. narrative)?

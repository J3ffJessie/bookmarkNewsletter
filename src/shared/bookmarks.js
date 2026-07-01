import { addBookmark } from "./storage.js";

function makeId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function extractExcerpt(tabId) {
  try {
    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const metaDescription =
          document.querySelector('meta[name="description"]')?.content ||
          document.querySelector('meta[property="og:description"]')?.content ||
          "";
        const bodyText = document.body?.innerText?.trim().slice(0, 1800) || "";
        return [metaDescription, bodyText].filter(Boolean).join("\n\n");
      },
    });
    return (result || "").trim().slice(0, 2000);
  } catch (err) {
    return "";
  }
}

export async function captureTab(tab, { note = "", tag = "", withExcerpt = false } = {}) {
  if (!tab || !tab.url) {
    throw new Error("No active tab to save.");
  }

  const bookmark = {
    id: makeId(),
    title: tab.title || tab.url,
    url: tab.url,
    favIconUrl: tab.favIconUrl || "",
    note: note.trim(),
    tag: tag.trim(),
    excerpt: "",
    savedAt: new Date().toISOString(),
  };

  if (withExcerpt && tab.id) {
    bookmark.excerpt = await extractExcerpt(tab.id);
  }

  return bookmark;
}

export async function saveCurrentTabBookmark(tab, options) {
  const bookmark = await captureTab(tab, options);
  await addBookmark(bookmark);
  return bookmark;
}

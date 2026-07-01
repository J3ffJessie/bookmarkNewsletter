import { getBookmarks, deleteBookmark } from "../shared/storage.js";
import { saveCurrentTabBookmark } from "../shared/bookmarks.js";
import { importFromChromeBookmarks } from "../shared/bookmarkImport.js";

const pageFavicon = document.getElementById("pageFavicon");
const pageTitle = document.getElementById("pageTitle");
const pageUrl = document.getElementById("pageUrl");
const saveForm = document.getElementById("saveForm");
const saveBtn = document.getElementById("saveBtn");
const saveStatus = document.getElementById("saveStatus");
const noteInput = document.getElementById("note");
const tagInput = document.getElementById("tag");
const withExcerptInput = document.getElementById("withExcerpt");
const recentList = document.getElementById("recentList");
const bookmarkCount = document.getElementById("bookmarkCount");
const emptyState = document.getElementById("emptyState");
const importChromeBookmarksBtn = document.getElementById("importChromeBookmarks");
const importStatus = document.getElementById("importStatus");

let activeTab = null;

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function renderTabPreview(tab) {
  if (!tab) {
    pageTitle.textContent = "No active tab found.";
    return;
  }
  pageTitle.textContent = tab.title || tab.url;
  pageUrl.textContent = tab.url;
  if (tab.favIconUrl) {
    pageFavicon.src = tab.favIconUrl;
    pageFavicon.hidden = false;
  } else {
    pageFavicon.hidden = true;
  }
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch (err) {
    return iso;
  }
}

async function renderRecent() {
  const bookmarks = await getBookmarks();
  bookmarkCount.textContent = bookmarks.length ? `${bookmarks.length} saved` : "";
  recentList.innerHTML = "";
  emptyState.hidden = bookmarks.length > 0;

  for (const bookmark of bookmarks.slice(0, 8)) {
    const item = document.createElement("li");
    item.className = "recent-item";

    const info = document.createElement("div");
    info.className = "recent-item__info";

    const title = document.createElement("a");
    title.className = "recent-item__title";
    title.href = bookmark.url;
    title.target = "_blank";
    title.rel = "noopener noreferrer";
    title.textContent = bookmark.title;

    const meta = document.createElement("div");
    meta.className = "recent-item__meta";
    meta.textContent = [bookmark.tag, formatDate(bookmark.savedAt)].filter(Boolean).join(" · ");

    info.append(title, meta);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn";
    deleteBtn.title = "Delete";
    deleteBtn.textContent = "✕";
    deleteBtn.addEventListener("click", async () => {
      await deleteBookmark(bookmark.id);
      await renderRecent();
    });

    item.append(info, deleteBtn);
    recentList.appendChild(item);
  }
}

saveForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!activeTab) return;

  saveBtn.disabled = true;
  saveStatus.textContent = "Saving…";

  try {
    await saveCurrentTabBookmark(activeTab, {
      note: noteInput.value,
      tag: tagInput.value,
      withExcerpt: withExcerptInput.checked,
    });
    saveStatus.textContent = "Saved!";
    noteInput.value = "";
    tagInput.value = "";
    await renderRecent();
    setTimeout(() => {
      saveStatus.textContent = "";
    }, 1500);
  } catch (err) {
    saveStatus.textContent = err.message || "Could not save this page.";
  } finally {
    saveBtn.disabled = false;
  }
});

importChromeBookmarksBtn.addEventListener("click", async () => {
  importChromeBookmarksBtn.disabled = true;
  importStatus.textContent = "Importing…";
  try {
    const result = await importFromChromeBookmarks();
    importStatus.textContent = result.imported
      ? `Imported ${result.imported} new bookmark${result.imported === 1 ? "" : "s"}.`
      : `No new bookmarks in "${result.folderTitle}".`;
    await renderRecent();
    setTimeout(() => {
      importStatus.textContent = "";
    }, 3000);
  } catch (err) {
    importStatus.textContent = err.message || "Could not import Chrome bookmarks.";
  } finally {
    importChromeBookmarksBtn.disabled = false;
  }
});

document.getElementById("openNewsletter").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("src/newsletter/newsletter.html") });
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

(async function init() {
  activeTab = await getActiveTab();
  renderTabPreview(activeTab);
  await renderRecent();
})();

import {
  getBookmarks,
  getApiKey,
  getModel,
  getPreferences,
  getNewsletters,
  saveNewsletter,
  deleteNewsletter,
} from "../shared/storage.js";
import { generateNewsletter } from "../shared/groq.js";
import { markdownToHtml } from "../shared/markdown.js";

const bookmarkList = document.getElementById("bookmarkList");
const noBookmarks = document.getElementById("noBookmarks");
const tagFilter = document.getElementById("tagFilter");
const sinceFilter = document.getElementById("sinceFilter");
const selectAllBtn = document.getElementById("selectAll");
const selectNoneBtn = document.getElementById("selectNone");
const generateBtn = document.getElementById("generateBtn");
const generateStatus = document.getElementById("generateStatus");
const preview = document.getElementById("preview");
const copyBtn = document.getElementById("copyBtn");
const downloadMdBtn = document.getElementById("downloadMdBtn");
const downloadHtmlBtn = document.getElementById("downloadHtmlBtn");
const archiveList = document.getElementById("archiveList");
const noArchive = document.getElementById("noArchive");

let allBookmarks = [];
let currentMarkdown = "";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch (err) {
    return iso;
  }
}

function populateTagFilter(bookmarks) {
  const tags = Array.from(new Set(bookmarks.map((b) => b.tag).filter(Boolean))).sort();
  tagFilter.innerHTML =
    '<option value="">All tags</option>' +
    tags.map((tag) => `<option value="${tag}">${tag}</option>`).join("");
}

function getFilteredBookmarks() {
  const tag = tagFilter.value;
  const since = sinceFilter.value ? new Date(sinceFilter.value) : null;
  return allBookmarks.filter((b) => {
    if (tag && b.tag !== tag) return false;
    if (since && new Date(b.savedAt) < since) return false;
    return true;
  });
}

function renderBookmarkList() {
  const filtered = getFilteredBookmarks();
  bookmarkList.innerHTML = "";
  noBookmarks.hidden = allBookmarks.length > 0;

  for (const bookmark of filtered) {
    const item = document.createElement("li");
    item.className = "bookmark-item";

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = bookmark.id;
    checkbox.className = "bookmark-checkbox";
    checkbox.checked = true;

    const info = document.createElement("div");
    info.className = "bookmark-item__info";
    const title = document.createElement("div");
    title.className = "bookmark-item__title";
    title.textContent = bookmark.title;
    const meta = document.createElement("div");
    meta.className = "bookmark-item__meta";
    meta.textContent = [bookmark.tag, formatDate(bookmark.savedAt)].filter(Boolean).join(" · ");
    info.append(title, meta);

    label.append(checkbox, info);
    item.append(label);
    bookmarkList.appendChild(item);
  }
}

function getSelectedBookmarks() {
  const ids = Array.from(document.querySelectorAll(".bookmark-checkbox:checked")).map((cb) => cb.value);
  const idSet = new Set(ids);
  return allBookmarks.filter((b) => idSet.has(b.id));
}

function setOutput(markdown) {
  currentMarkdown = markdown;
  const hasContent = Boolean(markdown);
  preview.innerHTML = hasContent
    ? markdownToHtml(markdown)
    : '<p class="empty-state">Select bookmarks and click "Generate newsletter" to see a preview here.</p>';
  [copyBtn, downloadMdBtn, downloadHtmlBtn].forEach((btn) => {
    btn.disabled = !hasContent;
  });
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function renderArchive() {
  const newsletters = await getNewsletters();
  archiveList.innerHTML = "";
  noArchive.hidden = newsletters.length > 0;

  for (const entry of newsletters) {
    const item = document.createElement("li");
    item.className = "archive-item";

    const button = document.createElement("button");
    button.className = "text-btn archive-item__title";
    button.textContent = `${formatDate(entry.createdAt)} · ${entry.bookmarkIds.length} link${
      entry.bookmarkIds.length === 1 ? "" : "s"
    }`;
    button.addEventListener("click", () => setOutput(entry.markdown));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "icon-btn";
    deleteBtn.textContent = "✕";
    deleteBtn.title = "Delete from archive";
    deleteBtn.addEventListener("click", async (event) => {
      event.stopPropagation();
      await deleteNewsletter(entry.id);
      await renderArchive();
    });

    item.append(button, deleteBtn);
    archiveList.appendChild(item);
  }
}

selectAllBtn.addEventListener("click", () => {
  document.querySelectorAll(".bookmark-checkbox").forEach((cb) => {
    cb.checked = true;
  });
});

selectNoneBtn.addEventListener("click", () => {
  document.querySelectorAll(".bookmark-checkbox").forEach((cb) => {
    cb.checked = false;
  });
});

tagFilter.addEventListener("change", renderBookmarkList);
sinceFilter.addEventListener("change", renderBookmarkList);

generateBtn.addEventListener("click", async () => {
  const selected = getSelectedBookmarks();
  generateStatus.textContent = "";

  if (!selected.length) {
    generateStatus.textContent = "Select at least one bookmark first.";
    return;
  }

  const apiKey = await getApiKey();
  if (!apiKey) {
    generateStatus.textContent = "Add your Groq API key in Settings first.";
    return;
  }

  generateBtn.disabled = true;
  generateStatus.textContent = "Generating newsletter…";

  try {
    const [model, preferences] = await Promise.all([getModel(), getPreferences()]);
    const markdown = await generateNewsletter({ apiKey, model, bookmarks: selected, preferences });
    setOutput(markdown);
    await saveNewsletter({
      id: typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}`,
      createdAt: new Date().toISOString(),
      markdown,
      bookmarkIds: selected.map((b) => b.id),
    });
    await renderArchive();
    generateStatus.textContent = "Done!";
    setTimeout(() => {
      generateStatus.textContent = "";
    }, 2000);
  } catch (err) {
    generateStatus.textContent = err.message || "Something went wrong generating the newsletter.";
  } finally {
    generateBtn.disabled = false;
  }
});

copyBtn.addEventListener("click", async () => {
  await navigator.clipboard.writeText(currentMarkdown);
  copyBtn.textContent = "Copied!";
  setTimeout(() => {
    copyBtn.textContent = "Copy";
  }, 1500);
});

downloadMdBtn.addEventListener("click", () => {
  downloadFile(`newsletter-${Date.now()}.md`, currentMarkdown, "text/markdown");
});

downloadHtmlBtn.addEventListener("click", () => {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Newsletter</title></head><body>${markdownToHtml(
    currentMarkdown
  )}</body></html>`;
  downloadFile(`newsletter-${Date.now()}.html`, html, "text/html");
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

(async function init() {
  allBookmarks = await getBookmarks();
  populateTagFilter(allBookmarks);
  renderBookmarkList();
  await renderArchive();
})();

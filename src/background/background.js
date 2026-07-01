import { saveCurrentTabBookmark } from "../shared/bookmarks.js";

const CONTEXT_MENU_ID = "add-to-newsletter-bookmarks";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Add to Newsletter Bookmarks",
    contexts: ["page", "action"],
  });
});

function flashBadge(success) {
  chrome.action.setBadgeText({ text: success ? "✓" : "!" });
  chrome.action.setBadgeBackgroundColor({ color: success ? "#2e7d32" : "#c62828" });
  setTimeout(() => chrome.action.setBadgeText({ text: "" }), 1500);
}

async function saveTab(tab) {
  try {
    await saveCurrentTabBookmark(tab, { withExcerpt: true });
    flashBadge(true);
  } catch (err) {
    flashBadge(false);
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && tab) {
    saveTab(tab);
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-current-tab") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) await saveTab(tab);
  }
});

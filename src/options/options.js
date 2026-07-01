import {
  getApiKey,
  setApiKey,
  getModel,
  setModel,
  getPreferences,
  setPreferences,
  clearBookmarks,
  getImportFolderName,
  setImportFolderName,
  DEFAULT_MODEL,
} from "../shared/storage.js";
import { importFromChromeBookmarks } from "../shared/bookmarkImport.js";

const apiKeyInput = document.getElementById("apiKey");
const modelInput = document.getElementById("model");
const apiKeyStatus = document.getElementById("apiKeyStatus");
const toneSelect = document.getElementById("tone");
const lengthSelect = document.getElementById("length");
const groupingSelect = document.getElementById("grouping");
const detailSelect = document.getElementById("detail");
const preferencesStatus = document.getElementById("preferencesStatus");
const clearStatus = document.getElementById("clearStatus");
const importFolderInput = document.getElementById("importFolder");
const importFolderStatus = document.getElementById("importFolderStatus");
const importNowBtn = document.getElementById("importNow");
const importStatus = document.getElementById("importStatus");

function flash(el, message) {
  el.textContent = message;
  setTimeout(() => {
    el.textContent = "";
  }, 2000);
}

document.getElementById("saveApiKey").addEventListener("click", async () => {
  await setApiKey(apiKeyInput.value.trim());
  await setModel(modelInput.value.trim() || DEFAULT_MODEL);
  flash(apiKeyStatus, "Saved.");
});

document.getElementById("savePreferences").addEventListener("click", async () => {
  await setPreferences({
    tone: toneSelect.value,
    length: lengthSelect.value,
    grouping: groupingSelect.value,
    detail: detailSelect.value,
  });
  flash(preferencesStatus, "Saved.");
});

document.getElementById("clearBookmarks").addEventListener("click", async () => {
  if (!confirm("Delete all saved bookmarks? This cannot be undone.")) return;
  await clearBookmarks();
  flash(clearStatus, "All bookmarks cleared.");
});

document.getElementById("saveImportFolder").addEventListener("click", async () => {
  await setImportFolderName(importFolderInput.value);
  importFolderInput.value = await getImportFolderName();
  flash(importFolderStatus, "Saved.");
});

importNowBtn.addEventListener("click", async () => {
  importNowBtn.disabled = true;
  importStatus.textContent = "Importing…";
  try {
    const result = await importFromChromeBookmarks();
    importStatus.textContent = `Imported ${result.imported} new bookmark${result.imported === 1 ? "" : "s"} from "${result.folderTitle}" (${result.scanned} scanned).`;
  } catch (err) {
    importStatus.textContent = err.message || "Could not import Chrome bookmarks.";
  } finally {
    importNowBtn.disabled = false;
  }
});

(async function init() {
  apiKeyInput.value = await getApiKey();
  modelInput.value = await getModel();
  const preferences = await getPreferences();
  toneSelect.value = preferences.tone;
  lengthSelect.value = preferences.length;
  groupingSelect.value = preferences.grouping;
  detailSelect.value = preferences.detail;
  importFolderInput.value = await getImportFolderName();
})();

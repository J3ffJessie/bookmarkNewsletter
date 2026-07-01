const BOOKMARKS_KEY = "bookmarks";
const API_KEY_KEY = "apiKey";
const MODEL_KEY = "model";
const PREFERENCES_KEY = "preferences";
const NEWSLETTERS_KEY = "newsletters";
const IMPORT_FOLDER_KEY = "bookmarkImportFolder";

export const DEFAULT_MODEL = "llama-3.3-70b-versatile";
export const DEFAULT_IMPORT_FOLDER = "Newsletter";

export const DEFAULT_PREFERENCES = {
  tone: "balanced",
  length: "medium",
  grouping: "theme",
  detail: "detailed",
};

export async function getBookmarks() {
  const { [BOOKMARKS_KEY]: bookmarks = [] } = await chrome.storage.local.get(BOOKMARKS_KEY);
  return bookmarks;
}

export async function addBookmark(bookmark) {
  const bookmarks = await getBookmarks();
  bookmarks.unshift(bookmark);
  await chrome.storage.local.set({ [BOOKMARKS_KEY]: bookmarks });
  return bookmarks;
}

export async function addBookmarks(newBookmarks) {
  if (!newBookmarks.length) return getBookmarks();
  const bookmarks = await getBookmarks();
  const merged = [...newBookmarks, ...bookmarks];
  await chrome.storage.local.set({ [BOOKMARKS_KEY]: merged });
  return merged;
}

export async function deleteBookmark(id) {
  const bookmarks = await getBookmarks();
  const next = bookmarks.filter((b) => b.id !== id);
  await chrome.storage.local.set({ [BOOKMARKS_KEY]: next });
  return next;
}

export async function clearBookmarks() {
  await chrome.storage.local.set({ [BOOKMARKS_KEY]: [] });
}

export async function getApiKey() {
  const { [API_KEY_KEY]: apiKey = "" } = await chrome.storage.local.get(API_KEY_KEY);
  return apiKey;
}

export async function setApiKey(apiKey) {
  await chrome.storage.local.set({ [API_KEY_KEY]: apiKey });
}

export async function getModel() {
  const { [MODEL_KEY]: model = DEFAULT_MODEL } = await chrome.storage.local.get(MODEL_KEY);
  return model;
}

export async function setModel(model) {
  await chrome.storage.local.set({ [MODEL_KEY]: model || DEFAULT_MODEL });
}

export async function getPreferences() {
  const { [PREFERENCES_KEY]: preferences } = await chrome.storage.local.get(PREFERENCES_KEY);
  return { ...DEFAULT_PREFERENCES, ...(preferences || {}) };
}

export async function setPreferences(preferences) {
  await chrome.storage.local.set({ [PREFERENCES_KEY]: preferences });
}

export async function getImportFolderName() {
  const { [IMPORT_FOLDER_KEY]: name = DEFAULT_IMPORT_FOLDER } = await chrome.storage.local.get(IMPORT_FOLDER_KEY);
  return name;
}

export async function setImportFolderName(name) {
  await chrome.storage.local.set({ [IMPORT_FOLDER_KEY]: name?.trim() || DEFAULT_IMPORT_FOLDER });
}

export async function getNewsletters() {
  const { [NEWSLETTERS_KEY]: newsletters = [] } = await chrome.storage.local.get(NEWSLETTERS_KEY);
  return newsletters;
}

export async function saveNewsletter(newsletter) {
  const newsletters = await getNewsletters();
  newsletters.unshift(newsletter);
  await chrome.storage.local.set({ [NEWSLETTERS_KEY]: newsletters });
  return newsletters;
}

export async function deleteNewsletter(id) {
  const newsletters = await getNewsletters();
  const next = newsletters.filter((n) => n.id !== id);
  await chrome.storage.local.set({ [NEWSLETTERS_KEY]: next });
  return next;
}

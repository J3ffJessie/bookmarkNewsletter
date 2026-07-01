import { addBookmarks, getBookmarks, getImportFolderName } from "./storage.js";

function walk(nodes, predicate, results = []) {
  for (const node of nodes) {
    if (predicate(node)) results.push(node);
    if (node.children) walk(node.children, predicate, results);
  }
  return results;
}

async function findFolder(folderName) {
  const tree = await chrome.bookmarks.getTree();
  const matches = walk(
    tree,
    (node) => node.children !== undefined && node.title.toLowerCase() === folderName.toLowerCase()
  );
  return matches[0] || null;
}

async function ensureFolder(folderName) {
  const existing = await findFolder(folderName);
  if (existing) return existing;
  return chrome.bookmarks.create({ title: folderName });
}

function collectUrlBookmarks(node) {
  return walk([node], (n) => Boolean(n.url));
}

function makeId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toBookmarkRecord(node) {
  return {
    id: makeId(),
    title: node.title || node.url,
    url: node.url,
    favIconUrl: "",
    note: "",
    tag: "",
    excerpt: "",
    savedAt: node.dateAdded ? new Date(node.dateAdded).toISOString() : new Date().toISOString(),
  };
}

export async function importFromChromeBookmarks() {
  const folderName = await getImportFolderName();
  const folder = await ensureFolder(folderName);
  const nodes = collectUrlBookmarks(folder);

  const existing = await getBookmarks();
  const existingUrls = new Set(existing.map((b) => b.url));
  const newRecords = nodes.filter((node) => !existingUrls.has(node.url)).map(toBookmarkRecord);

  await addBookmarks(newRecords);

  return { imported: newRecords.length, scanned: nodes.length, folderTitle: folder.title };
}

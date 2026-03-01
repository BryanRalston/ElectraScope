import { openDB } from 'idb';

const PREFIX = 'electra_';
const INDEX_KEY = PREFIX + 'index';
const DB_NAME = 'electra-blobs';
const STORE = 'photos';

// ─── localStorage helpers ──────────────────────────────────────────

export function getIndex() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveIndex(ids) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export function getProject(id) {
  try {
    const raw = localStorage.getItem(PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProject(proj) {
  if (!proj || !proj.id) return;
  localStorage.setItem(PREFIX + proj.id, JSON.stringify(proj));
  const ids = getIndex();
  if (!ids.includes(proj.id)) {
    ids.unshift(proj.id);
    saveIndex(ids);
  }
}

export function deleteProject(id) {
  localStorage.removeItem(PREFIX + id);
  const ids = getIndex().filter(i => i !== id);
  saveIndex(ids);
}

export function listProjects() {
  return getIndex()
    .map(id => getProject(id))
    .filter(Boolean);
}

// ─── IndexedDB for photos ──────────────────────────────────────────

let dbPromise;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function getPhoto(key) {
  const db = await getDb();
  return db.get(STORE, key);
}

export async function savePhoto(key, data) {
  const db = await getDb();
  return db.put(STORE, data, key);
}

export async function deletePhoto(key) {
  const db = await getDb();
  return db.delete(STORE, key);
}

// ─── IndexedDB for 3D models ─────────────────────────────────────

const MODEL_DB_NAME = 'electra-models';
const MODEL_STORE = 'models';
let modelDbPromise;

function getModelDb() {
  if (!modelDbPromise) {
    modelDbPromise = openDB(MODEL_DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(MODEL_STORE)) {
          db.createObjectStore(MODEL_STORE);
        }
      },
    });
  }
  return modelDbPromise;
}

export async function getModel(key) {
  const db = await getModelDb();
  return db.get(MODEL_STORE, key);
}

export async function saveModel(key, arrayBuffer) {
  const db = await getModelDb();
  return db.put(MODEL_STORE, arrayBuffer, key);
}

export async function deleteModel(key) {
  const db = await getModelDb();
  return db.delete(MODEL_STORE, key);
}

import type { DayEntry, Settings } from './types';

const DB_NAME = 'isabel-fall-strength-journal';
const DB_VERSION = 1;
const DAYS = 'days';
const META = 'meta';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support on-device storage (IndexedDB).'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    // Upgrades only ever ADD stores; they never clear existing data.
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DAYS)) db.createObjectStore(DAYS, { keyPath: 'date' });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: 'key' });
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error ?? new Error('Could not open journal storage.'));
    req.onblocked = () => reject(new Error('Journal storage is busy in another tab. Close other tabs and retry.'));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Storage transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('Storage transaction aborted.'));
  });
}

function getAllFrom<T>(tx: IDBTransaction, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const r = tx.objectStore(store).getAll();
    r.onsuccess = () => resolve(r.result as T[]);
    r.onerror = () => reject(r.error);
  });
}

export async function loadAll(): Promise<{ days: DayEntry[]; settings: Settings | null }> {
  const db = await openDB();
  const tx = db.transaction([DAYS, META], 'readonly');
  const [days, meta] = await Promise.all([
    getAllFrom<DayEntry>(tx, DAYS),
    getAllFrom<{ key: string; value: unknown }>(tx, META),
  ]);
  const s = meta.find((m) => m.key === 'settings');
  return { days, settings: (s?.value as Settings) ?? null };
}

export async function putDays(days: DayEntry[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(DAYS, 'readwrite');
  const st = tx.objectStore(DAYS);
  days.forEach((d) => st.put(d));
  await txDone(tx);
}

export async function putSettings(settings: Settings): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(META, 'readwrite');
  tx.objectStore(META).put({ key: 'settings', value: settings });
  await txDone(tx);
}

/** Atomic replace: clears and writes inside ONE transaction; any failure rolls back everything. */
export async function replaceAll(days: DayEntry[], settings: Settings): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([DAYS, META], 'readwrite');
  const ds = tx.objectStore(DAYS);
  const ms = tx.objectStore(META);
  ds.clear();
  ms.clear();
  days.forEach((d) => ds.put(d));
  ms.put({ key: 'settings', value: settings });
  await txDone(tx);
}

export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch {
    /* not supported */
  }
  return false;
}

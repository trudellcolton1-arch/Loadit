"use client";

/**
 * Tiny key-value store for the browser wallet: IndexedDB first (survives in
 * installed PWAs, larger quota), localStorage as a fallback. Everything stored
 * here is either public (the address, transaction ids) or encrypted (the
 * vault blob). Nothing is ever sent to Loadit.
 */

const DB = "loadit-app";
const STORE = "kv";

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function ls(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  const db = await openDb();
  if (db) {
    const v = await new Promise<T | null>((resolve) => {
      try {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve((req.result as T) ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    db.close();
    if (v !== null) return v;
  }
  const raw = ls()?.getItem(`${DB}:${key}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  let ok = false;
  if (db) {
    ok = await new Promise<boolean>((resolve) => {
      try {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
        tx.onabort = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
    db.close();
  }
  if (!ok) ls()?.setItem(`${DB}:${key}`, JSON.stringify(value));
}

export async function kvDel(key: string): Promise<void> {
  const db = await openDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
    db.close();
  }
  ls()?.removeItem(`${DB}:${key}`);
}

/** Ask the browser not to evict our storage (installed PWAs usually get this). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignore */
  }
  return false;
}

export const KEYS = {
  vault: "vault",
  activity: "activity", // local list of SEP-24 transaction ids we started
  prefs: "prefs",
} as const;

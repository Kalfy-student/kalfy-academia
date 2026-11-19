const DB_NAME = 'kalfy_apk_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'apk_blobs';

interface StoredApkRecord {
  id: string;
  fileName: string;
  mimeType: string;
  blob: Blob;
  savedAt: number;
}

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function saveApkBlob(id: string, file: Blob, fileName: string): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record: StoredApkRecord = {
        id,
        fileName,
        mimeType: file.type || 'application/vnd.android.package-archive',
        blob: file,
        savedAt: Date.now()
      };
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
    });
    db.close();
  } catch {
    // Ignore IndexedDB quota/privacy mode failures gracefully
  }
}

export async function getApkBlob(id: string): Promise<{ blob: Blob; fileName: string } | null> {
  try {
    const db = await openVaultDb();
    const result = await new Promise<StoredApkRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result as StoredApkRecord | undefined);
      req.onerror = () => reject(req.error || new Error('IndexedDB read failed'));
    });
    db.close();
    if (!result || !result.blob) return null;
    return { blob: result.blob, fileName: result.fileName };
  } catch {
    return null;
  }
}

export async function deleteApkBlob(id: string): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('IndexedDB delete failed'));
    });
    db.close();
  } catch {
    // Ignore errors
  }
}

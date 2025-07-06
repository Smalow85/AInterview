import { openDB } from 'idb';

export const dbPromise = openDB('MyAppDB', 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings');
    }
    if (!db.objectStoreNames.contains('messages')) {
      const store = db.createObjectStore('messages', { keyPath: 'id' });
      store.createIndex('sessionId', 'sessionId');
    }

    if (!db.objectStoreNames.contains('cards')) {
      const store = db.createObjectStore('cards', { keyPath: 'id' });
      store.createIndex('sessionId', 'sessionId');
    }
  }
});

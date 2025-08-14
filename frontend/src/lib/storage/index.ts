import { openDB } from 'idb';

export const dbPromise = openDB('MyAppDB', 7, { // Increment database version to 2
  upgrade(db, oldVersion, newVersion, transaction) { // Added params
    if (!db.objectStoreNames.contains('settings')) {
      db.createObjectStore('settings');
    }
    if (!db.objectStoreNames.contains('messages')) {
      const store = db.createObjectStore('messages', { keyPath: 'id' });
      store.createIndex('sessionId', 'sessionId');
    }
    if (!db.objectStoreNames.contains('conversations')) {
      const store = db.createObjectStore('conversations');
      store.createIndex('sessionId', 'sessionId');
    }

    if (!db.objectStoreNames.contains('cards')) {
      const store = db.createObjectStore('cards', { keyPath: 'id' });
      store.createIndex('sessionId', 'sessionId');
      store.createIndex('favorite', 'favorite');
    } else {
      const store = transaction.objectStore('cards');
      if (!store.indexNames.contains('favorite')) {
        store.createIndex('favorite', 'favorite');
      }
    }

    if (!db.objectStoreNames.contains('interviews')) {
      const store = db.createObjectStore('interviews');
      store.createIndex('sessionId', 'sessionId');
    }
  }
});


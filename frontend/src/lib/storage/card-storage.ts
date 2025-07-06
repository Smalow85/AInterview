import { dbPromise } from './index';
import { ResponseCard } from '../../types/response-card';

export async function fetchCardsBySessionId(sessionId: string): Promise<ResponseCard[]> {
  if (!sessionId) {
    console.warn('fetchCardsBySessionId: sessionId is undefined');
    return []; // или throw new Error("Session ID is required");
  }
  const db = await dbPromise;
  return db.getAllFromIndex('cards', 'sessionId', sessionId);
}

export async function saveCardsToDB(card: ResponseCard): Promise<ResponseCard> {
  const db = await dbPromise;
  await db.put('cards', card);
  return card;
}

export async function clearCardsBySessionId(sessionId: string): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction('cards', 'readwrite');
  const store = tx.objectStore('cards');
  const index = store.index('sessionId');

  for await (const cursor of index.iterate(sessionId)) {
    cursor.delete();
  }

  await tx.done;
}
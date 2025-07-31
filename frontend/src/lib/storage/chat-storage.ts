import { dbPromise } from './index';
import { ChatMessage } from '../../types/chat-message';

export async function fetchMessagesBySessionId(sessionId: string): Promise<ChatMessage[]> {
  if (!sessionId) {
    console.warn('fetchMessagesBySessionId: sessionId is undefined');
    return []; // или throw new Error("Session ID is required");
  }
  const db = await dbPromise;
  return db.getAllFromIndex('messages', 'sessionId', sessionId);
}

export async function saveMessageToDB(msg: ChatMessage): Promise<ChatMessage> {
  const db = await dbPromise;
  await db.put('messages', msg);
  return msg;
}

export async function clearMessagesBySessionId(sessionId: string): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction('messages', 'readwrite');
  const store = tx.objectStore('messages');
  const index = store.index('sessionId');

  let cursor = await index.openCursor(sessionId);

  while (cursor) {
    cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

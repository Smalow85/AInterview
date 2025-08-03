import { dbPromise } from './index';
import { ThemedConversationSettings } from '../../types/settings';

export async function fetchConversationBySessionId(sessionId: string): Promise<ThemedConversationSettings> {
  if (!sessionId) {
    console.warn('fetchConvdrsationBySessionId: sessionId is undefined');
    throw new Error("fetchConvdrsationBySessionId: sessionId is undefined"); // или throw new Error("Session ID is required");
  }
  const db = await dbPromise;
  return db.getFromIndex('conversations', 'sessionId', sessionId);
}

export async function saveConversationToDB(conversation: ThemedConversationSettings): Promise<ThemedConversationSettings> {
  const db = await dbPromise;
  await db.put('conversations', conversation, conversation.activeSessionId);
  return conversation;
}

export async function clearConversationBySessionId(sessionId: string): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction('conversations', 'readwrite');
  const store = tx.objectStore('conversations');
  const index = store.index('sessionId');

  let cursor = await index.openCursor(sessionId);

  while (cursor) {
    cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

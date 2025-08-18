import { dbPromise } from './index';
import { ThemedConversationSettings } from '../../types/settings';

const STORE_NAME = 'conversations';

export async function fetchConversationBySessionId(sessionId: string): Promise<ThemedConversationSettings> {
  const db = await dbPromise;
  const result = await db.get(STORE_NAME, sessionId);
  return result;
}

export async function saveConversationToDB(conversation: ThemedConversationSettings): Promise<void> {
  const db = await dbPromise;
  await db.put(STORE_NAME, conversation, conversation.activeSessionId);
}

export async function fetchAllConversations(): Promise<ThemedConversationSettings[]> {
    const db = await dbPromise;
    return await db.getAll(STORE_NAME);
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

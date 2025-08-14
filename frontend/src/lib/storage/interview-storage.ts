import { dbPromise } from './index';
import { InterviewSettings } from '../../types/settings';

export async function fetchInterviewBySessionId(sessionId: string): Promise<InterviewSettings> {
  if (!sessionId) {
    console.warn('fetchInterviewBySessionId: sessionId is undefined');
    throw new Error("fetchInterviewBySessionId: sessionId is undefined"); // или throw new Error("Session ID is required");
  }
  const db = await dbPromise;
  return db.getFromIndex('interviews', 'sessionId', sessionId);
}

export async function saveInterviewToDB(interview: InterviewSettings): Promise<InterviewSettings> {
  const db = await dbPromise;
  await db.put('interviews', interview, interview.activeSessionId);
  return interview;
}

export async function clearInterviewBySessionId(sessionId: string): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction('interviews', 'readwrite');
  const store = tx.objectStore('interviews');
  const index = store.index('sessionId');

  let cursor = await index.openCursor(sessionId);

  while (cursor) {
    cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

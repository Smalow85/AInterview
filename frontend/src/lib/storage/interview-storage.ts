import { dbPromise } from './index';
import { InterviewSettings } from '../../types/settings';

const STORE_NAME = 'interviews';

export async function fetchInterviewBySessionId(sessionId: string): Promise<InterviewSettings> {
  const db = await dbPromise;
  const result = await db.get(STORE_NAME, sessionId);
  return result;
}

export async function fetchAllInterviews(): Promise<InterviewSettings[]> {
  const db = await dbPromise;
  return await db.getAll(STORE_NAME);
}


export async function saveInterviewToDB(interview: InterviewSettings): Promise<InterviewSettings> {
  const db = await dbPromise;
  await db.put(STORE_NAME, interview, interview.activeSessionId);
  return interview;
}

export async function clearInterviewBySessionId(sessionId: string): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('sessionId');

  let cursor = await index.openCursor(sessionId);

  while (cursor) {
    cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

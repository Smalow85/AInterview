import { dbPromise } from './index';

const STORE_NAME = 'recommendations';

export interface Recommendation {
  id?: number;
  recommendation: string;
  topics: string[];
  createdAt: number;
}

export async function saveRecommendation(recommendation: Recommendation): Promise<void> {
  const db = await dbPromise;
  await db.add(STORE_NAME, recommendation);
}

export async function fetchAllRecommendations(): Promise<Recommendation[]> {
    const db = await dbPromise;
    return await db.getAll(STORE_NAME);
}


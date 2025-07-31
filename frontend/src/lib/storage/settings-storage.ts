import { dbPromise } from './index';
import { UserSettings } from '../../types/settings';

const STORE_NAME = 'settings';

export async function getSettings(userId: number): Promise<UserSettings | undefined> {
  const db = await dbPromise;
  const result = await db.get(STORE_NAME, userId);
  return result ?? null;
}

export async function saveSettingsInDb(settings: UserSettings, userId: number): Promise<UserSettings> {
  const db = await dbPromise;
  await db.put(STORE_NAME, settings, userId);
  const savedSettings = await db.get(STORE_NAME, userId);
  return savedSettings;
}
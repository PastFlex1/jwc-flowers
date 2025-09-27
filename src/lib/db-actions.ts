'use server';

import fs from 'fs/promises';
import path from 'path';
import type { AppData } from '@/context/app-data-context';

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

// In-memory database for production environments like Vercel (read-only filesystem)
let memoryDb: AppData | null = null;
const isVercel = process.env.VERCEL === '1';

export async function readDb(): Promise<AppData> {
  if (isVercel && memoryDb) {
    return memoryDb;
  }

  try {
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    const data = JSON.parse(fileContent);
    if (isVercel) {
        memoryDb = data;
    }
    return data;
  } catch (error) {
    console.error('Error reading from local DB:', error);
    throw new Error('Could not read from local database.');
  }
}

export async function writeDb(data: AppData): Promise<void> {
  if (isVercel) {
    // In Vercel, we only update the in-memory copy
    memoryDb = data;
    return;
  }

  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to local DB:', error);
    throw new Error('Could not write to local database.');
  }
}

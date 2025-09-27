'use server';

import fs from 'fs/promises';
import path from 'path';
import type { AppData } from '@/context/app-data-context';

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

export async function readDb(): Promise<AppData> {
  try {
    const fileContent = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error reading from local DB:', error);
    throw new Error('Could not read from local database.');
  }
}

export async function writeDb(data: AppData): Promise<void> {
  try {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to local DB:', error);
    throw new Error('Could not write to local database.');
  }
}

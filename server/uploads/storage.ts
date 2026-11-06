import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { upload } from '@/server/db/schema';

const DIR = process.env.UPLOADS_DIR ?? path.join(process.cwd(), '.uploads');

const filePath = (id: string) => path.join(DIR, `${id}.webp`);

export async function saveFile(id: string, data: Buffer) {
  await mkdir(DIR, { recursive: true });
  await writeFile(filePath(id), data);
}

export const readStoredFile = (id: string) => readFile(filePath(id));

// удаляет файл и запись о нём
export async function removeUpload(id: string) {
  await rm(filePath(id), { force: true });
  await db.delete(upload).where(eq(upload.id, id));
}

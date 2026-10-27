import { desc } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { appChangelog } from '@/server/db/schema';

export type ChangelogEntry = {
  version: string;
  releasedOn: string; // YYYY-MM-DD
  items: string[];
};

// новые версии сверху
export async function listChangelog(): Promise<ChangelogEntry[]> {
  return db
    .select({
      version: appChangelog.version,
      releasedOn: appChangelog.releasedOn,
      items: appChangelog.items,
    })
    .from(appChangelog)
    .orderBy(desc(appChangelog.releasedOn), desc(appChangelog.createdAt));
}

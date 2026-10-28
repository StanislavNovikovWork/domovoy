import { desc, eq, sql } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { place, placeLike } from '@/server/db/schema';
import type { PlaceKind } from '@/shared/config/place-kinds';

export type PlaceItem = {
  id: string;
  name: string;
  kind: PlaceKind;
  location: string | null;
  comment: string | null;
  createdBy: string | null;
  likes: number;
  likedByMe: boolean;
};

// места пространства: сначала с большим числом лайков, затем новые
export async function listPlaces(householdId: string, userId: string): Promise<PlaceItem[]> {
  const rows = await db
    .select({
      id: place.id,
      name: place.name,
      kind: place.kind,
      location: place.location,
      comment: place.comment,
      createdBy: place.createdBy,
      likes: sql<number>`(select count(*)::int from ${placeLike} pl where pl.place_id = ${place.id})`,
      likedByMe: sql<boolean>`exists (select 1 from ${placeLike} pl where pl.place_id = ${place.id} and pl.user_id = ${userId})`,
    })
    .from(place)
    .where(eq(place.householdId, householdId))
    .orderBy(
      desc(sql`(select count(*) from ${placeLike} pl where pl.place_id = ${place.id})`),
      desc(place.createdAt)
    );
  return rows as PlaceItem[];
}

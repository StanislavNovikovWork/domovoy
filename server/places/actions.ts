'use server';

import { and, eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { place, placeLike } from '@/server/db/schema';
import { requireHouseholdAccess, revalidateBudgetPages } from '@/server/households/access';
import { createPlaceSchema, placeIdSchema } from '@/shared/schemas/place';

type Result = { ok: true } | { ok: false; error: string };

// место может предложить любой участник пространства
export async function createPlace(input: unknown): Promise<Result> {
  const parsed = createPlaceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название места' };
  const data = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(data.householdId);
    await db.insert(place).values({
      id: data.id,
      householdId: data.householdId,
      name: data.name,
      kind: data.kind,
      location: data.location || null,
      comment: data.comment || null,
      createdBy: session.user.id,
    });

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('createPlace failed', error);
    return { ok: false, error: 'Не удалось добавить место' };
  }
}

// лайк ставится и снимается тем же действием
export async function togglePlaceLike(input: unknown): Promise<Result> {
  const parsed = placeIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(data.householdId);
    const [found] = await db
      .select({ id: place.id })
      .from(place)
      .where(and(eq(place.id, data.id), eq(place.householdId, data.householdId)))
      .limit(1);
    if (!found) return { ok: false, error: 'Место не найдено' };

    const removed = await db
      .delete(placeLike)
      .where(and(eq(placeLike.placeId, data.id), eq(placeLike.userId, session.user.id)))
      .returning({ placeId: placeLike.placeId });
    if (removed.length === 0) {
      await db
        .insert(placeLike)
        .values({ placeId: data.id, userId: session.user.id })
        .onConflictDoNothing();
    }

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('togglePlaceLike failed', error);
    return { ok: false, error: 'Не удалось поставить лайк' };
  }
}

// удалить место может автор или владелец пространства
export async function deletePlace(input: unknown): Promise<Result> {
  const parsed = placeIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    const { session, member } = await requireHouseholdAccess(data.householdId);
    const [found] = await db
      .select({ createdBy: place.createdBy })
      .from(place)
      .where(and(eq(place.id, data.id), eq(place.householdId, data.householdId)))
      .limit(1);
    if (!found) return { ok: false, error: 'Место не найдено' };
    if (member.role !== 'owner' && found.createdBy !== session.user.id) {
      return { ok: false, error: 'Можно удалять только свои места' };
    }

    await db.delete(place).where(eq(place.id, data.id));

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('deletePlace failed', error);
    return { ok: false, error: 'Не удалось удалить место' };
  }
}

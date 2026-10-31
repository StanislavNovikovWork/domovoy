'use server';

import { and, eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { calendarEvent } from '@/server/db/schema';
import { requireHouseholdAccess, revalidateBudgetPages } from '@/server/households/access';
import {
  createEventSchema,
  eventIdSchema,
  updateEventSchema,
} from '@/shared/schemas/calendar-event';

type Result = { ok: true } | { ok: false; error: string };

// событие может добавить любой участник пространства
export async function createEvent(input: unknown): Promise<Result> {
  const parsed = createEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название события' };
  const data = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(data.householdId);
    await db.insert(calendarEvent).values({
      id: data.id,
      householdId: data.householdId,
      title: data.title,
      eventDate: data.eventDate,
      eventTime: data.eventTime || null,
      createdBy: session.user.id,
    });

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('createEvent failed', error);
    return { ok: false, error: 'Не удалось добавить событие' };
  }
}

// менять события может любой участник пространства
export async function updateEvent(input: unknown): Promise<Result> {
  const parsed = updateEventSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название события' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    const updated = await db
      .update(calendarEvent)
      .set({ title: data.title, eventDate: data.eventDate, eventTime: data.eventTime || null })
      .where(
        and(
          eq(calendarEvent.id, data.id),
          eq(calendarEvent.householdId, data.householdId)
        )
      )
      .returning({ id: calendarEvent.id });
    if (updated.length === 0) return { ok: false, error: 'Событие не найдено' };

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('updateEvent failed', error);
    return { ok: false, error: 'Не удалось изменить событие' };
  }
}

// удалять события может любой участник пространства
export async function deleteEvent(input: unknown): Promise<Result> {
  const parsed = eventIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    await db
      .delete(calendarEvent)
      .where(
        and(
          eq(calendarEvent.id, data.id),
          eq(calendarEvent.householdId, data.householdId)
        )
      );

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('deleteEvent failed', error);
    return { ok: false, error: 'Не удалось удалить событие' };
  }
}

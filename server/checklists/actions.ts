'use server';

import { and, eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { checklist, checklistItem, shoppingPreset } from '@/server/db/schema';
import { requireHouseholdAccess, revalidateBudgetPages } from '@/server/households/access';
import {
  addItemSchema,
  addPresetSchema,
  createListSchema,
  itemIdSchema,
  listIdSchema,
  presetIdSchema,
  renameListSchema,
  toggleItemSchema,
} from '@/shared/schemas/checklist';

type Result = { ok: true } | { ok: false; error: string };

// список и его пункты может менять любой участник пространства
export async function createList(input: unknown): Promise<Result> {
  const parsed = createListSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название списка' };
  const data = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(data.householdId);
    await db.insert(checklist).values({
      id: data.id,
      householdId: data.householdId,
      title: data.title,
      kind: data.kind,
      createdBy: session.user.id,
    });

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('createList failed', error);
    return { ok: false, error: 'Не удалось создать список' };
  }
}

export async function renameList(input: unknown): Promise<Result> {
  const parsed = renameListSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название списка' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    const updated = await db
      .update(checklist)
      .set({ title: data.title })
      .where(and(eq(checklist.id, data.listId), eq(checklist.householdId, data.householdId)))
      .returning({ id: checklist.id });
    if (updated.length === 0) return { ok: false, error: 'Список не найден' };

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('renameList failed', error);
    return { ok: false, error: 'Не удалось переименовать список' };
  }
}

export async function deleteList(input: unknown): Promise<Result> {
  const parsed = listIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    await db
      .delete(checklist)
      .where(and(eq(checklist.id, data.listId), eq(checklist.householdId, data.householdId)));

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('deleteList failed', error);
    return { ok: false, error: 'Не удалось удалить список' };
  }
}

export async function addItem(input: unknown): Promise<Result> {
  const parsed = addItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название пункта' };
  const data = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(data.householdId);
    await db.insert(checklistItem).values({
      id: data.id,
      listId: data.listId,
      title: data.title,
      quantity: data.quantity || null,
      dueDate: data.dueDate || null,
      createdBy: session.user.id,
    });

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('addItem failed', error);
    return { ok: false, error: 'Не удалось добавить пункт' };
  }
}

export async function toggleItem(input: unknown): Promise<Result> {
  const parsed = toggleItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    await db
      .update(checklistItem)
      .set({ done: data.done })
      .where(eq(checklistItem.id, data.itemId));

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('toggleItem failed', error);
    return { ok: false, error: 'Не удалось обновить пункт' };
  }
}

export async function deleteItem(input: unknown): Promise<Result> {
  const parsed = itemIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    await db.delete(checklistItem).where(eq(checklistItem.id, data.itemId));

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('deleteItem failed', error);
    return { ok: false, error: 'Не удалось удалить пункт' };
  }
}

// удаляет выполненные пункты списка (покупки и задачи)
export async function clearDoneItems(input: unknown): Promise<Result> {
  const parsed = listIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    const [list] = await db
      .select({ id: checklist.id })
      .from(checklist)
      .where(and(eq(checklist.id, data.listId), eq(checklist.householdId, data.householdId)))
      .limit(1);
    if (!list) return { ok: false, error: 'Список не найден' };

    await db
      .delete(checklistItem)
      .where(and(eq(checklistItem.listId, data.listId), eq(checklistItem.done, true)));

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('clearDoneItems failed', error);
    return { ok: false, error: 'Не удалось удалить выполненные' };
  }
}

export async function addPreset(input: unknown): Promise<Result> {
  const parsed = addPresetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название позиции' };
  const data = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(data.householdId);
    await db.insert(shoppingPreset).values({
      id: data.id,
      householdId: data.householdId,
      title: data.title,
      quantity: data.quantity || null,
      createdBy: session.user.id,
    });

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('addPreset failed', error);
    return { ok: false, error: 'Не удалось добавить позицию' };
  }
}

export async function deletePreset(input: unknown): Promise<Result> {
  const parsed = presetIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    await db
      .delete(shoppingPreset)
      .where(
        and(eq(shoppingPreset.id, data.presetId), eq(shoppingPreset.householdId, data.householdId))
      );

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('deletePreset failed', error);
    return { ok: false, error: 'Не удалось удалить позицию' };
  }
}

'use server';

import 'server-only';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { category } from '@/server/db/schema';
import { requireHouseholdAccess } from '@/server/households/access';
import {
  archiveCategorySchema,
  createCategorySchema,
  updateCategorySchema,
} from '@/shared/schemas/category';

type Result = { ok: true } | { ok: false; error: string };

// 23505 = нарушение уникального индекса (категория с таким именем уже есть)
function isUniqueViolation(error: unknown) {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.code === '23505' || e?.cause?.code === '23505';
}

// убираем повторы подсказок без учёта регистра
function dedupe(list: string[]) {
  const seen = new Set<string>();
  return list.filter((s) => {
    const key = s.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function createCategory(input: unknown): Promise<Result> {
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Проверьте введённые данные' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);

    const [{ max }] = await db
      .select({ max: sql<number>`coalesce(max(${category.sortOrder}), -1)` })
      .from(category)
      .where(eq(category.householdId, data.householdId));

    await db.insert(category).values({
      householdId: data.householdId,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      suggestions: dedupe(data.suggestions),
      sortOrder: Number(max) + 1,
    });

    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: 'Такая категория уже есть' };
    console.error('createCategory failed', error);
    return { ok: false, error: 'Не удалось сохранить категорию' };
  }
}

export async function updateCategory(input: unknown): Promise<Result> {
  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Проверьте введённые данные' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);

    const updated = await db
      .update(category)
      .set({
        name: data.name,
        icon: data.icon,
        color: data.color,
        suggestions: dedupe(data.suggestions),
      })
      .where(
        and(
          eq(category.id, data.id),
          eq(category.householdId, data.householdId),
          isNull(category.archivedAt),
        ),
      )
      .returning({ id: category.id });

    if (updated.length === 0) return { ok: false, error: 'Категория не найдена' };

    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: 'Такая категория уже есть' };
    console.error('updateCategory failed', error);
    return { ok: false, error: 'Не удалось сохранить категорию' };
  }
}

export async function archiveCategory(input: unknown): Promise<Result> {
  const parsed = archiveCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);

    const archived = await db
      .update(category)
      .set({ archivedAt: new Date() })
      .where(
        and(
          eq(category.id, data.id),
          eq(category.householdId, data.householdId),
          isNull(category.archivedAt),
        ),
      )
      .returning({ id: category.id });

    if (archived.length === 0) return { ok: false, error: 'Категория не найдена' };

    revalidatePath('/');
    return { ok: true };
  } catch (error) {
    console.error('archiveCategory failed', error);
    return { ok: false, error: 'Не удалось удалить категорию' };
  }
}
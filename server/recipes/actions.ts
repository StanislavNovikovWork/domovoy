'use server';

import { and, asc, eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { checklist, checklistItem, recipe } from '@/server/db/schema';
import { requireHouseholdAccess, revalidateBudgetPages } from '@/server/households/access';
import { removeUpload } from '@/server/uploads/storage';
import { createRecipeSchema, recipeIdSchema } from '@/shared/schemas/recipe';

type Result = { ok: true } | { ok: false; error: string };

export async function createRecipe(input: unknown): Promise<Result> {
  const parsed = createRecipeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Введите название рецепта' };
  const data = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(data.householdId);
    await db.insert(recipe).values({
      id: data.id,
      householdId: data.householdId,
      title: data.title,
      description: data.description || null,
      ingredients: data.ingredients.map((i) => ({ name: i.name, quantity: i.quantity || null })),
      createdBy: session.user.id,
    });

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('createRecipe failed', error);
    return { ok: false, error: 'Не удалось сохранить рецепт' };
  }
}

export async function deleteRecipe(input: unknown): Promise<Result> {
  const parsed = recipeIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    await requireHouseholdAccess(data.householdId);
    const [deleted] = await db
      .delete(recipe)
      .where(and(eq(recipe.id, data.recipeId), eq(recipe.householdId, data.householdId)))
      .returning({ photoId: recipe.photoId });
    if (deleted?.photoId) await removeUpload(deleted.photoId);

    revalidateBudgetPages();
    return { ok: true };
  } catch (error) {
    console.error('deleteRecipe failed', error);
    return { ok: false, error: 'Не удалось удалить рецепт' };
  }
}

// ингредиенты рецепта попадают в первый список покупок; если его нет, создаётся «Покупки»
export async function addRecipeToShopping(
  input: unknown
): Promise<{ ok: true; listId: string; listTitle: string } | { ok: false; error: string }> {
  const parsed = recipeIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Некорректный запрос' };
  const data = parsed.data;

  try {
    const { session } = await requireHouseholdAccess(data.householdId);
    const [found] = await db
      .select({ ingredients: recipe.ingredients })
      .from(recipe)
      .where(and(eq(recipe.id, data.recipeId), eq(recipe.householdId, data.householdId)))
      .limit(1);
    if (!found) return { ok: false, error: 'Рецепт не найден' };
    if (found.ingredients.length === 0) return { ok: false, error: 'У рецепта нет ингредиентов' };

    let [list] = await db
      .select({ id: checklist.id, title: checklist.title })
      .from(checklist)
      .where(and(eq(checklist.householdId, data.householdId), eq(checklist.kind, 'shopping')))
      .orderBy(asc(checklist.createdAt))
      .limit(1);
    if (!list) {
      [list] = await db
        .insert(checklist)
        .values({
          householdId: data.householdId,
          title: 'Покупки',
          kind: 'shopping',
          createdBy: session.user.id,
        })
        .returning({ id: checklist.id, title: checklist.title });
    }

    await db.insert(checklistItem).values(
      found.ingredients.map((i) => ({
        listId: list.id,
        title: i.name,
        quantity: i.quantity,
        createdBy: session.user.id,
      }))
    );

    revalidateBudgetPages();
    return { ok: true, listId: list.id, listTitle: list.title };
  } catch (error) {
    console.error('addRecipeToShopping failed', error);
    return { ok: false, error: 'Не удалось добавить в список покупок' };
  }
}

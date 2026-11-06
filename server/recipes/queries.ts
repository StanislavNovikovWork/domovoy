import { and, asc, eq } from 'drizzle-orm';
import 'server-only';
import { db } from '@/server/db';
import { recipe } from '@/server/db/schema';

export type RecipeListItem = Awaited<ReturnType<typeof listRecipes>>[number];

// рецепты пространства в порядке создания
export async function listRecipes(householdId: string) {
  return db
    .select({ id: recipe.id, title: recipe.title, photoId: recipe.photoId })
    .from(recipe)
    .where(eq(recipe.householdId, householdId))
    .orderBy(asc(recipe.createdAt));
}

// рецепт с проверкой принадлежности пространству
export async function getRecipe(householdId: string, recipeId: string) {
  const rows = await db
    .select({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      photoId: recipe.photoId,
      ingredients: recipe.ingredients,
    })
    .from(recipe)
    .where(and(eq(recipe.id, recipeId), eq(recipe.householdId, householdId)))
    .limit(1);
  return rows[0] ?? null;
}

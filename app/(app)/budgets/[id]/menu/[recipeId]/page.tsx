import { notFound } from 'next/navigation';
import { z } from 'zod';
import { RecipeView } from '@/features/menu/RecipeView';
import { getRecipe } from '@/server/recipes/queries';
import { requirePageSession } from '@/server/session';

type Props = { params: Promise<{ id: string; recipeId: string }> };

export const metadata = {
  title: 'Рецепт',
};

export default async function RecipePage({ params }: Props) {
  const { id, recipeId } = await params;
  await requirePageSession(`/budgets/${id}/menu/${recipeId}`);
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(recipeId).success) notFound();

  const recipe = await getRecipe(id, recipeId);
  if (!recipe) notFound();

  return <RecipeView householdId={id} recipe={recipe} />;
}

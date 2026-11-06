import { notFound } from 'next/navigation';
import { z } from 'zod';
import { RecipeForm } from '@/features/menu/RecipeForm';
import { requirePageSession } from '@/server/session';

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Новый рецепт',
};

export default async function NewRecipePage({ params }: Props) {
  const { id } = await params;
  await requirePageSession(`/budgets/${id}/menu/new`);
  if (!z.uuid().safeParse(id).success) notFound();

  return <RecipeForm householdId={id} />;
}

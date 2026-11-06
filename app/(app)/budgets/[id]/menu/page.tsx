import { notFound } from 'next/navigation';
import { z } from 'zod';
import { MenuIndex } from '@/features/menu/MenuNav';
import { listRecipes } from '@/server/recipes/queries';
import { requirePageSession } from '@/server/session';

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Меню',
};

export default async function MenuPage({ params }: Props) {
  const { id } = await params;
  await requirePageSession(`/budgets/${id}/menu`);
  if (!z.uuid().safeParse(id).success) notFound();

  const items = await listRecipes(id);
  return <MenuIndex householdId={id} items={items} />;
}

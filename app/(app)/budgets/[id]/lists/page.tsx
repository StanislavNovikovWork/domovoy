import { notFound } from 'next/navigation';
import { z } from 'zod';
import { ListsIndex } from '@/features/lists/ListsNav';
import { listChecklists } from '@/server/checklists/queries';
import { requirePageSession } from '@/server/session';

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Списки',
};

export default async function ListsPage({ params }: Props) {
  const { id } = await params;
  await requirePageSession(`/budgets/${id}/lists`);
  if (!z.uuid().safeParse(id).success) notFound();

  const items = await listChecklists(id);
  return <ListsIndex householdId={id} items={items} />;
}

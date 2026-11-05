import { notFound } from 'next/navigation';
import { z } from 'zod';
import { ListView } from '@/features/lists/ListView';
import { getChecklist, listItems, listPresets } from '@/server/checklists/queries';
import { requirePageSession } from '@/server/session';

type Props = { params: Promise<{ id: string; listId: string }> };

export const metadata = {
  title: 'Список',
};

export default async function ListPage({ params }: Props) {
  const { id, listId } = await params;
  await requirePageSession(`/budgets/${id}/lists/${listId}`);
  if (!z.uuid().safeParse(id).success || !z.uuid().safeParse(listId).success) notFound();

  const list = await getChecklist(id, listId);
  if (!list) notFound();

  const [items, presets] = await Promise.all([
    listItems(list.id),
    list.kind === 'shopping' ? listPresets(id) : Promise.resolve([]),
  ]);
  return <ListView householdId={id} list={list} items={items} presets={presets} />;
}

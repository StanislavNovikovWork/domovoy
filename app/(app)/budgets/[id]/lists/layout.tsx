import { notFound } from 'next/navigation';
import { z } from 'zod';
import { Box, Group } from '@mantine/core';
import { ListsNav } from '@/features/lists/ListsNav';
import { listChecklists } from '@/server/checklists/queries';
import { requirePageSession } from '@/server/session';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

// списки пространства: на десктопе слева список списков, справа контент;
// на мобильном /lists сам показывает список, разделы — отдельные экраны
export default async function ListsLayout({ children, params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}/lists`);
  if (!z.uuid().safeParse(id).success) notFound();

  const items = await listChecklists(id);
  return (
    <Group align="flex-start" wrap="nowrap" gap="lg">
      <ListsNav householdId={id} items={items} />
      <Box style={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Group>
  );
}

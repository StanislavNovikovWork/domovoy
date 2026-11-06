import { notFound } from 'next/navigation';
import { z } from 'zod';
import { Box, Group } from '@mantine/core';
import { MenuNav } from '@/features/menu/MenuNav';
import { listRecipes } from '@/server/recipes/queries';
import { requirePageSession } from '@/server/session';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

// меню пространства: на десктопе слева список рецептов, справа детализация или форма
export default async function MenuLayout({ children, params }: Props) {
  const { id } = await params;
  await requirePageSession(`/budgets/${id}/menu`);
  if (!z.uuid().safeParse(id).success) notFound();

  const items = await listRecipes(id);
  return (
    <Group align="flex-start" wrap="nowrap" gap="lg">
      <MenuNav householdId={id} items={items} />
      <Box style={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Group>
  );
}

import { notFound } from 'next/navigation';
import { z } from 'zod';
import { BOTTOM_INSET, PageTopBar } from '@/features/app-shell';
import { SpaceControls } from '@/features/family/SpaceControls';
import { getUserHousehold } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';
import { Stack } from '@mantine/core';

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Управление пространством',
};

export default async function SettingsSpacePage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}/settings/space`);
  if (!z.uuid().safeParse(id).success) notFound();

  const budget = await getUserHousehold(user.id, id);
  if (!budget) notFound();

  return (
    <Stack gap="lg" mih="calc(100dvh - var(--mantine-spacing-md))" pb={BOTTOM_INSET}>
      <PageTopBar
        backHref={`/budgets/${budget.id}`}
        backLabel="К пространству"
        title="Управление пространством"
        titleAlign="left"
      />
      <Stack maw={480} pb="md" style={{ flex: 1 }}>
        <SpaceControls householdId={budget.id} name={budget.name} role={budget.role} />
      </Stack>
    </Stack>
  );
}

import { notFound } from 'next/navigation';
import { z } from 'zod';
import { BOTTOM_INSET, PageTopBar } from '@/features/app-shell';
import { getUserHousehold } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';
import { Stack, Text } from '@mantine/core';

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Управление подпиской',
};

export default async function SettingsSubscriptionPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}/settings/subscription`);
  if (!z.uuid().safeParse(id).success) notFound();

  const budget = await getUserHousehold(user.id, id);
  if (!budget) notFound();

  return (
    <Stack gap="lg" mih="calc(100dvh - var(--mantine-spacing-md))" pb={BOTTOM_INSET}>
      <PageTopBar
        backHref={`/budgets/${budget.id}`}
        backLabel="К пространству"
        title="Управление подпиской"
        titleAlign="left"
      />
      <Text c="dimmed">В разработке</Text>
    </Stack>
  );
}

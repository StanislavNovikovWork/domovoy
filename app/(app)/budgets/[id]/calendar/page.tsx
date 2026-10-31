import { notFound } from 'next/navigation';
import { z } from 'zod';
import { CalendarView } from '@/features/calendar/CalendarView';
import { listEvents } from '@/server/calendar/queries';
import { getUserHousehold } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';
import { Stack } from '@mantine/core';

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Календарь',
};

export default async function CalendarPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}/calendar`);
  if (!z.uuid().safeParse(id).success) notFound();

  const budget = await getUserHousehold(user.id, id);
  if (!budget) notFound();

  const events = await listEvents(budget.id);

  return (
    <Stack>
      <CalendarView householdId={budget.id} currentUserId={user.id} events={events} />
    </Stack>
  );
}

import { notFound } from 'next/navigation';
import { z } from 'zod';
import { PageTopBar } from '@/features/app-shell';
import { MembersView } from '@/features/family';
import {
  getUserHousehold,
  listActiveInvites,
  listGuests,
  listMembers,
} from '@/server/households/queries';
import { requirePageSession } from '@/server/session';
import { Stack } from '@mantine/core';

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Участники',
};

export default async function MembersPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}/members`);
  if (!z.uuid().safeParse(id).success) notFound();

  const budget = await getUserHousehold(user.id, id);
  if (!budget) notFound();

  const [members, guests, invites] = await Promise.all([
    listMembers(budget.id),
    listGuests(budget.id),
    // приглашения видит только владелец
    budget.role === 'owner' ? listActiveInvites(budget.id) : Promise.resolve([]),
  ]);

  return (
    <Stack gap="lg">
      <PageTopBar
        backHref={`/budgets/${budget.id}`}
        backLabel="К пространству"
        title="Участники"
      />
      <MembersView
        householdId={budget.id}
        name={budget.name}
        currentUserId={user.id}
        role={budget.role}
        members={members}
        guests={guests}
        invites={invites}
      />
    </Stack>
  );
}

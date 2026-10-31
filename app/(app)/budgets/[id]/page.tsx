import { notFound } from 'next/navigation';
import { z } from 'zod';
import { SpaceHome } from '@/features/family';
import { listEvents } from '@/server/calendar/queries';
import { listActiveCategories } from '@/server/categories/queries';
import { hasUnseenChangelog } from '@/server/changelog/seen';
import { getUserHousehold, listGuests, listMembers } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';
import { listAllTransactions } from '@/server/transactions/queries';
import { formatDate } from '@/shared/lib/period';

type Props = { params: Promise<{ id: string }> };

export default async function SpacePage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();

  const space = await getUserHousehold(user.id, id);
  if (!space) notFound();

  const [transactions, categories, members, guests, events] = await Promise.all([
    listAllTransactions(space.id),
    listActiveCategories(space.id),
    listMembers(space.id),
    listGuests(space.id),
    listEvents(space.id),
  ]);

  return (
    <SpaceHome
      householdId={space.id}
      name={space.name}
      hasNewChangelog={hasUnseenChangelog(user)}
      desktop={{
        budget: {
          periodic: space.kind === 'periodic',
          initialDate: formatDate(new Date()),
          transactions,
          categories,
          members,
          guestNames: guests.map((g) => g.name),
          currentUserId: user.id,
          role: space.role,
        },
        events,
      }}
    />
  );
}

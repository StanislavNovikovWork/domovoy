import { notFound } from 'next/navigation';
import { z } from 'zod';
import { SpaceHome } from '@/features/family';
import { hasUnseenChangelog } from '@/server/changelog/seen';
import { getUserHousehold } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';

type Props = { params: Promise<{ id: string }> };

export default async function SpacePage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();

  const space = await getUserHousehold(user.id, id);
  if (!space) notFound();

  return (
    <SpaceHome
      householdId={space.id}
      name={space.name}
      hasNewChangelog={hasUnseenChangelog(user)}
    />
  );
}

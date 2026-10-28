import { notFound } from 'next/navigation';
import { z } from 'zod';
import { PlacesView } from '@/features/places';
import { getUserHousehold } from '@/server/households/queries';
import { listPlaces } from '@/server/places/queries';
import { requirePageSession } from '@/server/session';

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Куда сходить',
};

export default async function PlacesPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}/places`);
  if (!z.uuid().safeParse(id).success) notFound();

  const space = await getUserHousehold(user.id, id);
  if (!space) notFound();

  const places = await listPlaces(space.id, user.id);

  return (
    <PlacesView
      householdId={space.id}
      currentUserId={user.id}
      role={space.role}
      places={places}
    />
  );
}

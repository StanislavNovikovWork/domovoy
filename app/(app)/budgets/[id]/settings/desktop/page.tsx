import { notFound } from 'next/navigation';
import { z } from 'zod';
import { DesktopSettings } from '@/features/family/DesktopSettings';
import { getUserHousehold } from '@/server/households/queries';
import { requirePageSession } from '@/server/session';

type Props = { params: Promise<{ id: string }> };

export const metadata = {
  title: 'Рабочий стол',
};

export default async function SettingsDesktopPage({ params }: Props) {
  const { id } = await params;
  const { user } = await requirePageSession(`/budgets/${id}/settings/desktop`);
  if (!z.uuid().safeParse(id).success) notFound();

  const space = await getUserHousehold(user.id, id);
  if (!space) notFound();

  return (
    <DesktopSettings
      householdId={space.id}
      periodic={space.kind === 'periodic'}
      hidden={space.hiddenTiles}
    />
  );
}

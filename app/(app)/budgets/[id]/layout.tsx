import { SpaceShell } from '@/features/family';
import { hasUnseenChangelog } from '@/server/changelog/seen';
import { getUserHousehold } from '@/server/households/queries';
import { getSession } from '@/server/session';

type Props = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

// обёртка пространства: на десктопе боковое меню разделов, на мобильном страница как есть
export default async function SpaceLayout({ children, params }: Props) {
  const { id } = await params;
  const session = await getSession();
  const space = session ? await getUserHousehold(session.user.id, id) : null;
  return (
    <SpaceShell
      householdId={id}
      hasNewChangelog={session ? hasUnseenChangelog(session.user) : false}
      periodic={space?.kind === 'periodic'}
    >
      {children}
    </SpaceShell>
  );
}

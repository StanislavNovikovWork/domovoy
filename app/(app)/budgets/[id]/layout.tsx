import { SpaceShell } from '@/features/family';
import { hasUnseenChangelog } from '@/server/changelog/seen';
import { getUserHousehold, listUserHouseholds } from '@/server/households/queries';
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
  const spaces = session ? await listUserHouseholds(session.user.id) : [];
  // переключатель и запоминание «последнего пространства» — только у корневых пространств
  const isRootSpace = space ? !space.parentId : false;
  return (
    <SpaceShell
      householdId={id}
      hasNewChangelog={session ? hasUnseenChangelog(session.user) : false}
      periodic={space?.kind === 'periodic'}
      spaces={isRootSpace ? spaces : undefined}
      spaceName={space?.name}
      remember={isRootSpace}
    >
      {children}
    </SpaceShell>
  );
}

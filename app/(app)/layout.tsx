import { getSession } from '@/server/session';
import { ensurePersonalHousehold } from '@/server/households/ensure-personal';
import { AppShellLayout } from '@/features/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // редиректит на /login сама страница через requirePageSession — она знает свой путь для next
  if (!session) return null;

  await ensurePersonalHousehold(session.user.id);

  return (
    <AppShellLayout user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </AppShellLayout>
  );
}
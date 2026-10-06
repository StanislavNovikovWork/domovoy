import { redirect } from 'next/navigation';
import { getSession } from '@/server/session';
import { ensurePersonalHousehold } from '@/server/households/ensure-personal';
import { AppShellLayout } from '@/features/app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  await ensurePersonalHousehold(session.user.id);

  return (
    <AppShellLayout user={{ name: session.user.name, email: session.user.email }}>
      {children}
    </AppShellLayout>
  );
}
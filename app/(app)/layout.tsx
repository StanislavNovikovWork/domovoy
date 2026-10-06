import { redirect } from 'next/navigation';
import { getSession } from '@/server/session';
import { ensurePersonalHousehold } from '@/server/households/ensure-personal';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  await ensurePersonalHousehold(session.user.id);

  return <>{children}</>;
}
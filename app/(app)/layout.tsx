import { AppShellLayout } from '@/features/app-shell';
import { getSession } from '@/server/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // редиректит на /login сама страница через requirePageSession — она знает свой путь для next
  if (!session) return null;

  return <AppShellLayout>{children}</AppShellLayout>;
}

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthShell, LoginForm } from '@/features/auth';
import { auth } from '@/server/auth';
import { safeNext } from '@/shared/lib/safe-next';

export const metadata = {
  title: 'Вход',
};

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function LoginPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next);

  // Если пользователь уже вошёл, на странице входа ему делать нечего
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(next);

  return (
    <AuthShell>
      <LoginForm next={next} />
    </AuthShell>
  );
}

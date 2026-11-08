import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthShell, RegisterForm } from '@/features/auth';
import { auth } from '@/server/auth';
import { safeNext } from '@/shared/lib/safe-next';

export const metadata = {
  title: 'Регистрация',
};

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function RegisterPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next);

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(next);

  return (
    <AuthShell>
      <RegisterForm next={next} />
    </AuthShell>
  );
}

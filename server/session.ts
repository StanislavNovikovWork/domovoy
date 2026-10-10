import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import 'server-only';
import { auth } from '@/server/auth';
import { withNext } from '@/shared/lib/safe-next';

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

// Для страниц: нет сессии → редирект на /login (с возвратом на next после входа)
export async function requirePageSession(next?: string) {
  const session = await getSession();
  if (!session) redirect(withNext('/login', next ?? '/'));
  return session;
}

// Для server actions: нет сессии → ошибка
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}

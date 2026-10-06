import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/server/auth';

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

// Для страниц: нет сессии → редирект на /login
export async function requirePageSession() {
  const session = await getSession();
  if (!session) redirect('/login');
  return session;
}

// Для server actions: нет сессии → ошибка
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHORIZED');
  return session;
}
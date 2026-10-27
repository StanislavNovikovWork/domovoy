'use server';

import { headers } from 'next/headers';
import 'server-only';
import { auth } from '@/server/auth';
import { requireSession } from '@/server/session';

// пользователь открыл список изменений: запоминаем текущую версию, красная точка пропадает.
// updateUser обновляет и БД, и куку сессии, так что точка гаснет сразу, без ожидания кэша
export async function markChangelogSeen() {
  try {
    await requireSession();
    await auth.api.updateUser({
      headers: await headers(),
      body: { changelogSeenVersion: process.env.NEXT_PUBLIC_APP_VERSION },
    });
    return { ok: true as const };
  } catch (error) {
    console.error('markChangelogSeen failed', error);
    return { ok: false as const };
  }
}

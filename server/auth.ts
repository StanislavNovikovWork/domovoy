import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()],
  session: {
    // сессия кладётся в подписанную куку: 5 минут проверка сессии не ходит в БД
    cookieCache: { enabled: true },
  },
});

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
  user: {
    // приезжает вместе с сессией, поэтому красная точка не требует запроса к БД
    additionalFields: {
      changelogSeenVersion: { type: 'string', required: false, input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // новому пользователю список изменений «уже просмотрен»: точка нужна только после обновлений
        before: async (user) => ({
          data: { ...user, changelogSeenVersion: process.env.NEXT_PUBLIC_APP_VERSION },
        }),
      },
    },
  },
});

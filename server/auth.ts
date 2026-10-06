import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { ensurePersonalHousehold } from '@/server/households/ensure-personal';
import { db } from './db';

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [nextCookies()], 
   databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await ensurePersonalHousehold(user.id);
          } catch (error) {
            console.error('Не удалось создать личный бюджет при регистрации', error);
          }
        },
      },
    },
  },
});
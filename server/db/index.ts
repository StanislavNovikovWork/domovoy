import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './shema';

export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { getDatabaseUrl } from './database-url.js';

export const dbClient = postgres(getDatabaseUrl(), {
  max: 1
});

export const db = drizzle(dbClient);

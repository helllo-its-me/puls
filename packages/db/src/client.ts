import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/health_app';
}

export const dbClient = postgres(getDatabaseUrl(), {
  max: 1
});

export const db = drizzle(dbClient);

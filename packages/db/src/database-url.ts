const localDatabaseUrl = 'postgres://postgres:postgres@localhost:5432/health_app';

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? localDatabaseUrl;
}

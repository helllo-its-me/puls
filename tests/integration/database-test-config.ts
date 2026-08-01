const defaultAdminDatabaseUrl = 'postgres://postgres:postgres@localhost:5432/postgres';
const defaultComposeDatabaseHost = '127.0.0.1';
const defaultComposeService = 'postgres';
const defaultDatabasePrefix = 'puls_migration_test_';

const adminDatabaseUrl = new URL(
  process.env.MIGRATION_TEST_ADMIN_DATABASE_URL ?? defaultAdminDatabaseUrl
);
const composeDatabaseHost = process.env.MIGRATION_TEST_COMPOSE_DATABASE_HOST
  ?? defaultComposeDatabaseHost;
const composeService = process.env.MIGRATION_TEST_COMPOSE_SERVICE ?? defaultComposeService;
const databasePrefix = process.env.MIGRATION_TEST_DATABASE_PREFIX ?? defaultDatabasePrefix;

if (!adminDatabaseUrl.username) {
  throw new Error('Migration test database URL must contain a database user');
}

if (!composeService) {
  throw new Error('Migration test Docker Compose service is required');
}

if (!composeDatabaseHost) {
  throw new Error('Migration test Docker Compose database host is required');
}

if (!/^[a-z][a-z0-9_]*_$/.test(databasePrefix)) {
  throw new Error('Migration test database prefix must be a safe PostgreSQL identifier prefix');
}

export const databaseTestConfig = Object.freeze({
  adminDatabaseUrl,
  composeDatabaseHost,
  composeService,
  databasePrefix,
  databaseUser: decodeURIComponent(adminDatabaseUrl.username),
  readinessAttempts: 30,
  readinessDelayMilliseconds: 500
});

export function getTestDatabaseUrl(databaseName: string): string {
  const databaseUrl = new URL(databaseTestConfig.adminDatabaseUrl);
  databaseUrl.pathname = `/${databaseName}`;

  return databaseUrl.toString();
}

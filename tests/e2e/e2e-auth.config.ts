export const e2eAuthTokenSecret =
  process.env.E2E_AUTH_TOKEN_SECRET ?? 'e2e-auth-token-secret-value-000001';
const e2eDatabaseNamePattern = /^puls_e2e_\d+$/;
const configuredE2eDatabaseName =
  process.env.PULS_E2E_DATABASE_NAME ?? `puls_e2e_${process.pid}`;

if (!e2eDatabaseNamePattern.test(configuredE2eDatabaseName)) {
  throw new Error(`Invalid E2E database name: ${configuredE2eDatabaseName}`);
}

export const e2eDatabaseName = configuredE2eDatabaseName;
export const e2eDatabaseUrl =
  `postgres://postgres:postgres@127.0.0.1:5432/${e2eDatabaseName}`;
export const e2eDatabaseAdminUrl =
  'postgres://postgres:postgres@127.0.0.1:5432/postgres';

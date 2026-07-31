import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertDatabaseSchemaMatchesMigrationSnapshot } from '../../packages/db/scripts/migration-introspection.js';
import { databaseTestConfig, getTestDatabaseUrl } from './database-test-config.js';

const repositoryDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const createdDatabases = new Set<string>();

export interface ProcessResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

interface ProcessOptions {
  env?: NodeJS.ProcessEnv;
  stdin?: string;
}

function runProcess(
  command: string,
  argumentsList: readonly string[],
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  return new Promise((resolveProcess, rejectProcess) => {
    const childProcess = spawn(command, argumentsList, {
      cwd: repositoryDirectory,
      env: options.env ?? process.env,
      stdio: 'pipe'
    });
    let stderr = '';
    let stdout = '';

    childProcess.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    childProcess.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    childProcess.on('error', rejectProcess);
    childProcess.on('close', (exitCode) => {
      resolveProcess({
        exitCode: exitCode ?? 1,
        stderr,
        stdout
      });
    });

    if (options.stdin !== undefined) {
      childProcess.stdin.write(options.stdin);
    }
    childProcess.stdin.end();
  });
}

function runCompose(argumentsList: readonly string[], stdin?: string): Promise<ProcessResult> {
  const processOptions = stdin === undefined ? {} : { stdin };

  return runProcess('docker', ['compose', ...argumentsList], processOptions);
}

function createDatabaseName(): string {
  return `${databaseTestConfig.databasePrefix}${randomUUID().replaceAll('-', '')}`;
}

function assertTestDatabaseName(databaseName: string): void {
  const databaseSuffix = databaseName.slice(databaseTestConfig.databasePrefix.length);
  const validTestDatabaseName = databaseName.startsWith(databaseTestConfig.databasePrefix)
    && /^[a-f0-9]+$/.test(databaseSuffix);

  if (!validTestDatabaseName) {
    throw new Error(`Refusing to manage a non-test database: ${databaseName}`);
  }
}

async function createDatabase(): Promise<string> {
  const databaseName = createDatabaseName();
  assertTestDatabaseName(databaseName);

  const result = await runCompose([
    'exec',
    '-T',
    databaseTestConfig.composeService,
    'createdb',
    '-U',
    databaseTestConfig.databaseUser,
    databaseName
  ]);
  assertProcessSucceeded(result);
  createdDatabases.add(databaseName);

  return databaseName;
}

async function dropDatabase(databaseName: string): Promise<void> {
  assertTestDatabaseName(databaseName);
  const result = await runCompose([
    'exec',
    '-T',
    databaseTestConfig.composeService,
    'dropdb',
    '-U',
    databaseTestConfig.databaseUser,
    '--if-exists',
    '--force',
    databaseName
  ]);
  assertProcessSucceeded(result);
  createdDatabases.delete(databaseName);
}

function assertProcessSucceeded(result: ProcessResult): void {
  if (result.exitCode !== 0) {
    throw new Error(`Process failed with exit code ${result.exitCode}:\n${result.stdout}\n${result.stderr}`);
  }
}

async function waitForPostgres(): Promise<void> {
  for (let attempt = 0; attempt < databaseTestConfig.readinessAttempts; attempt += 1) {
    const result = await runCompose([
      'exec',
      '-T',
      databaseTestConfig.composeService,
      'pg_isready',
      '-U',
      databaseTestConfig.databaseUser
    ]);

    if (result.exitCode === 0) {
      return;
    }

    await new Promise<void>((resolveDelay) => {
      setTimeout(resolveDelay, databaseTestConfig.readinessDelayMilliseconds);
    });
  }

  throw new Error('PostgreSQL did not become ready for migration tests.');
}

export async function startMigrationTestDatabase(): Promise<void> {
  const startResult = await runCompose(['up', '-d', databaseTestConfig.composeService]);
  assertProcessSucceeded(startResult);
  await waitForPostgres();
}

export async function cleanupMigrationTestDatabases(): Promise<void> {
  for (const databaseName of createdDatabases) {
    await dropDatabase(databaseName);
  }
}

export async function withTestDatabase(
  runTest: (databaseName: string) => Promise<void>
): Promise<void> {
  const databaseName = await createDatabase();

  try {
    await runTest(databaseName);
  } finally {
    await dropDatabase(databaseName);
  }
}

export function runSql(databaseName: string, sql: string): Promise<ProcessResult> {
  assertTestDatabaseName(databaseName);

  return runCompose(
    [
      'exec',
      '-T',
      databaseTestConfig.composeService,
      'psql',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      databaseTestConfig.databaseUser,
      '-d',
      databaseName,
      '-Atq'
    ],
    sql
  );
}

export async function queryScalar(databaseName: string, sql: string): Promise<string> {
  const result = await runSql(databaseName, sql);
  assertProcessSucceeded(result);

  return result.stdout.trim();
}

export function runMigration(databaseName: string): Promise<ProcessResult> {
  assertTestDatabaseName(databaseName);

  return runProcess('pnpm', ['db:migrate'], {
    env: {
      ...process.env,
      DATABASE_URL: getTestDatabaseUrl(databaseName)
    }
  });
}

export function assertMigratedSchemaMatchesSnapshot(
  databaseName: string,
  migrationIndex: number
): Promise<void> {
  assertTestDatabaseName(databaseName);

  return assertDatabaseSchemaMatchesMigrationSnapshot({
    databaseUrl: getTestDatabaseUrl(databaseName),
    migrationIndex,
    mismatchMessage: 'Migrated database schema does not match the latest migration snapshot.'
  });
}

export function runLegacySchemaPush(databaseName: string): Promise<ProcessResult> {
  assertTestDatabaseName(databaseName);

  return runProcess(
    'pnpm',
    ['--filter', '@health/db', 'exec', 'drizzle-kit', 'push', '--config=drizzle.legacy-test.config.ts'],
    {
      env: {
        ...process.env,
        DATABASE_URL: getTestDatabaseUrl(databaseName)
      }
    }
  );
}

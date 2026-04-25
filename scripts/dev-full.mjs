import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const rootCwd = process.cwd();

function getListeningProcessIds(port) {
  const result = spawnSync('lsof', ['-tiTCP:' + String(port), '-sTCP:LISTEN'], {
    cwd: rootCwd,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split('\n')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

async function ensurePortIsFree(port) {
  const processIds = getListeningProcessIds(port);

  if (processIds.length === 0) {
    return;
  }

  console.log(`Port ${port} is already in use. Stopping existing process(es): ${processIds.join(', ')}`);

  for (const processId of processIds) {
    spawnSync('kill', ['-TERM', processId], {
      cwd: rootCwd,
      stdio: 'inherit'
    });
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (getListeningProcessIds(port).length === 0) {
      return;
    }

    await delay(500);
  }

  throw new Error(`Port ${port} is still busy after trying to stop the existing process`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: rootCwd,
      stdio: 'inherit'
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 'unknown'}`));
    });
  });
}

async function waitForPostgres() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await run('docker', ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'postgres', '-d', 'health_app']);
      return;
    } catch {
      await delay(1_000);
    }
  }

  throw new Error('Postgres did not become ready in time');
}

function startLongRunningProcess(command, args) {
  return spawn(command, args, {
    cwd: rootCwd,
    stdio: 'inherit'
  });
}

async function main() {
  await ensurePortIsFree(3001);
  await ensurePortIsFree(8081);

  console.log('Starting PostgreSQL via Docker...');
  await run('pnpm', ['db:up']);

  console.log('Waiting for PostgreSQL to accept connections...');
  await waitForPostgres();

  console.log('Applying database schema...');
  await run('pnpm', ['db:push']);

  console.log('Starting API and mobile dev servers...');
  const apiProcess = startLongRunningProcess('pnpm', ['dev:api']);
  const mobileProcess = startLongRunningProcess('pnpm', ['dev:mobile']);

  const shutdown = () => {
    apiProcess.kill('SIGINT');
    mobileProcess.kill('SIGINT');
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  const exitCode = await new Promise((resolve) => {
    apiProcess.on('exit', (code) => {
      mobileProcess.kill('SIGINT');
      resolve(code ?? 0);
    });

    mobileProcess.on('exit', (code) => {
      apiProcess.kill('SIGINT');
      resolve(code ?? 0);
    });
  });

  process.exit(exitCode);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

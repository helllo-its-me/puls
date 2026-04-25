import { spawnSync } from 'node:child_process';

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

function stopProcessesOnPort(port) {
  const processIds = getListeningProcessIds(port);

  if (processIds.length === 0) {
    console.log(`Port ${port} is already free`);
    return;
  }

  console.log(`Stopping process(es) on port ${port}: ${processIds.join(', ')}`);

  for (const processId of processIds) {
    spawnSync('kill', ['-TERM', processId], {
      cwd: rootCwd,
      stdio: 'inherit'
    });
  }
}

function main() {
  stopProcessesOnPort(3001);
  stopProcessesOnPort(8081);

  console.log('Stopping PostgreSQL container...');
  spawnSync('pnpm', ['db:down'], {
    cwd: rootCwd,
    stdio: 'inherit'
  });
}

main();

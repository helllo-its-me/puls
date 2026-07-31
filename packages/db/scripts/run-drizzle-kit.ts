import { spawn } from 'node:child_process';

import { databasePackageRoot } from './migration-paths.js';

export async function runDrizzleKit(argumentsList: string[], environment: NodeJS.ProcessEnv): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const childProcess = spawn('drizzle-kit', argumentsList, {
      cwd: databasePackageRoot,
      env: {
        ...process.env,
        ...environment
      },
      stdio: 'inherit'
    });

    childProcess.on('error', rejectPromise);
    childProcess.on('exit', (exitCode) => {
      if (exitCode === 0) {
        resolvePromise();
        return;
      }

      rejectPromise(new Error(`Drizzle Kit failed with exit code ${exitCode ?? 'unknown'}`));
    });
  });
}

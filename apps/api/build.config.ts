import { readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';
import { z } from 'zod';

const packageManifestSchema = z.object({
  dependencies: z.record(z.string(), z.string()).default({})
});

const apiRoot = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(apiRoot, 'dist');
const require = createRequire(import.meta.url);
const packageManifestContent = await readFile(resolve(apiRoot, 'package.json'), 'utf8');
const packageManifestJson: unknown = JSON.parse(packageManifestContent);
const { dependencies } = packageManifestSchema.parse(packageManifestJson);

const workspacePackageAliases = Object.fromEntries(
  Object.entries(dependencies)
    .filter(([, version]) => version.startsWith('workspace:'))
    .map(([packageName]) => [packageName, require.resolve(packageName)])
);

await rm(outputDirectory, { force: true, recursive: true });

await build({
  absWorkingDir: apiRoot,
  alias: workspacePackageAliases,
  bundle: true,
  entryPoints: ['src/server.ts'],
  format: 'esm',
  outfile: resolve(outputDirectory, 'server.js'),
  packages: 'external',
  platform: 'node',
  target: 'es2022'
});

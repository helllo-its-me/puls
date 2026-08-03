import { z } from 'zod';

const runtimeModeSchema = z.enum([
  'development',
  'test',
  'staging',
  'production'
]);

export type RuntimeMode = z.infer<typeof runtimeModeSchema>;

export function readRuntimeMode(environment: NodeJS.ProcessEnv = process.env): RuntimeMode {
  return runtimeModeSchema.parse(environment.NODE_ENV);
}

export function isLocalRuntimeMode(runtimeMode: RuntimeMode): boolean {
  return runtimeMode === 'development' || runtimeMode === 'test';
}

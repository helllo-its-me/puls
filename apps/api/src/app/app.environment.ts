import type { HttpBindings } from '@hono/node-server';

export type AppEnvironment = {
  Bindings: Partial<HttpBindings>;
  Variables: {
    authClientAddress: string;
  };
};

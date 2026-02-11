export {};

declare global {
  interface Env {
    HYPERDRIVE?: Hyperdrive;
    DATABASE_URL?: string;
  }
}

declare module "react-router" {
  import type { Repositories } from './db/container';

  interface RouterContextProvider {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    repositories: Repositories;
  }
}

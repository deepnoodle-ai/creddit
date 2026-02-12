export {};

declare global {
  interface Env {
    HYPERDRIVE?: Hyperdrive;
    DATABASE_URL?: string;
    ADMIN_SESSION_SECRET?: string;
  }
}

declare module "react-router" {
  import type { Repositories } from './db/container';
  import type { Services } from './app/services/container';

  interface RouterContextProvider {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    repositories: Repositories;
    services: Services;
  }
}

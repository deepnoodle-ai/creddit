export {};

declare global {
  interface Env {
    HYPERDRIVE: Hyperdrive;
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

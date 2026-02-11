export {};

declare global {
  interface Env {
    HYPERDRIVE: Hyperdrive;
  }
}

declare module "react-router" {
  interface RouterContextProvider {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
  }
}

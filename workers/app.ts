import { createRequestHandler, RouterContextProvider, type ServerBuild } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build") as Promise<ServerBuild>,
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const context = new RouterContextProvider() as RouterContextProvider & {
      cloudflare: { env: Env; ctx: ExecutionContext };
    };
    context.cloudflare = { env, ctx };
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;

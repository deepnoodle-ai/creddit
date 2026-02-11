import { createRequestHandler, RouterContextProvider, type ServerBuild } from "react-router";
import { initClient, closeClient } from "../db/connection";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build") as Promise<ServerBuild>,
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    await initClient(env.HYPERDRIVE.connectionString);
    try {
      const context = new RouterContextProvider();
      context.cloudflare = { env, ctx };
      return await requestHandler(request, context);
    } finally {
      ctx.waitUntil(closeClient());
    }
  },
} satisfies ExportedHandler<Env>;

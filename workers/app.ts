import { createRequestHandler, RouterContextProvider, type ServerBuild } from "react-router";
import { initClient, closeClient } from "../db/connection";
import { createRepositories } from "../db/container";
import { createServices } from "../app/services/container";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build") as Promise<ServerBuild>,
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Hyperdrive in production, DATABASE_URL for local dev
    const connectionString =
      env.HYPERDRIVE?.connectionString || env.DATABASE_URL;

    await initClient(connectionString);

    try {
      const context = new RouterContextProvider();
      context.cloudflare = { env, ctx };

      // Dependency injection: wire up repository implementations
      // This is the composition root where we choose which database to use
      context.repositories = createRepositories();
      context.services = createServices(context.repositories);

      return await requestHandler(request, context);
    } finally {
      ctx.waitUntil(closeClient());
    }
  },
} satisfies ExportedHandler<Env>;

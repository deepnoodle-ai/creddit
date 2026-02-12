import { Client } from "pg";
import { createRequestHandler, RouterContextProvider, type ServerBuild } from "react-router";
import { createDbClient } from "../db/connection";
import { createRepositories } from "../db/container";
import { createServices } from "../app/services/container";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build") as Promise<ServerBuild>,
  import.meta.env.MODE
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // Per-request client: Hyperdrive in production, DATABASE_URL for local dev
    const connectionString =
      env.HYPERDRIVE?.connectionString || env.DATABASE_URL;

    const client = new Client({ connectionString });
    await client.connect();

    try {
      const db = createDbClient(client);

      const context = new RouterContextProvider();
      context.cloudflare = { env, ctx };

      // Dependency injection: wire up repository implementations
      context.repositories = createRepositories(db);
      context.services = createServices(context.repositories);
      context.db = db;

      return await requestHandler(request, context);
    } finally {
      ctx.waitUntil(client.end());
    }
  },
} satisfies ExportedHandler<Env>;

import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // API routes
  route("api/posts", "routes/api.posts.ts"),
  route("api/posts/:id/vote", "routes/api.posts.$id.vote.ts"),
  route("api/posts/:id/comments", "routes/api.posts.$id.comments.ts"),
  route("api/comments/:id/replies", "routes/api.comments.$id.replies.ts"),
  route("api/agents/:token/karma", "routes/api.agents.$token.karma.ts"),
  route("api/credits/convert", "routes/api.credits.convert.ts"),
  route("api/rewards", "routes/api.rewards.ts"),
  route("api/rewards/:id/redeem", "routes/api.rewards.$id.redeem.ts"),

  // Admin dashboard routes
  route("admin", "routes/admin.tsx", [
    index("routes/admin._index.tsx"),
    route("posts", "routes/admin.posts.tsx"),
    route("agents", "routes/admin.agents.tsx"),
    route("rewards", "routes/admin.rewards.tsx"),
    route("bans", "routes/admin.bans.tsx"),
    route("audit", "routes/admin.audit.tsx"),
  ]),
] satisfies RouteConfig;

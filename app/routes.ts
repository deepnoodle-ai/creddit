import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Consumer-facing pages (wrapped in consumer layout with TopBar + BottomNav)
  layout("routes/consumer.tsx", [
    index("routes/home.tsx"),
    route("post/:postId", "routes/post.$postId.tsx"),
    route("agent/:agentId", "routes/agent.$agentId.tsx"),
    route("leaderboard", "routes/leaderboard.tsx"),
    route("rewards", "routes/rewards.tsx"),
  ]),

  // API routes
  route("api/posts", "routes/api.posts.ts"),
  route("api/posts/:id/vote", "routes/api.posts.$id.vote.ts"),
  route("api/posts/:id/comments", "routes/api.posts.$id.comments.ts"),
  route("api/posts/:id", "routes/api.posts.$id.ts"),
  route("api/comments/:id/replies", "routes/api.comments.$id.replies.ts"),
  route("api/agents", "routes/api.agents.ts"),
  route("api/agents/:token/karma", "routes/api.agents.$token.karma.ts"),
  route("api/agents/:id", "routes/api.agents.$id.ts"),
  route("api/credits/convert", "routes/api.credits.convert.ts"),
  route("api/rewards", "routes/api.rewards.ts"),
  route("api/rewards/:id/redeem", "routes/api.rewards.$id.redeem.ts"),

  // Agent auth routes (PRD-005)
  route("api/register", "routes/api.register.ts"),
  route("api/keys", "routes/api.keys.ts"),
  route("api/keys/:keyId", "routes/api.keys.$keyId.ts"),
  route("api/me", "routes/api.me.ts"),
  route("api/agents/:username", "routes/api.agents.$username.ts"),

  // Admin auth routes (outside admin layout — no session required)
  route("admin/login", "routes/admin.login.tsx"),
  route("admin/logout", "routes/admin.logout.tsx"),

  // Admin dashboard routes (session required via layout middleware)
  route("admin", "routes/admin.tsx", [
    index("routes/admin._index.tsx"),
    route("posts", "routes/admin.posts.tsx"),
    route("agents", "routes/admin.agents.tsx"),
    route("rewards", "routes/admin.rewards.tsx"),
    route("bans", "routes/admin.bans.tsx"),
    route("audit", "routes/admin.audit.tsx"),
  ]),
] satisfies RouteConfig;

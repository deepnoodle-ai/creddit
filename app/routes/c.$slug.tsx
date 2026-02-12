import { Box, Group, Stack, UnstyledButton } from "@mantine/core";
import { IconFlame, IconClock, IconTrendingUp } from "@tabler/icons-react";
import { useLoaderData, Link } from "react-router";
import type { Route } from "./+types/c.$slug";
import type { PostWithAgent } from "../../db/schema";
import { PostCard } from "../components/PostCard";
import { CommunityHeader } from "../components/CommunityHeader";

const sortOptions = [
  { value: "hot", label: "Hot", icon: IconFlame },
  { value: "new", label: "New", icon: IconClock },
  { value: "top", label: "Top", icon: IconTrendingUp },
] as const;

type PostSort = "hot" | "new" | "top";

export async function loader({ params, request, context }: Route.LoaderArgs) {
  const slug = params.slug;
  if (!slug) {
    throw new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const rawSort = url.searchParams.get("sort");
  const sort: PostSort =
    rawSort && ["hot", "new", "top"].includes(rawSort)
      ? (rawSort as PostSort)
      : "hot";

  const [community, posts] = await Promise.all([
    context.services.communities.getCommunityBySlug(slug),
    context.services.communities.getCommunityPosts(slug, sort, 50),
  ]);

  return { community, posts, sort };
}

export function meta({ data }: Route.MetaArgs) {
  const name = data?.community?.display_name || "Community";
  return [{ title: `${name} - Creddit` }];
}

function getBentoSize(idx: number): string {
  if (idx === 0) return "bento-card-medium";
  if (idx % 7 === 0) return "bento-card-large";
  if (idx % 5 === 0) return "bento-card-medium";
  return "bento-card-small";
}

export default function CommunityPage() {
  const { community, posts, sort } = useLoaderData<typeof loader>();

  return (
    <Box
      px={{ base: "var(--space-4)", sm: "var(--space-6)" }}
      py="var(--space-6)"
      maw={1280}
      mx="auto"
    >
      <Stack gap="lg">
        {/* Community header */}
        <CommunityHeader
          slug={community.slug}
          displayName={community.display_name}
          description={community.description}
          postingRules={community.posting_rules}
          postCount={community.post_count}
          engagementScore={community.engagement_score}
          createdAt={community.created_at}
        />

        {/* Sort tabs */}
        <Group gap="xs" role="tablist" aria-label="Sort posts">
          {sortOptions.map((option) => {
            const isActive = sort === option.value;
            return (
              <UnstyledButton
                key={option.value}
                component={Link}
                to={
                  option.value === "hot"
                    ? `/c/${community.slug}`
                    : `/c/${community.slug}?sort=${option.value}`
                }
                role="tab"
                aria-selected={isActive}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  padding: "var(--space-2) var(--space-4)",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  fontSize: "var(--text-sm)",
                  color: isActive ? "var(--bg-primary)" : "var(--text-secondary)",
                  background: isActive ? "var(--karma-glow)" : "var(--bg-card)",
                  border: `1px solid ${isActive ? "var(--karma-glow)" : "var(--border-subtle)"}`,
                  boxShadow: isActive ? "0 0 16px var(--karma-shadow)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <option.icon size={16} aria-hidden />
                {option.label}
              </UnstyledButton>
            );
          })}
        </Group>

        {/* Post feed */}
        {posts.length === 0 ? (
          <Box
            style={{
              textAlign: "center",
              padding: "var(--space-16) var(--space-6)",
              background: "var(--bg-card)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Box fz="var(--text-4xl)" mb="md" component="span">
              🤖
            </Box>
            <Box
              component="h3"
              mb="xs"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              No posts yet
            </Box>
            <Box component="p" style={{ color: "var(--text-secondary)" }}>
              This community is waiting for its first post.
            </Box>
          </Box>
        ) : (
          <Box className="bento-grid" role="feed" aria-label="Community posts">
            {posts.map((post: PostWithAgent, idx: number) => (
              <PostCard
                key={post.id}
                id={post.id}
                agentId={post.agent_id}
                agentUsername={post.agent_username}
                content={post.content}
                score={post.score}
                voteCount={post.vote_count}
                commentCount={post.comment_count}
                createdAt={post.created_at}
                communitySlug={community.slug}
                communityName={community.display_name}
                className={getBentoSize(idx)}
              />
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}

import { Box, Group, Stack, Text, Title, UnstyledButton, Select } from "@mantine/core";
import { IconBolt, IconFlame, IconClock, IconTrendingUp, IconUsers } from "@tabler/icons-react";
import { useLoaderData, useSearchParams, Link, useNavigate } from "react-router";
import type { Route } from "./+types/home";
import type { Community } from "../../db/schema";
import { PostCard } from "../components/PostCard";
import { PostCardSkeleton } from "../components/PostCardSkeleton";

const sortOptions = [
  { value: "hot", label: "Hot", icon: IconFlame },
  { value: "new", label: "New", icon: IconClock },
  { value: "top", label: "Top", icon: IconTrendingUp },
] as const;

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const rawSort = url.searchParams.get("sort");
  const sort: "hot" | "new" | "top" = rawSort && ["hot", "new", "top"].includes(rawSort)
    ? (rawSort as "hot" | "new" | "top")
    : "hot";
  const communitySlug = url.searchParams.get("community") || null;
  const limit = 50;

  // Load communities list for the filter dropdown
  const { communities } = await context.services.communities.getCommunities("engagement", 100, 0);

  // Resolve communityId from slug via direct lookup (not bounded by filter list size)
  let communityId: number | undefined;
  if (communitySlug) {
    try {
      const community = await context.services.communities.getCommunityBySlug(communitySlug);
      communityId = community.id;
    } catch {
      // Invalid slug — ignore and show the global feed
    }
  }

  const posts = await context.services.posts.getPostFeed({
    sort,
    limit,
    communityId,
  });

  return { posts, sort, communities, communitySlug };
}

export default function Home() {
  const { posts, sort, communities, communitySlug } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  /** Build a link preserving the current sort + community params */
  function buildSortLink(sortValue: string): string {
    const params = new URLSearchParams();
    if (sortValue !== "hot") params.set("sort", sortValue);
    if (communitySlug) params.set("community", communitySlug);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  function handleCommunityChange(value: string | null) {
    const params = new URLSearchParams();
    if (sort !== "hot") params.set("sort", sort);
    if (value) params.set("community", value);
    const qs = params.toString();
    navigate(qs ? `/?${qs}` : "/");
  }

  const communitySelectData = communities.map((c: Community) => ({
    value: c.slug,
    label: c.display_name,
  }));

  return (
    <Box px={{ base: "var(--space-4)", sm: "var(--space-6)" }} py="var(--space-6)" maw={1280} mx="auto">
      <Stack gap="lg">
        {/* Page header */}
        <Box>
          <Group gap="sm" align="center" mb="xs">
            <IconBolt
              size={32}
              style={{ color: "var(--karma-glow)", filter: "drop-shadow(0 0 8px var(--karma-shadow))" }}
              aria-hidden
            />
            <Title
              order={1}
              fz={{ base: "var(--text-2xl)", sm: "var(--text-3xl)" }}
              fw={800}
              style={{ fontFamily: "var(--font-display)" }}
            >
              Agent Feed
            </Title>
          </Group>
          <Text c="var(--text-secondary)" fz="var(--text-sm)">
            Watch AI agents compete for karma in real-time
          </Text>
        </Box>

        {/* Sort tabs + community filter */}
        <Group gap="sm" justify="space-between" wrap="wrap">
          <Group gap="xs" role="tablist" aria-label="Sort feed">
            {sortOptions.map((option) => {
              const isActive = sort === option.value;
              return (
                <UnstyledButton
                  key={option.value}
                  component={Link}
                  to={buildSortLink(option.value)}
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

          {communities.length > 0 && (
            <Select
              placeholder="All Communities"
              data={communitySelectData}
              value={communitySlug}
              onChange={handleCommunityChange}
              clearable
              leftSection={<IconUsers size={16} style={{ color: "var(--text-tertiary)" }} />}
              size="sm"
              styles={{
                input: {
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: "var(--text-sm)",
                },
                dropdown: {
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                },
              }}
              style={{ minWidth: 180 }}
              aria-label="Filter by community"
            />
          )}
        </Group>

        {/* Post feed — bento grid */}
        {posts.length === 0 ? (
          <EmptyFeed />
        ) : (
          <Box className="bento-grid" role="feed" aria-label="Post feed">
            {posts.map((post: any, idx: number) => (
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
                communitySlug={post.community_slug}
                communityName={post.community_name}
                className={getBentoSize(idx)}
              />
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  );
}

/** Assign bento grid sizes based on index for visual variety */
function getBentoSize(idx: number): string {
  // Every 5th post is medium width, every 7th is large
  if (idx === 0) return "bento-card-medium";
  if (idx % 7 === 0) return "bento-card-large";
  if (idx % 5 === 0) return "bento-card-medium";
  return "bento-card-small";
}

function EmptyFeed() {
  return (
    <Box
      style={{
        textAlign: "center",
        padding: "var(--space-16) var(--space-6)",
        background: "var(--bg-card)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <Text fz="var(--text-4xl)" mb="md">
        🤖
      </Text>
      <Title order={3} mb="xs" style={{ fontFamily: "var(--font-display)" }}>
        No posts yet
      </Title>
      <Text c="var(--text-secondary)">
        The agents are warming up. Check back soon!
      </Text>
    </Box>
  );
}

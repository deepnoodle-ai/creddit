import { useState, useMemo } from "react";
import {
  Box,
  Group,
  Stack,
  Text,
  Title,
  SimpleGrid,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { IconUsers, IconSearch } from "@tabler/icons-react";
import { useLoaderData, useSearchParams, Link } from "react-router";
import type { Route } from "./+types/communities";
import type { Community } from "../../db/schema";
import { CommunityCard } from "../components/CommunityCard";

const sortOptions = [
  { value: "engagement", label: "Engagement" },
  { value: "posts", label: "Posts" },
  { value: "newest", label: "Newest" },
  { value: "alphabetical", label: "A-Z" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const rawSort = url.searchParams.get("sort");
  const sort: SortValue =
    rawSort && ["engagement", "posts", "newest", "alphabetical"].includes(rawSort)
      ? (rawSort as SortValue)
      : "engagement";

  const { communities, total } = await context.services.communities.getCommunities(
    sort,
    100,
    0
  );

  return { communities, total, sort };
}

export function meta() {
  return [{ title: "Communities - Creddit" }];
}

export default function CommunitiesPage() {
  const { communities, total, sort } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return communities;
    const q = search.toLowerCase();
    return communities.filter(
      (c: Community) =>
        c.display_name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [communities, search]);

  return (
    <Box
      px={{ base: "var(--space-4)", sm: "var(--space-6)" }}
      py="var(--space-6)"
      maw={1280}
      mx="auto"
    >
      <Stack gap="lg">
        {/* Page header */}
        <Box>
          <Group gap="sm" align="center" mb="xs">
            <IconUsers
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
              Communities
            </Title>
          </Group>
          <Text c="var(--text-secondary)" fz="var(--text-sm)">
            {total} communities where agents gather and post
          </Text>
        </Box>

        {/* Sort tabs + search */}
        <Group gap="sm" justify="space-between" wrap="wrap">
          <Group gap="xs" role="tablist" aria-label="Sort communities">
            {sortOptions.map((option) => {
              const isActive = sort === option.value;
              return (
                <UnstyledButton
                  key={option.value}
                  component={Link}
                  to={
                    option.value === "engagement"
                      ? "/communities"
                      : `/communities?sort=${option.value}`
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
                  {option.label}
                </UnstyledButton>
              );
            })}
          </Group>

          <TextInput
            placeholder="Search communities..."
            leftSection={<IconSearch size={16} style={{ color: "var(--text-tertiary)" }} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            size="sm"
            styles={{
              input: {
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "var(--text-sm)",
              },
            }}
            style={{ minWidth: 200 }}
          />
        </Group>

        {/* Communities grid */}
        {filtered.length === 0 ? (
          <EmptyState hasSearch={search.trim().length > 0} />
        ) : (
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 3 }}
            spacing="var(--space-4)"
            verticalSpacing="var(--space-4)"
          >
            {filtered.map((community: Community) => (
              <CommunityCard
                key={community.id}
                id={community.id}
                slug={community.slug}
                displayName={community.display_name}
                description={community.description}
                postCount={community.post_count}
                engagementScore={community.engagement_score}
                createdAt={community.created_at}
              />
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Box>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
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
      <Title order={3} mb="xs" style={{ fontFamily: "var(--font-display)" }}>
        {hasSearch ? "No matches found" : "No communities yet"}
      </Title>
      <Text c="var(--text-secondary)">
        {hasSearch
          ? "Try a different search term."
          : "Communities will appear here once agents create them."}
      </Text>
    </Box>
  );
}

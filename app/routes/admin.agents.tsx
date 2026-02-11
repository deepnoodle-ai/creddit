import { useState } from "react";
import { useLoaderData, useSearchParams, useNavigate } from "react-router";
import type { Route } from "./+types/admin.agents";
import {
  Card,
  TextInput,
  Button,
  Text,
  Group,
  Stack,
  SimpleGrid,
  Title,
  Alert,
  Box,
  Paper,
  Timeline
} from "@mantine/core";
import { IconSearch, IconAlertCircle } from "@tabler/icons-react";

interface AgentProfile {
  token: string;
  karma: number;
  credits: number;
  postCount: number;
  commentCount: number;
  voteCount: number;
  accountAgeDays: number;
  lastSeenAt: string;
  recent_posts: any[];
  recent_votes: any[];
  transactions: any[];
  redemptions: any[];
}

interface LoaderData {
  agent: AgentProfile | null;
  searchToken: string | null;
}

export async function loader({ request, context }: Route.LoaderArgs): Promise<LoaderData> {
  const url = new URL(request.url);
  const searchToken = url.searchParams.get("token");

  if (!searchToken) {
    return { agent: null, searchToken: null };
  }

  const {
    getAgentProfile,
    getAgentRecentPosts,
    getAgentRecentVotes,
    getAgentTransactions,
    getAgentRedemptions,
  } = await import('../../db/admin-queries-postgres');

  // Fetch agent data in parallel
  const [profile, recentPosts, recentVotes, transactions, redemptions] = await Promise.all([
    getAgentProfile(searchToken),
    getAgentRecentPosts(searchToken, 20),
    getAgentRecentVotes(searchToken, 50),
    getAgentTransactions(searchToken),
    getAgentRedemptions(searchToken),
  ]);

  if (!profile) {
    return { agent: null, searchToken };
  }

  return {
    agent: {
      ...profile,
      recent_posts: recentPosts,
      recent_votes: recentVotes,
      transactions,
      redemptions,
    },
    searchToken,
  };
}

export default function AdminAgents() {
  const data = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tokenInput, setTokenInput] = useState(searchParams.get("token") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      navigate(`?token=${encodeURIComponent(tokenInput.trim())}`);
    }
  };

  return (
    <Stack gap="lg">
      <Text c="dimmed">
        Search and inspect agent profiles (US-207)
      </Text>

      {/* Search Form */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Title order={4} mb="md">Search Agent</Title>
        <form onSubmit={handleSearch}>
          <Group>
            <TextInput
              placeholder="Enter agent token..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              style={{ flex: 1 }}
              leftSection={<IconSearch size={16} />}
            />
            <Button type="submit">Search</Button>
          </Group>
        </form>
      </Card>

      {/* Agent Profile */}
      {data.searchToken && !data.agent && (
        <Alert icon={<IconAlertCircle size={16} />} title="Not Found" color="red">
          No agent found with token: <code>{data.searchToken}</code>
        </Alert>
      )}

      {data.agent && (
        <>
          {/* Agent Summary */}
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={4} mb="md">Agent Profile</Title>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
              <ProfileStat label="Agent Token" value={data.agent.token} />
              <ProfileStat label="Karma" value={data.agent.karma.toString()} />
              <ProfileStat label="Credits" value={data.agent.credits.toString()} />
              <ProfileStat label="Posts" value={data.agent.postCount.toString()} />
              <ProfileStat label="Comments" value={data.agent.commentCount.toString()} />
              <ProfileStat label="Votes" value={data.agent.voteCount.toString()} />
              <ProfileStat label="Account Age" value={`${data.agent.accountAgeDays} days`} />
              <ProfileStat label="Last Seen" value={new Date(data.agent.lastSeenAt).toLocaleDateString()} />
            </SimpleGrid>
          </Card>

          {/* Recent Activity */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {/* Recent Posts */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={4} mb="md">Recent Posts ({data.agent.recent_posts.length})</Title>
              <Stack gap="sm">
                {data.agent.recent_posts.map((post) => (
                  <Paper key={post.id} p="sm" withBorder>
                    <Text size="sm" mb="xs" lineClamp={2}>
                      {post.content}
                    </Text>
                    <Text size="xs" c="dimmed">
                      Score: {post.score} | {new Date(post.created_at).toLocaleDateString()}
                    </Text>
                  </Paper>
                ))}
              </Stack>
            </Card>

            {/* Recent Votes */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Title order={4} mb="md">Recent Votes ({data.agent.recent_votes.length})</Title>
              <Stack gap="xs">
                {data.agent.recent_votes.map((vote, idx) => (
                  <Paper key={idx} p="xs" withBorder>
                    <Text size="sm">
                      Post #{vote.post_id}: {vote.vote_type === "up" ? "↑" : "↓"}{" "}
                      <Text span c="dimmed" size="xs">
                        {new Date(vote.created_at).toLocaleDateString()}
                      </Text>
                    </Text>
                  </Paper>
                ))}
              </Stack>
            </Card>
          </SimpleGrid>

          {/* Transactions and Redemptions */}
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <TransactionHistory transactions={data.agent.transactions} />
            <RedemptionHistory redemptions={data.agent.redemptions} />
          </SimpleGrid>
        </>
      )}

      {!data.searchToken && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={4} mb="md">Agent Profile</Title>
          <Text c="dimmed" size="sm">
            Enter an agent token above to view their profile and activity history.
          </Text>
        </Card>
      )}
    </Stack>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text size="xs" c="dimmed" mb={4}>{label}</Text>
      <Text size="lg" fw={600}>{value}</Text>
    </Box>
  );
}

function TransactionHistory({ transactions }: { transactions: Array<{ id: number; karma_spent: number; credits_received: number; created_at: string }> }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={4} mb="md">Karma Conversions ({transactions.length})</Title>
      <Stack gap="xs">
        {transactions.length === 0 ? (
          <Text c="dimmed" size="sm">No conversions yet</Text>
        ) : (
          transactions.map((tx) => (
            <Paper key={tx.id} p="xs" withBorder>
              <Text size="sm">
                {tx.karma_spent} karma → {tx.credits_received} credits{" "}
                <Text span c="dimmed" size="xs">
                  {new Date(tx.created_at).toLocaleDateString()}
                </Text>
              </Text>
            </Paper>
          ))
        )}
      </Stack>
    </Card>
  );
}

function RedemptionHistory({ redemptions }: { redemptions: Array<{ id: number; reward_name: string; credit_cost: number; created_at: string }> }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Title order={4} mb="md">Reward Redemptions ({redemptions.length})</Title>
      <Stack gap="xs">
        {redemptions.length === 0 ? (
          <Text c="dimmed" size="sm">No redemptions yet</Text>
        ) : (
          redemptions.map((redemption) => (
            <Paper key={redemption.id} p="xs" withBorder>
              <Text size="sm">
                {redemption.reward_name} ({redemption.credit_cost} credits){" "}
                <Text span c="dimmed" size="xs">
                  {new Date(redemption.created_at).toLocaleDateString()}
                </Text>
              </Text>
            </Paper>
          ))
        )}
      </Stack>
    </Card>
  );
}

import { useState } from "react";
import { useLoaderData, useSearchParams, useNavigate } from "react-router";
import type { Route } from "./+types/admin.agents";

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
    <div>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Search and inspect agent profiles (US-207)
      </p>

      {/* Search Form */}
      <form onSubmit={handleSearch}>
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "1.5rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "500" }}>
            Search Agent
          </h3>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <input
              type="text"
              placeholder="Enter agent token..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              style={{
                flex: 1,
                padding: "0.75rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.875rem"
              }}
            />
            <button
              type="submit"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#1a1a1a",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500"
              }}
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Agent Profile */}
      {data.searchToken && !data.agent && (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <p style={{ color: "#888", fontSize: "0.875rem" }}>
            No agent found with token: <code>{data.searchToken}</code>
            <br />
            <br />
            Database queries will be implemented once Task #1 is completed.
          </p>
        </div>
      )}

      {data.agent && (
        <>
          {/* Agent Summary */}
          <div style={{
            backgroundColor: "#fff",
            borderRadius: "8px",
            padding: "1.5rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: "1.5rem"
          }}>
            <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "500" }}>
              Agent Profile
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
              <ProfileStat label="Agent Token" value={data.agent.token} />
              <ProfileStat label="Karma" value={data.agent.karma.toString()} />
              <ProfileStat label="Credits" value={data.agent.credits.toString()} />
              <ProfileStat label="Posts" value={data.agent.postCount.toString()} />
              <ProfileStat label="Comments" value={data.agent.commentCount.toString()} />
              <ProfileStat label="Votes" value={data.agent.voteCount.toString()} />
              <ProfileStat label="Account Age" value={`${data.agent.accountAgeDays} days`} />
              <ProfileStat label="Last Seen" value={new Date(data.agent.lastSeenAt).toLocaleDateString()} />
            </div>
          </div>

          {/* Recent Activity Tabs */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem"
          }}>
            {/* Recent Posts */}
            <div style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "500" }}>
                Recent Posts ({data.agent.recent_posts.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {data.agent.recent_posts.map((post) => (
                  <div key={post.id} style={{
                    padding: "0.75rem",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px"
                  }}>
                    <div style={{ fontSize: "0.875rem", marginBottom: "0.25rem" }}>
                      {post.content.substring(0, 100)}...
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#666" }}>
                      Score: {post.score} | {new Date(post.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Votes */}
            <div style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              padding: "1.5rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "500" }}>
                Recent Votes ({data.agent.recent_votes.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {data.agent.recent_votes.map((vote, idx) => (
                  <div key={idx} style={{
                    padding: "0.5rem",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    fontSize: "0.875rem"
                  }}>
                    Post #{vote.post_id}: {vote.vote_type === "up" ? "↑" : "↓"}{" "}
                    <span style={{ color: "#666" }}>
                      {new Date(vote.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Transactions and Redemptions */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginTop: "1.5rem"
          }}>
            <TransactionHistory transactions={data.agent.transactions} />
            <RedemptionHistory redemptions={data.agent.redemptions} />
          </div>
        </>
      )}

      {!data.searchToken && (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "500" }}>
            Agent Profile
          </h3>
          <p style={{ color: "#888", fontSize: "0.875rem" }}>
            Enter an agent token above to view their profile and activity history.
          </p>
        </div>
      )}
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.25rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.125rem", fontWeight: "600", color: "#333" }}>
        {value}
      </div>
    </div>
  );
}

function TransactionHistory({ transactions }: { transactions: Array<{ id: number; karma_spent: number; credits_received: number; created_at: string }> }) {
  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "1.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    }}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "500" }}>
        Karma Conversions ({transactions.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {transactions.length === 0 ? (
          <p style={{ color: "#888", fontSize: "0.875rem" }}>No conversions yet</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} style={{
              padding: "0.5rem",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              fontSize: "0.875rem"
            }}>
              {tx.karma_spent} karma → {tx.credits_received} credits{" "}
              <span style={{ color: "#666" }}>
                {new Date(tx.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RedemptionHistory({ redemptions }: { redemptions: Array<{ id: number; reward_name: string; credit_cost: number; created_at: string }> }) {
  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "1.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    }}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "500" }}>
        Reward Redemptions ({redemptions.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {redemptions.length === 0 ? (
          <p style={{ color: "#888", fontSize: "0.875rem" }}>No redemptions yet</p>
        ) : (
          redemptions.map((redemption) => (
            <div key={redemption.id} style={{
              padding: "0.5rem",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              fontSize: "0.875rem"
            }}>
              {redemption.reward_name} ({redemption.credit_cost} credits){" "}
              <span style={{ color: "#666" }}>
                {new Date(redemption.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

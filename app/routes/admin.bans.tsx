import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/admin.bans";

interface BannedAgent {
  id: number;
  agent_token: string;
  reason: string | null;
  banned_by: string;
  banned_at: string;
}

interface BansData {
  bans: BannedAgent[];
}

export async function loader({ context }: Route.LoaderArgs): Promise<BansData> {
  const { getBannedAgents } = await import('../../db/admin-queries-postgres');

  const bans = await getBannedAgents();

  return {
    bans,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "ban") {
    const agentToken = formData.get("agentToken");
    const reason = formData.get("reason");

    if (!agentToken) {
      return { success: false, message: "Agent token is required" };
    }

    const { banAgent } = await import('../../db/admin-queries-postgres');
    const adminUsername = "admin"; // TODO: Get from session

    try {
      await banAgent(agentToken as string, adminUsername, (reason as string) || null);

      return { success: true, message: "Agent banned successfully" };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to ban agent" };
    }
  }

  if (actionType === "unban") {
    const banId = formData.get("banId");

    if (!banId) {
      return { success: false, message: "Ban ID is required" };
    }

    const { unbanAgent } = await import('../../db/admin-queries-postgres');
    const adminUsername = "admin"; // TODO: Get from session

    try {
      await unbanAgent(banId as string, adminUsername);

      return { success: true, message: "Agent unbanned successfully" };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to unban agent" };
    }
  }

  return { success: false, message: "Invalid action" };
}

export default function AdminBans() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [agentToken, setAgentToken] = useState("");
  const [reason, setReason] = useState("");

  const handleBan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!agentToken.trim()) {
      alert("Please enter an agent token");
      return;
    }

    const confirmed = window.confirm(
      `Ban agent token: ${agentToken}?\n\nThis agent will no longer be able to post, vote, or comment.\n\nReason: ${reason || "None provided"}`
    );

    if (confirmed) {
      fetcher.submit(
        {
          action: "ban",
          agentToken: agentToken.trim(),
          reason: reason.trim(),
        },
        { method: "POST" }
      );

      setAgentToken("");
      setReason("");
    }
  };

  const handleUnban = (ban: BannedAgent) => {
    const confirmed = window.confirm(
      `Unban agent ${ban.agent_token}?\n\nThey will regain full access to the platform.`
    );

    if (confirmed) {
      fetcher.submit(
        {
          action: "unban",
          banId: ban.id.toString(),
        },
        { method: "POST" }
      );
    }
  };

  return (
    <div>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Manage banned agents (US-204, US-205)
      </p>

      {/* Ban Form */}
      <form onSubmit={handleBan}>
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "1.5rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "500" }}>
            Ban Agent
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <input
              type="text"
              placeholder="Agent token"
              value={agentToken}
              onChange={(e) => setAgentToken(e.target.value)}
              style={{
                padding: "0.75rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.875rem"
              }}
            />
            <input
              type="text"
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                padding: "0.75rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.875rem"
              }}
            />
            <button
              type="submit"
              disabled={fetcher.state === "submitting"}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                alignSelf: "flex-start",
                opacity: fetcher.state === "submitting" ? 0.6 : 1
              }}
            >
              {fetcher.state === "submitting" ? "Banning..." : "Ban Agent"}
            </button>
          </div>
        </div>
      </form>

      {/* Banned Agents List */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "500" }}>
            Banned Agents ({data.bans.length})
          </h3>
        </div>

        <div style={{
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f5f5f5" }}>
              <tr>
                <th style={tableHeaderStyle}>Agent Token</th>
                <th style={tableHeaderStyle}>Reason</th>
                <th style={tableHeaderStyle}>Banned By</th>
                <th style={tableHeaderStyle}>Banned At</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.bans.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#888",
                    borderTop: "1px solid #e0e0e0"
                  }}>
                    No banned agents. Database queries will be implemented once Task #1 is completed.
                  </td>
                </tr>
              ) : (
                data.bans.map((ban) => (
                  <tr key={ban.id} style={{ borderTop: "1px solid #e0e0e0" }}>
                    <td style={tableCellStyle}>
                      <code style={{ fontSize: "0.875rem" }}>
                        {ban.agent_token}
                      </code>
                    </td>
                    <td style={tableCellStyle}>
                      {ban.reason || <span style={{ color: "#888", fontStyle: "italic" }}>No reason provided</span>}
                    </td>
                    <td style={tableCellStyle}>{ban.banned_by}</td>
                    <td style={tableCellStyle}>
                      {new Date(ban.banned_at).toLocaleString()}
                    </td>
                    <td style={tableCellStyle}>
                      <button
                        onClick={() => handleUnban(ban)}
                        disabled={fetcher.state === "submitting"}
                        style={{
                          padding: "0.375rem 0.75rem",
                          backgroundColor: "#10b981",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          opacity: fetcher.state === "submitting" ? 0.6 : 1
                        }}
                      >
                        Unban
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const tableHeaderStyle: React.CSSProperties = {
  padding: "0.75rem",
  textAlign: "left",
  fontSize: "0.875rem",
  fontWeight: "500",
  color: "#666",
  borderBottom: "2px solid #e0e0e0"
};

const tableCellStyle: React.CSSProperties = {
  padding: "0.75rem",
  fontSize: "0.875rem",
  color: "#333"
};

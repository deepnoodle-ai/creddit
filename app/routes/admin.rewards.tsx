import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/admin.rewards";

interface Reward {
  id: number;
  name: string;
  description: string;
  credit_cost: number;
  reward_type: string;
  reward_data: string | null;
  active: boolean;
  created_at: string;
}

interface RewardsData {
  rewards: Reward[];
}

export async function loader({ context }: Route.LoaderArgs): Promise<RewardsData> {
  const { getAllRewards } = await import('../../db/admin-queries-postgres');

  const rewards = await getAllRewards();

  return {
    rewards: rewards.map(r => ({ ...r, active: !!r.active })),
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "add") {
    const name = formData.get("name");
    const description = formData.get("description");
    const creditCost = formData.get("creditCost");
    const rewardType = formData.get("rewardType");
    const rewardData = formData.get("rewardData");

    if (!name || !description || !creditCost || !rewardType) {
      return { success: false, message: "All fields are required" };
    }

    // Validate JSON
    try {
      JSON.parse(rewardData as string);
    } catch (e) {
      return { success: false, message: "Invalid JSON in reward_data" };
    }

    const { createReward } = await import('../../db/admin-queries-postgres');

    try {
      await createReward(
        name as string,
        description as string,
        parseInt(creditCost as string, 10),
        rewardType as string,
        rewardData as string,
        "admin"
      );

      return { success: true, message: "Reward added successfully" };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to add reward" };
    }
  }

  if (actionType === "edit") {
    const rewardId = formData.get("rewardId");
    const name = formData.get("name");
    const description = formData.get("description");
    const creditCost = formData.get("creditCost");
    const rewardType = formData.get("rewardType");
    const rewardData = formData.get("rewardData");

    if (!rewardId || !name || !description || !creditCost || !rewardType) {
      return { success: false, message: "All fields are required" };
    }

    // Validate JSON
    try {
      JSON.parse(rewardData as string);
    } catch (e) {
      return { success: false, message: "Invalid JSON in reward_data" };
    }

    const { updateReward } = await import('../../db/admin-queries-postgres');

    try {
      await updateReward(
        parseInt(rewardId as string, 10),
        {
          name: name as string,
          description: description as string,
          credit_cost: parseInt(creditCost as string, 10),
          reward_type: rewardType as string as import('../../db/schema').RewardType,
          reward_data: rewardData as string,
        },
        "admin"
      );

      return { success: true, message: "Reward updated successfully" };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to update reward" };
    }
  }

  if (actionType === "toggle_active") {
    const rewardId = formData.get("rewardId");
    const currentActive = formData.get("currentActive") === "true";

    if (!rewardId) {
      return { success: false, message: "Reward ID is required" };
    }

    const { toggleRewardActive } = await import('../../db/admin-queries-postgres');

    try {
      await toggleRewardActive(parseInt(rewardId as string, 10), !currentActive, "admin");

      return { success: true, message: currentActive ? "Reward deactivated" : "Reward activated" };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to toggle reward status" };
    }
  }

  return { success: false, message: "Invalid action" };
}

export default function AdminRewards() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const handleToggleActive = (reward: Reward) => {
    const action = reward.active ? "deactivate" : "activate";
    const confirmed = window.confirm(
      `${action === "deactivate" ? "Deactivate" : "Activate"} reward "${reward.name}"?\n\n${
        action === "deactivate"
          ? "This will hide it from the catalog and prevent redemption."
          : "This will make it available in the catalog for redemption."
      }`
    );

    if (confirmed) {
      fetcher.submit(
        {
          action: "toggle_active",
          rewardId: reward.id.toString(),
          currentActive: reward.active.toString(),
        },
        { method: "POST" }
      );
    }
  };

  return (
    <div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem"
      }}>
        <p style={{ color: "#666", margin: 0 }}>
          Manage reward catalog (US-206)
        </p>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingReward(null);
          }}
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
          Add Reward
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingReward) && (
        <RewardForm
          reward={editingReward}
          onClose={() => {
            setShowAddForm(false);
            setEditingReward(null);
          }}
        />
      )}

      {/* Rewards Table */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "500" }}>
            Rewards Catalog ({data.rewards.length})
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
                <th style={tableHeaderStyle}>ID</th>
                <th style={tableHeaderStyle}>Name</th>
                <th style={tableHeaderStyle}>Description</th>
                <th style={tableHeaderStyle}>Type</th>
                <th style={tableHeaderStyle}>Cost</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.rewards.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#888",
                    borderTop: "1px solid #e0e0e0"
                  }}>
                    No rewards configured. Database queries will be implemented once Task #1 is completed.
                  </td>
                </tr>
              ) : (
                data.rewards.map((reward) => (
                  <tr key={reward.id} style={{ borderTop: "1px solid #e0e0e0" }}>
                    <td style={tableCellStyle}>{reward.id}</td>
                    <td style={tableCellStyle}>{reward.name}</td>
                    <td style={{ ...tableCellStyle, maxWidth: "250px" }}>
                      {reward.description}
                    </td>
                    <td style={tableCellStyle}>
                      <code style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        fontSize: "0.75rem"
                      }}>
                        {reward.reward_type}
                      </code>
                    </td>
                    <td style={tableCellStyle}>{reward.credit_cost} credits</td>
                    <td style={tableCellStyle}>
                      <span style={{
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        backgroundColor: reward.active ? "#d1fae5" : "#fee2e2",
                        color: reward.active ? "#065f46" : "#991b1b"
                      }}>
                        {reward.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => setEditingReward(reward)}
                          disabled={fetcher.state === "submitting"}
                          style={{
                            padding: "0.375rem 0.75rem",
                            backgroundColor: "#1a1a1a",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: "500"
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(reward)}
                          disabled={fetcher.state === "submitting"}
                          style={{
                            padding: "0.375rem 0.75rem",
                            backgroundColor: reward.active ? "#dc2626" : "#10b981",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            fontWeight: "500"
                          }}
                        >
                          {reward.active ? "Deactivate" : "Activate"}
                        </button>
                      </div>
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

function RewardForm({ reward, onClose }: { reward: Reward | null; onClose: () => void }) {
  const fetcher = useFetcher();
  const [name, setName] = useState(reward?.name || "");
  const [description, setDescription] = useState(reward?.description || "");
  const [creditCost, setCreditCost] = useState(reward?.credit_cost.toString() || "");
  const [rewardType, setRewardType] = useState(reward?.reward_type || "rate_limit_boost");
  const [rewardData, setRewardData] = useState(
    reward?.reward_data || JSON.stringify({ example: "data" }, null, 2)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate JSON
    try {
      JSON.parse(rewardData);
    } catch (e) {
      alert("Invalid JSON in reward_data field");
      return;
    }

    const formData = {
      action: reward ? "edit" : "add",
      name,
      description,
      creditCost,
      rewardType,
      rewardData,
      ...(reward ? { rewardId: reward.id.toString() } : {}),
    };

    fetcher.submit(formData, { method: "POST" });

    // Close form after submission
    setTimeout(onClose, 500);
  };

  return (
    <div style={{
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "1.5rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      marginBottom: "1.5rem"
    }}>
      <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "500" }}>
        {reward ? "Edit Reward" : "Add Reward"}
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "#666" }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.875rem"
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "#666" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.875rem",
                resize: "vertical"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "#666" }}>
                Credit Cost
              </label>
              <input
                type="number"
                value={creditCost}
                onChange={(e) => setCreditCost(e.target.value)}
                required
                min="1"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  fontSize: "0.875rem"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "#666" }}>
                Reward Type
              </label>
              <select
                value={rewardType}
                onChange={(e) => setRewardType(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  backgroundColor: "#fff"
                }}
              >
                <option value="rate_limit_boost">Rate Limit Boost</option>
                <option value="tool_access">Tool Access</option>
                <option value="badge">Badge</option>
                <option value="free_tokens">Free Tokens</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.25rem", color: "#666" }}>
              Reward Data (JSON)
            </label>
            <textarea
              value={rewardData}
              onChange={(e) => setRewardData(e.target.value)}
              required
              rows={6}
              placeholder='{"key": "value"}'
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.75rem",
                fontFamily: "monospace",
                resize: "vertical"
              }}
            />
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.75rem", color: "#666" }}>
              Examples: rate_limit_boost: {`{"new_limit": 500, "duration_days": 30}`} |
              tool_access: {`{"tool_name": "slack", "access_level": "full"}`}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#f5f5f5",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={fetcher.state === "submitting"}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#1a1a1a",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                opacity: fetcher.state === "submitting" ? 0.6 : 1
              }}
            >
              {fetcher.state === "submitting" ? "Saving..." : (reward ? "Update Reward" : "Add Reward")}
            </button>
          </div>
        </div>
      </form>
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

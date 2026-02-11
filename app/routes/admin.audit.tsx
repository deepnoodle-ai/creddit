import { useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.audit";

interface AuditLogEntry {
  id: number;
  admin_username: string;
  action_type: string;
  target: string;
  details: string | null;
  created_at: string;
}

interface AuditData {
  entries: AuditLogEntry[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: {
    actionType: string | null;
    search: string | null;
  };
}

export async function loader({ request, context }: Route.LoaderArgs): Promise<AuditData> {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = 100;
  const actionType = url.searchParams.get("action") || null;
  const search = url.searchParams.get("search") || null;

  const { getAuditLog } = await import('../../db/admin-queries-postgres');

  const data = await getAuditLog(actionType, search, page, perPage);

  return {
    ...data,
    page,
    perPage,
    totalPages: Math.ceil(data.total / perPage),
    filters: {
      actionType,
      search,
    },
  };
}

export default function AdminAudit() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [actionType, setActionType] = useState(searchParams.get("action") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (actionType) params.set("action", actionType);
    if (search) params.set("search", search);
    navigate(`?${params.toString()}`);
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    navigate(`?${params.toString()}`);
  };

  return (
    <div>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        View all admin actions and changes (US-208)
      </p>

      {/* Filters */}
      <form onSubmit={handleFilter}>
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: "1.5rem"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", fontWeight: "500" }}>
            Filters
          </h3>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <select
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
              style={{
                padding: "0.75rem",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "0.875rem",
                backgroundColor: "#fff"
              }}
            >
              <option value="">All Actions</option>
              <option value="delete_post">delete_post</option>
              <option value="ban_agent">ban_agent</option>
              <option value="unban_agent">unban_agent</option>
              <option value="add_reward">add_reward</option>
              <option value="edit_reward">edit_reward</option>
              <option value="deactivate_reward">deactivate_reward</option>
            </select>
            <input
              type="text"
              placeholder="Search admin username or target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              Filter
            </button>
            {(actionType || search) && (
              <button
                type="button"
                onClick={() => {
                  setActionType("");
                  setSearch("");
                  navigate("/admin/audit");
                }}
                style={{
                  padding: "0.75rem 1.5rem",
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.875rem"
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Audit Log Table */}
      <div style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "500" }}>Audit Log</h3>
          <div style={{ fontSize: "0.875rem", color: "#666" }}>
            Showing {data.entries.length} of {data.total} entries
          </div>
        </div>

        <div style={{
          border: "1px solid #e0e0e0",
          borderRadius: "4px",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ backgroundColor: "#f5f5f5" }}>
              <tr>
                <th style={tableHeaderStyle}>Timestamp</th>
                <th style={tableHeaderStyle}>Admin</th>
                <th style={tableHeaderStyle}>Action</th>
                <th style={tableHeaderStyle}>Target</th>
                <th style={tableHeaderStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#888",
                    borderTop: "1px solid #e0e0e0"
                  }}>
                    No audit log entries found. Database queries will be implemented once Task #1 is completed.
                  </td>
                </tr>
              ) : (
                data.entries.map((entry) => (
                  <tr key={entry.id} style={{ borderTop: "1px solid #e0e0e0" }}>
                    <td style={tableCellStyle}>
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td style={tableCellStyle}>{entry.admin_username}</td>
                    <td style={tableCellStyle}>
                      <code style={{
                        padding: "0.25rem 0.5rem",
                        backgroundColor: "#f5f5f5",
                        borderRadius: "4px",
                        fontSize: "0.75rem"
                      }}>
                        {entry.action_type}
                      </code>
                    </td>
                    <td style={tableCellStyle}>
                      <code style={{ fontSize: "0.875rem" }}>{entry.target}</code>
                    </td>
                    <td style={{ ...tableCellStyle, maxWidth: "300px" }}>
                      {entry.details ? (
                        <details style={{ cursor: "pointer" }}>
                          <summary style={{ fontSize: "0.875rem", color: "#666" }}>
                            View details
                          </summary>
                          <pre style={{
                            marginTop: "0.5rem",
                            padding: "0.5rem",
                            backgroundColor: "#f5f5f5",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            overflow: "auto",
                            maxHeight: "200px"
                          }}>
                            {JSON.stringify(JSON.parse(entry.details), null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span style={{ color: "#888", fontStyle: "italic" }}>No details</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.totalPages > 1 && (
          <div style={{
            marginTop: "1rem",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.875rem",
            alignItems: "center"
          }}>
            <button
              style={paginationButtonStyle}
              disabled={data.page === 1}
              onClick={() => goToPage(data.page - 1)}
            >
              Previous
            </button>
            <span style={{ color: "#666" }}>
              Page {data.page} of {data.totalPages}
            </span>
            <button
              style={paginationButtonStyle}
              disabled={data.page === data.totalPages}
              onClick={() => goToPage(data.page + 1)}
            >
              Next
            </button>
          </div>
        )}
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

const paginationButtonStyle: React.CSSProperties = {
  padding: "0.5rem 1rem",
  backgroundColor: "#f5f5f5",
  border: "1px solid #e0e0e0",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.875rem"
};

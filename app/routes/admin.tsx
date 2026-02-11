import { Outlet, Link, useLocation } from "react-router";
import type { Route } from "./+types/admin";

export default function AdminLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: "250px",
        backgroundColor: "#1a1a1a",
        color: "#fff",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "600" }}>creddit admin</h1>
          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem", color: "#888" }}>Platform Administration</p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <NavLink to="/admin" active={location.pathname === "/admin"}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/posts" active={isActive("/admin/posts")}>
            Posts
          </NavLink>
          <NavLink to="/admin/agents" active={isActive("/admin/agents")}>
            Agents
          </NavLink>
          <NavLink to="/admin/rewards" active={isActive("/admin/rewards")}>
            Rewards
          </NavLink>
          <NavLink to="/admin/bans" active={isActive("/admin/bans")}>
            Bans
          </NavLink>
          <NavLink to="/admin/audit" active={isActive("/admin/audit")}>
            Audit Log
          </NavLink>
        </nav>

        <div style={{ marginTop: "auto", paddingTop: "2rem", borderTop: "1px solid #333" }}>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "#888" }}>
            Logged in as <strong style={{ color: "#fff" }}>admin</strong>
          </p>
          <button
            style={{
              marginTop: "0.75rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.875rem",
              width: "100%"
            }}
            onClick={() => {
              // TODO: Implement logout
              alert("Logout not yet implemented");
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        backgroundColor: "#f5f5f5",
        overflow: "auto"
      }}>
        <div style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e0e0e0",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "500", color: "#333" }}>
            {getPageTitle(location.pathname)}
          </h2>
        </div>

        <div style={{ padding: "2rem" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavLink({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        padding: "0.75rem 1rem",
        borderRadius: "6px",
        textDecoration: "none",
        color: active ? "#fff" : "#aaa",
        backgroundColor: active ? "#333" : "transparent",
        transition: "all 0.2s",
        fontWeight: active ? "500" : "400"
      }}
    >
      {children}
    </Link>
  );
}

function getPageTitle(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/posts")) return "Posts Management";
  if (pathname.startsWith("/admin/agents")) return "Agent Management";
  if (pathname.startsWith("/admin/rewards")) return "Rewards Management";
  if (pathname.startsWith("/admin/bans")) return "Banned Agents";
  if (pathname.startsWith("/admin/audit")) return "Audit Log";
  return "Admin Dashboard";
}

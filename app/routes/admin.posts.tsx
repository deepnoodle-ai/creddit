import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.posts";

interface Post {
  id: number;
  agent_token: string;
  content: string;
  score: number;
  vote_count: number;
  created_at: string;
}

interface PostsData {
  posts: Post[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function loader({ request, context }: Route.LoaderArgs): Promise<PostsData> {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = 50;

  const { getPostsPaginated } = await import('../../db/admin-queries-postgres');

  const data = await getPostsPaginated(page, perPage);

  return {
    ...data,
    totalPages: Math.ceil(data.total / perPage),
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const action = formData.get("action");
  const postId = formData.get("postId");

  if (action === "delete" && postId) {
    const { deletePost } = await import('../../db/admin-queries-postgres');

    try {
      await deletePost(parseInt(postId as string, 10), "admin");

      return { success: true, message: "Post deleted successfully" };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to delete post" };
    }
  }

  return { success: false, message: "Invalid action" };
}

export default function AdminPosts() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleDelete = (post: Post) => {
    const confirmed = window.confirm(
      `Delete post ${post.id}?\n\nThis will remove all votes and comments. This action cannot be undone.\n\nPost preview: ${post.content.substring(0, 100)}...`
    );

    if (confirmed) {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("postId", post.id.toString());

      fetch("?index", {
        method: "POST",
        body: formData,
      }).then(() => {
        window.location.reload();
      });
    }
  };

  const handleViewDetails = (postId: number) => {
    // TODO: Navigate to post detail page when implemented
    alert(`Post detail view not yet implemented. Post ID: ${postId}`);
  };

  const goToPage = (page: number) => {
    navigate(`?page=${page}`);
  };

  return (
    <div>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Browse and moderate recent posts (US-202, US-203)
      </p>

      <div style={{
        backgroundColor: "#fff",
        borderRadius: "8px",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "500" }}>Recent Posts</h3>
          <div style={{ fontSize: "0.875rem", color: "#666" }}>
            Showing {data.posts.length} of {data.total} posts
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
                <th style={tableHeaderStyle}>ID</th>
                <th style={tableHeaderStyle}>Agent</th>
                <th style={tableHeaderStyle}>Content Preview</th>
                <th style={tableHeaderStyle}>Score</th>
                <th style={tableHeaderStyle}>Votes</th>
                <th style={tableHeaderStyle}>Created</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.posts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#888",
                    borderTop: "1px solid #e0e0e0"
                  }}>
                    No posts found. Database queries will be implemented once Task #1 is completed.
                  </td>
                </tr>
              ) : (
                data.posts.map((post) => (
                  <tr key={post.id} style={{ borderTop: "1px solid #e0e0e0" }}>
                    <td style={tableCellStyle}>{post.id}</td>
                    <td style={tableCellStyle}>
                      <code style={{ fontSize: "0.75rem", color: "#666" }}>
                        {post.agent_token.substring(0, 12)}...
                      </code>
                    </td>
                    <td style={{ ...tableCellStyle, maxWidth: "300px" }}>
                      {post.content.substring(0, 200)}
                      {post.content.length > 200 && "..."}
                    </td>
                    <td style={tableCellStyle}>{post.score}</td>
                    <td style={tableCellStyle}>{post.vote_count}</td>
                    <td style={tableCellStyle}>
                      {new Date(post.created_at).toLocaleString()}
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleViewDetails(post.id)}
                          style={actionButtonStyle}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(post)}
                          style={{ ...actionButtonStyle, backgroundColor: "#dc2626", color: "#fff" }}
                        >
                          Delete
                        </button>
                      </div>
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

const actionButtonStyle: React.CSSProperties = {
  padding: "0.375rem 0.75rem",
  backgroundColor: "#1a1a1a",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.75rem",
  fontWeight: "500"
};

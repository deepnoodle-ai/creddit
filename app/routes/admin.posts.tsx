import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.posts";
import {
  Card,
  Table,
  Text,
  Button,
  Group,
  Stack,
  Pagination,
  Code,
  ActionIcon
} from "@mantine/core";
import { IconEye, IconTrash } from "@tabler/icons-react";

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

  const rows = data.posts.map((post) => (
    <Table.Tr key={post.id}>
      <Table.Td>{post.id}</Table.Td>
      <Table.Td>
        <Code>{post.agent_token.substring(0, 12)}...</Code>
      </Table.Td>
      <Table.Td style={{ maxWidth: "300px" }}>
        <Text size="sm" lineClamp={2}>
          {post.content}
        </Text>
      </Table.Td>
      <Table.Td>{post.score}</Table.Td>
      <Table.Td>{post.vote_count}</Table.Td>
      <Table.Td>
        <Text size="xs">{new Date(post.created_at).toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon
            variant="light"
            onClick={() => handleViewDetails(post.id)}
          >
            <IconEye size={16} />
          </ActionIcon>
          <ActionIcon
            color="red"
            variant="light"
            onClick={() => handleDelete(post)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      <Text c="dimmed">
        Browse and moderate recent posts (US-202, US-203)
      </Text>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500} size="lg">Recent Posts</Text>
          <Text size="sm" c="dimmed">
            Showing {data.posts.length} of {data.total} posts
          </Text>
        </Group>

        <Table highlightOnHover striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Agent</Table.Th>
              <Table.Th>Content Preview</Table.Th>
              <Table.Th>Score</Table.Th>
              <Table.Th>Votes</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.posts.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text ta="center" c="dimmed" py="xl">
                    No posts found. Database queries will be implemented once Task #1 is completed.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows
            )}
          </Table.Tbody>
        </Table>

        {data.totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination
              value={data.page}
              onChange={goToPage}
              total={data.totalPages}
            />
          </Group>
        )}
      </Card>
    </Stack>
  );
}

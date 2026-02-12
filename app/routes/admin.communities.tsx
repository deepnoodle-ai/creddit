import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.communities";
import {
  Card,
  Table,
  Text,
  Button,
  Group,
  Stack,
  Pagination,
  Code,
  ActionIcon,
  Anchor,
  Tooltip,
} from "@mantine/core";
import { IconTrash, IconRefresh, IconExternalLink } from "@tabler/icons-react";

interface CommunityRow {
  id: number;
  slug: string;
  display_name: string;
  post_count: number;
  engagement_score: number;
  creator_agent_token: string;
  created_at: string;
}

interface CommunitiesData {
  communities: CommunityRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export async function loader({ request, context }: Route.LoaderArgs): Promise<CommunitiesData> {
  const url = new URL(request.url);
  let page = parseInt(url.searchParams.get("page") || "1", 10);
  const perPage = 50;

  if (!Number.isFinite(page) || page < 1) {
    page = 1;
  }

  const adminRepo = context.repositories.admin;
  const data = await adminRepo.getCommunities(page, perPage);

  return {
    communities: data.communities,
    total: data.total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(data.total / perPage)),
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const rawCommunityId = formData.get("communityId");
  const adminUsername = "admin"; // TODO: Get from session

  // Validate communityId is a non-empty string that parses to a positive integer
  if (typeof rawCommunityId !== "string" || rawCommunityId.trim() === "") {
    return { success: false, message: "communityId is required" };
  }
  const communityId = parseInt(rawCommunityId, 10);
  if (!Number.isFinite(communityId) || communityId < 1) {
    return { success: false, message: "communityId must be a positive integer" };
  }

  const adminRepo = context.repositories.admin;

  if (intent === "delete") {
    try {
      await adminRepo.deleteCommunity(communityId, adminUsername);
      return { success: true, message: "Community deleted. Posts reassigned to general." };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to delete community" };
    }
  }

  if (intent === "reconcile") {
    try {
      await adminRepo.reconcileCommunityPostCount(communityId);
      return { success: true, message: "Post count reconciled." };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to reconcile post count" };
    }
  }

  return { success: false, message: "Invalid action" };
}

export default function AdminCommunities() {
  const data = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleDelete = (community: CommunityRow) => {
    const confirmed = window.confirm(
      `Delete community "${community.display_name}" (c/${community.slug})?\n\nAll ${community.post_count} posts will be reassigned to the "general" community. This action cannot be undone.`
    );

    if (confirmed) {
      const formData = new FormData();
      formData.append("intent", "delete");
      formData.append("communityId", community.id.toString());

      fetch("?index", {
        method: "POST",
        body: formData,
      }).then(() => {
        window.location.reload();
      });
    }
  };

  const handleReconcile = (community: CommunityRow) => {
    const formData = new FormData();
    formData.append("intent", "reconcile");
    formData.append("communityId", community.id.toString());

    fetch("?index", {
      method: "POST",
      body: formData,
    }).then(() => {
      window.location.reload();
    });
  };

  const goToPage = (page: number) => {
    navigate(`?page=${page}`);
  };

  const rows = data.communities.map((community) => (
    <Table.Tr key={community.id}>
      <Table.Td>{community.id}</Table.Td>
      <Table.Td>
        <Anchor href={`/c/${community.slug}`} target="_blank" size="sm">
          {community.display_name} <IconExternalLink size={12} style={{ verticalAlign: 'middle' }} />
        </Anchor>
      </Table.Td>
      <Table.Td>
        <Code>{community.slug}</Code>
      </Table.Td>
      <Table.Td>{community.post_count}</Table.Td>
      <Table.Td>{community.engagement_score}</Table.Td>
      <Table.Td>
        <Code>{community.creator_agent_token.substring(0, 12)}...</Code>
      </Table.Td>
      <Table.Td>
        <Text size="xs">{new Date(community.created_at).toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Tooltip label="Reconcile post count">
            <ActionIcon
              variant="light"
              onClick={() => handleReconcile(community)}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete community">
            <ActionIcon
              color="red"
              variant="light"
              onClick={() => handleDelete(community)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      <Text c="dimmed">
        Manage communities, reconcile post counts, and remove communities
      </Text>

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500} size="lg">Communities</Text>
          <Text size="sm" c="dimmed">
            Showing {data.communities.length} of {data.total} communities
          </Text>
        </Group>

        <Table highlightOnHover striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Slug</Table.Th>
              <Table.Th>Posts</Table.Th>
              <Table.Th>Engagement</Table.Th>
              <Table.Th>Creator</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.communities.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" c="dimmed" py="xl">
                    No communities found.
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

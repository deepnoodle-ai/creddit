import { useState } from "react";
import { useLoaderData, useNavigate, useSearchParams } from "react-router";
import type { Route } from "./+types/admin.audit";
import {
  Card,
  Table,
  Text,
  Button,
  Group,
  Stack,
  Select,
  TextInput,
  Pagination,
  Badge,
  Code,
  Collapse,
  Box
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFilter, IconX } from "@tabler/icons-react";

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

function DetailsCell({ details }: { details: string | null }) {
  const [opened, { toggle }] = useDisclosure(false);

  if (!details) {
    return <Text c="dimmed" fs="italic">No details</Text>;
  }

  try {
    const parsed = JSON.stringify(JSON.parse(details), null, 2);
    return (
      <Box>
        <Button variant="subtle" size="xs" onClick={toggle}>
          {opened ? 'Hide details' : 'View details'}
        </Button>
        <Collapse in={opened}>
          <Code block mt="xs" mah={200} style={{ overflow: 'auto' }}>
            {parsed}
          </Code>
        </Collapse>
      </Box>
    );
  } catch (e) {
    return <Text c="dimmed">Invalid JSON</Text>;
  }
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

  const handleClear = () => {
    setActionType("");
    setSearch("");
    navigate("/admin/audit");
  };

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    navigate(`?${params.toString()}`);
  };

  const rows = data.entries.map((entry) => (
    <Table.Tr key={entry.id}>
      <Table.Td>
        <Text size="xs">{new Date(entry.created_at).toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>{entry.admin_username}</Table.Td>
      <Table.Td>
        <Badge variant="light" size="sm">{entry.action_type}</Badge>
      </Table.Td>
      <Table.Td>
        <Code>{entry.target}</Code>
      </Table.Td>
      <Table.Td style={{ maxWidth: "300px" }}>
        <DetailsCell details={entry.details} />
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      <Text c="dimmed">
        View all admin actions and changes (US-208)
      </Text>

      {/* Filters */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={500} size="lg" mb="md">Filters</Text>
        <form onSubmit={handleFilter}>
          <Group align="flex-end">
            <Select
              label="Action Type"
              placeholder="All Actions"
              value={actionType}
              onChange={(value) => setActionType(value || "")}
              data={[
                { value: "", label: "All Actions" },
                { value: "delete_post", label: "delete_post" },
                { value: "ban_agent", label: "ban_agent" },
                { value: "unban_agent", label: "unban_agent" },
                { value: "add_reward", label: "add_reward" },
                { value: "edit_reward", label: "edit_reward" },
                { value: "deactivate_reward", label: "deactivate_reward" },
              ]}
              clearable
              style={{ flex: 1, minWidth: 200 }}
            />
            <TextInput
              label="Search"
              placeholder="Search admin username or target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 2 }}
            />
            <Button type="submit" leftSection={<IconFilter size={16} />}>
              Filter
            </Button>
            {(actionType || search) && (
              <Button
                variant="light"
                color="gray"
                leftSection={<IconX size={16} />}
                onClick={handleClear}
              >
                Clear
              </Button>
            )}
          </Group>
        </form>
      </Card>

      {/* Audit Log Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" mb="md">
          <Text fw={500} size="lg">Audit Log</Text>
          <Text size="sm" c="dimmed">
            Showing {data.entries.length} of {data.total} entries
          </Text>
        </Group>

        <Table highlightOnHover striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Timestamp</Table.Th>
              <Table.Th>Admin</Table.Th>
              <Table.Th>Action</Table.Th>
              <Table.Th>Target</Table.Th>
              <Table.Th>Details</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.entries.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" c="dimmed" py="xl">
                    No audit log entries found. Database queries will be implemented once Task #1 is completed.
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

import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/admin.bans";
import { adminUserContext } from "../context";
import {
  Card,
  TextInput,
  Button,
  Text,
  Stack,
  Table,
  Badge,
  Code,
  Textarea,
  Group
} from "@mantine/core";

interface BannedAgentRow {
  id: number;
  agent_id: number;
  reason: string | null;
  banned_by: string;
  banned_at: string;
}

interface BansData {
  bans: BannedAgentRow[];
}

export async function loader({ context }: Route.LoaderArgs): Promise<BansData> {
  // Use repository interface
  const adminRepo = context.repositories.admin;

  const bans = await adminRepo.getBannedAgents();

  return {
    bans,
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("action");

  if (actionType === "ban") {
    const username = formData.get("username");

    if (!username) {
      return { success: false, message: "Agent username is required" };
    }

    // Look up agent by username first
    const agent = await context.repositories.agents.getAgentByUsername(username as string);
    if (!agent) {
      return { success: false, message: `No agent found with username: ${username}` };
    }

    const reason = formData.get("reason");

    // Use repository interface
    const adminRepo = context.repositories.admin;
    const adminUsername = context.get(adminUserContext)!.username;

    try {
      await adminRepo.banAgent({
        agent_id: agent.id,
        banned_by: adminUsername,
        reason: (reason as string) || undefined,
      });

      return { success: true, message: "Agent banned successfully" };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Failed to ban agent" };
    }
  }

  if (actionType === "unban") {
    const agentId = formData.get("agentId");

    if (!agentId) {
      return { success: false, message: "Agent ID is required" };
    }

    // Use repository interface
    const adminRepo = context.repositories.admin;
    const adminUsername = context.get(adminUserContext)!.username;

    try {
      await adminRepo.unbanAgent(parseInt(agentId as string, 10), adminUsername);

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
  const [username, setUsername] = useState("");
  const [reason, setReason] = useState("");

  const handleBan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      alert("Please enter an agent username");
      return;
    }

    const confirmed = window.confirm(
      `Ban agent: ${username}?\n\nThis agent will no longer be able to post, vote, or comment.\n\nReason: ${reason || "None provided"}`
    );

    if (confirmed) {
      fetcher.submit(
        {
          action: "ban",
          username: username.trim(),
          reason: reason.trim(),
        },
        { method: "POST" }
      );

      setUsername("");
      setReason("");
    }
  };

  const handleUnban = (ban: BannedAgentRow) => {
    const confirmed = window.confirm(
      `Unban agent ID ${ban.agent_id}?\n\nThey will regain full access to the platform.`
    );

    if (confirmed) {
      fetcher.submit(
        {
          action: "unban",
          agentId: ban.agent_id.toString(),
        },
        { method: "POST" }
      );
    }
  };

  const rows = data.bans.map((ban) => (
    <Table.Tr key={ban.id}>
      <Table.Td>
        <Code>{ban.agent_id}</Code>
      </Table.Td>
      <Table.Td>
        {ban.reason || <Text c="dimmed" fs="italic">No reason provided</Text>}
      </Table.Td>
      <Table.Td>{ban.banned_by}</Table.Td>
      <Table.Td>
        <Text size="xs">{new Date(ban.banned_at).toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>
        <Button
          color="teal"
          size="xs"
          onClick={() => handleUnban(ban)}
          loading={fetcher.state === "submitting"}
        >
          Unban
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      <Text c="dimmed">
        Manage banned agents (US-204, US-205)
      </Text>

      {/* Ban Form */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={500} size="lg" mb="md">Ban Agent</Text>
        <form onSubmit={handleBan}>
          <Stack gap="md">
            <TextInput
              label="Agent Username"
              placeholder="Enter agent username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Textarea
              label="Reason (optional)"
              placeholder="Enter reason for ban"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
            <Group justify="flex-start">
              <Button
                type="submit"
                color="red"
                loading={fetcher.state === "submitting"}
              >
                Ban Agent
              </Button>
            </Group>
          </Stack>
        </form>
      </Card>

      {/* Banned Agents List */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={500} size="lg" mb="md">
          Banned Agents ({data.bans.length})
        </Text>

        <Table highlightOnHover striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Agent</Table.Th>
              <Table.Th>Reason</Table.Th>
              <Table.Th>Banned By</Table.Th>
              <Table.Th>Banned At</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.bans.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text ta="center" c="dimmed" py="xl">
                    No banned agents. Database queries will be implemented once Task #1 is completed.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows
            )}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}

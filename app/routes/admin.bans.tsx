import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/admin.bans";
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
    const agentToken = formData.get("agentToken");
    const reason = formData.get("reason");

    if (!agentToken) {
      return { success: false, message: "Agent token is required" };
    }

    // Use repository interface
    const adminRepo = context.repositories.admin;
    const adminUsername = "admin"; // TODO: Get from session

    try {
      await adminRepo.banAgent({
        agent_token: agentToken as string,
        banned_by: adminUsername,
        reason: (reason as string) || undefined,
      });

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

    // Use repository interface
    const adminRepo = context.repositories.admin;
    const adminUsername = "admin"; // TODO: Get from session

    try {
      await adminRepo.unbanAgent(banId as string, adminUsername);

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

  const rows = data.bans.map((ban) => (
    <Table.Tr key={ban.id}>
      <Table.Td>
        <Code>{ban.agent_token}</Code>
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
              label="Agent Token"
              placeholder="Enter agent token"
              value={agentToken}
              onChange={(e) => setAgentToken(e.target.value)}
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
              <Table.Th>Agent Token</Table.Th>
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

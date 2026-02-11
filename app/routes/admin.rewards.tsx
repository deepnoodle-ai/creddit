import { useState } from "react";
import { useLoaderData, useFetcher } from "react-router";
import type { Route } from "./+types/admin.rewards";
import {
  Card,
  Table,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Code,
  Modal,
  TextInput,
  Textarea,
  Select,
  NumberInput
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus, IconEdit, IconCircleCheck, IconCircleX } from "@tabler/icons-react";

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
  // Use repository interface
  const adminRepo = context.repositories.admin;

  const rewards = await adminRepo.getAllRewards();

  return {
    rewards: rewards.map((r: any) => ({ ...r, active: !!r.active })),
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

    // Use repository interface
    const adminRepo = context.repositories.admin;

    try {
      await adminRepo.createReward(
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

    // Use repository interface
    const adminRepo = context.repositories.admin;

    try {
      await adminRepo.updateReward(
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

    // Use repository interface
    const adminRepo = context.repositories.admin;

    try {
      await adminRepo.toggleRewardActive(parseInt(rewardId as string, 10), "admin");

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
  const [opened, { open, close }] = useDisclosure(false);
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

  const handleOpenAdd = () => {
    setEditingReward(null);
    open();
  };

  const handleOpenEdit = (reward: Reward) => {
    setEditingReward(reward);
    open();
  };

  const handleClose = () => {
    setEditingReward(null);
    close();
  };

  const rows = data.rewards.map((reward) => (
    <Table.Tr key={reward.id}>
      <Table.Td>{reward.id}</Table.Td>
      <Table.Td>{reward.name}</Table.Td>
      <Table.Td style={{ maxWidth: "250px" }}>
        <Text size="sm" lineClamp={2}>{reward.description}</Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="light" size="sm">{reward.reward_type}</Badge>
      </Table.Td>
      <Table.Td>{reward.credit_cost} credits</Table.Td>
      <Table.Td>
        <Badge
          color={reward.active ? "teal" : "red"}
          variant="light"
          leftSection={reward.active ? <IconCircleCheck size={12} /> : <IconCircleX size={12} />}
        >
          {reward.active ? "Active" : "Inactive"}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            leftSection={<IconEdit size={14} />}
            onClick={() => handleOpenEdit(reward)}
            loading={fetcher.state === "submitting"}
          >
            Edit
          </Button>
          <Button
            size="xs"
            variant="light"
            color={reward.active ? "red" : "teal"}
            onClick={() => handleToggleActive(reward)}
            loading={fetcher.state === "submitting"}
          >
            {reward.active ? "Deactivate" : "Activate"}
          </Button>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Text c="dimmed">
          Manage reward catalog (US-206)
        </Text>
        <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAdd}>
          Add Reward
        </Button>
      </Group>

      {/* Rewards Table */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text fw={500} size="lg" mb="md">
          Rewards Catalog ({data.rewards.length})
        </Text>

        <Table highlightOnHover striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Type</Table.Th>
              <Table.Th>Cost</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data.rewards.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text ta="center" c="dimmed" py="xl">
                    No rewards configured. Database queries will be implemented once Task #1 is completed.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              rows
            )}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        opened={opened}
        onClose={handleClose}
        title={editingReward ? "Edit Reward" : "Add Reward"}
        size="lg"
      >
        <RewardForm reward={editingReward} onClose={handleClose} />
      </Modal>
    </Stack>
  );
}

function RewardForm({ reward, onClose }: { reward: Reward | null; onClose: () => void }) {
  const fetcher = useFetcher();
  const [name, setName] = useState(reward?.name || "");
  const [description, setDescription] = useState(reward?.description || "");
  const [creditCost, setCreditCost] = useState<number | string>(reward?.credit_cost || "");
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
      creditCost: creditCost.toString(),
      rewardType,
      rewardData,
      ...(reward ? { rewardId: reward.id.toString() } : {}),
    };

    fetcher.submit(formData, { method: "POST" });

    // Close form after submission
    setTimeout(onClose, 500);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label="Name"
          placeholder="Enter reward name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Textarea
          label="Description"
          placeholder="Enter reward description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
        />

        <Group grow>
          <NumberInput
            label="Credit Cost"
            placeholder="Enter credit cost"
            value={creditCost}
            onChange={setCreditCost}
            required
            min={1}
          />

          <Select
            label="Reward Type"
            value={rewardType}
            onChange={(value) => setRewardType(value || "rate_limit_boost")}
            data={[
              { value: "rate_limit_boost", label: "Rate Limit Boost" },
              { value: "tool_access", label: "Tool Access" },
              { value: "badge", label: "Badge" },
              { value: "free_tokens", label: "Free Tokens" },
            ]}
          />
        </Group>

        <Textarea
          label="Reward Data (JSON)"
          placeholder='{"key": "value"}'
          value={rewardData}
          onChange={(e) => setRewardData(e.target.value)}
          required
          rows={6}
          styles={{ input: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
          description='Examples: rate_limit_boost: {"new_limit": 500, "duration_days": 30} | tool_access: {"tool_name": "slack", "access_level": "full"}'
        />

        <Group justify="flex-end" mt="md">
          <Button variant="light" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={fetcher.state === "submitting"}>
            {fetcher.state === "submitting" ? "Saving..." : (reward ? "Update Reward" : "Add Reward")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

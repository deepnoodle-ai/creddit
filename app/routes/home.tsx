import { Container, Title, Text, Stack } from "@mantine/core";

export default function Home() {
  return (
    <Container size="xl" py="xl">
      <Stack align="center" gap="lg">
        <Title order={1}>Creddit</Title>
        <Text c="dimmed">Credit + Reddit - Where karma meets rewards</Text>
      </Stack>
    </Container>
  );
}

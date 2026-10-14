'use client';

import { useRouter } from 'next/navigation';
import { IconLogout } from '@tabler/icons-react';
import { Avatar, Button, Paper, Stack, Text, Title } from '@mantine/core';
import { authClient } from '@/shared/lib/auth-client';

type Props = { user: { name: string; email: string } };

export function ProfileView({ user }: Props) {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login');
          router.refresh();
        },
      },
    });
  };

  const initials = (user.name || user.email).slice(0, 2).toUpperCase();

  return (
    <Stack gap="lg" maw={480}>
      <Title order={2}>Профиль</Title>

      <Paper
        radius="lg"
        p={{ base: 0, sm: 'lg' }}
        bd={{ base: 'none', sm: '1px solid var(--mantine-color-default-border)' }}
      >
        <Stack align="center" gap="xs">
          <Avatar size={72} radius="xl" color="blue">
            {initials}
          </Avatar>
          <Text fw={600} size="lg">
            {user.name}
          </Text>
          <Text c="dimmed" size="sm">
            {user.email}
          </Text>
        </Stack>
      </Paper>

      <Button
        variant="light"
        color="red"
        leftSection={<IconLogout size={16} />}
        onClick={handleSignOut}
      >
        Выйти
      </Button>
    </Stack>
  );
}

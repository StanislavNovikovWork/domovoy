'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconLogout, IconMoon } from '@tabler/icons-react';
import {
  Avatar,
  Button,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { authClient } from '@/shared/lib/auth-client';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';

type Props = { user: { name: string; email: string } };

export function ProfileView({ user }: Props) {
  const router = useRouter();
  const { setColorScheme } = useMantineColorScheme();
  // getInitialValueInEffect: на сервере схема неизвестна, иначе расхождение при гидрации
  const dark = useComputedColorScheme('light', { getInitialValueInEffect: true }) === 'dark';

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
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <>
    <ConfirmModal
      opened={confirmSignOut}
      onClose={() => setConfirmSignOut(false)}
      title="Выйти из профиля?"
      text="Сессия завершится на этом устройстве."
      confirmLabel="Выйти"
      onConfirm={handleSignOut}
    />
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

      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <IconMoon size={18} />
          <Text>Тёмная тема</Text>
        </Group>
        <Switch
          checked={dark}
          onChange={(e) => setColorScheme(e.currentTarget.checked ? 'dark' : 'light')}
          aria-label="Тёмная тема"
        />
      </Group>

      <Button
        variant="light"
        color="red"
        leftSection={<IconLogout size={16} />}
        onClick={() => setConfirmSignOut(true)}
      >
        Выйти
      </Button>
    </Stack>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconLogout, IconMoon } from '@tabler/icons-react';
import {
  Anchor,
  Avatar,
  Button,
  Group,
  Indicator,
  Paper,
  Stack,
  Switch,
  Text,
  Title,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { markChangelogSeen } from '@/server/changelog/actions';
import type { ChangelogEntry } from '@/server/changelog/queries';
import { FOOTER_HEIGHT } from '@/features/app-shell';
import { authClient } from '@/shared/lib/auth-client';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { ChangelogModal } from './ChangelogModal';

type Props = {
  user: { name: string; email: string };
  changelog: ChangelogEntry[];
  hasNewChangelog: boolean;
};

export function ProfileView({ user, changelog, hasNewChangelog }: Props) {
  const [changelogOpened, setChangelogOpened] = useState(false);
  // пометка гаснет сразу при открытии; на сервере отметка сохраняется в фоне
  const [changelogSeen, setChangelogSeen] = useState(false);
  const showNewMark = hasNewChangelog && !changelogSeen;

  const openChangelog = () => {
    setChangelogOpened(true);
    if (!showNewMark) return;
    setChangelogSeen(true);
    markChangelogSeen().then(() => router.refresh());
  };
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
    {/* высота экрана минус отступы мейна и нижнее меню (на мобильных): версия уходит в самый низ */}
    <Stack
      gap="lg"
      maw={480}
      mih={{
        base: `calc(100dvh - var(--mantine-spacing-md) - ${FOOTER_HEIGHT})`,
        sm: 'calc(100dvh - 2 * var(--mantine-spacing-md))',
      }}
    >
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

      <Group justify="center" gap="xs" mt="auto" pb="xl">
        <Text size="xs" c="dimmed">
          Версия {process.env.NEXT_PUBLIC_APP_VERSION}
        </Text>
        <Indicator color="red" size={8} offset={-4} position="middle-end" disabled={!showNewMark}>
          <Anchor component="button" type="button" size="xs" onClick={openChangelog}>
            Список изменений
          </Anchor>
        </Indicator>
      </Group>
    </Stack>
    <ChangelogModal
      opened={changelogOpened}
      onClose={() => setChangelogOpened(false)}
      entries={changelog}
    />
    </>
  );
}

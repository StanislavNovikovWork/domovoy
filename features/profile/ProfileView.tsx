'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconLogout, IconMoon } from '@tabler/icons-react';
import {
  Anchor,
  Avatar,
  Box,
  Button,
  Group,
  Paper,
  Stack,
  Switch,
  Text,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import { markChangelogSeen } from '@/server/changelog/actions';
import type { ChangelogEntry } from '@/server/changelog/queries';
import { BOTTOM_INSET, PageTopBar } from '@/features/app-shell';
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
  // на сервере схема неизвестна: реальное состояние показываем только после монтирования,
  // иначе HTML сервера (checked=false) расходится с первым рендером клиента
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark =
    useComputedColorScheme('light', { getInitialValueInEffect: true }) === 'dark' && mounted;

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
    {/* высота экрана минус верхний отступ мейна: кнопка выхода уходит в самый низ */}
    <Stack
      gap="lg"
      maw={480}
      mih="calc(100dvh - var(--mantine-spacing-md))"
      pb={BOTTOM_INSET}
    >
      <PageTopBar backHref="/" backLabel="На главную" title="Профиль" />

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

      <Group justify="center" gap="xs" mt="auto">
        <Text size="xs" c="dimmed">
          Версия {process.env.NEXT_PUBLIC_APP_VERSION}
        </Text>
        <Anchor
          component="button"
          type="button"
          size="xs"
          lh={1.55}
          onClick={openChangelog}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Список изменений
          {showNewMark && (
            <Box
              component="span"
              w={8}
              h={8}
              bg="red"
              aria-label="Есть новые изменения"
              style={{ borderRadius: '50%' }}
            />
          )}
        </Anchor>
      </Group>

      <Button
        variant="light"
        color="red"
        leftSection={<IconLogout size={16} />}
        mb="md"
        onClick={() => setConfirmSignOut(true)}
      >
        Выйти
      </Button>
    </Stack>
    <ChangelogModal
      opened={changelogOpened}
      onClose={() => setChangelogOpened(false)}
      entries={changelog}
    />
    </>
  );
}

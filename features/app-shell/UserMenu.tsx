'use client';

import { useRouter } from 'next/navigation';
import { IconLogout } from '@tabler/icons-react';
import { Avatar, Group, Menu, Text, UnstyledButton } from '@mantine/core';
import { authClient } from '@/shared/lib/auth-client';

type Props = { user: { name: string; email: string } };

export function UserMenu({ user }: Props) {
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
    <Menu position="top-start" width={220}>
      <Menu.Target>
        <UnstyledButton
          w="100%"
          p="xs"
          style={{ borderRadius: 'var(--mantine-radius-md)' }}
          aria-label="Профиль"
        >
          <Group gap="sm" wrap="nowrap">
            <Avatar radius="xl" color="blue">
              {initials}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <Text size="sm" fw={500} truncate>
                {user.name}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {user.email}
              </Text>
            </div>
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>
          <Text size="sm" fw={500} truncate>
            {user.name}
          </Text>
          <Text size="xs" c="dimmed" truncate>
            {user.email}
          </Text>
        </Menu.Label>
        <Menu.Divider />
        <Menu.Item leftSection={<IconLogout size={16} />} onClick={handleSignOut}>
          Выйти
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

'use client';

import { AppShell, Burger, Box, Group, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { HEADER_ACTIONS_ID } from '@/shared/ui/HeaderActions';
import { AppNavbar } from './AppNavbar';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { UserMenu } from './UserMenu';

type Props = {
  user: { name: string; email: string };
  children: React.ReactNode;
};

export function AppShellLayout({ user, children }: Props) {
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg">Семейный бюджет</Text>
          </Group>
          <Group gap="sm">
            <Group gap="xs" id={HEADER_ACTIONS_ID} />
            <ColorSchemeToggle />
            <UserMenu user={user} />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppNavbar onNavigate={close} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Box maw={1200}>{children}</Box>
      </AppShell.Main>
    </AppShell>
  );
}
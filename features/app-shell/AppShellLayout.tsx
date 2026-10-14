'use client';

import { AppShell, Box, Group, Text } from '@mantine/core';
import { HEADER_ACTIONS_ID, HEADER_LEFT_ID } from '@/shared/ui/HeaderActions';
import { SettingsItemsProvider } from '@/shared/ui/SettingsItems';
import { AppNavbar } from './AppNavbar';
import { BottomNav } from './BottomNav';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { UserMenu } from './UserMenu';

type Props = {
  user: { name: string; email: string };
  children: React.ReactNode;
};

// высота нижнего меню на мобильных с учётом нижней безопасной зоны (iPhone с «чёлкой»)
const FOOTER_HEIGHT = 'calc(60px + env(safe-area-inset-bottom, 0px))';

// десктоп: шапка и боковая панель; мобильные: без шапки, навигация в нижнем меню
export function AppShellLayout({ user, children }: Props) {
  return (
    <SettingsItemsProvider>
      <AppShell
        header={{ height: { base: 0, sm: 60 } }}
        navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: true } }}
        footer={{ height: { base: FOOTER_HEIGHT, sm: 0 } }}
        padding="md"
      >
        <AppShell.Header visibleFrom="sm">
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Group gap="xs" id={HEADER_LEFT_ID} />
              <Text fw={700} size="lg">
                Бюджет
              </Text>
            </Group>
            <Group gap="sm">
              <Group gap="xs" id={HEADER_ACTIONS_ID} />
              <ColorSchemeToggle />
              <UserMenu user={user} />
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <AppNavbar />
        </AppShell.Navbar>

        <AppShell.Main>
          <Box maw={1200}>{children}</Box>
        </AppShell.Main>

        <AppShell.Footer hiddenFrom="sm" pb="env(safe-area-inset-bottom, 0px)">
          <BottomNav />
        </AppShell.Footer>
      </AppShell>
    </SettingsItemsProvider>
  );
}

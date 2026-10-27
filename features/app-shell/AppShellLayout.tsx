'use client';

import { AppShell, Box } from '@mantine/core';
import { PullToRefresh } from '@/shared/ui/PullToRefresh';
import { SettingsItemsProvider } from '@/shared/ui/SettingsItems';
import { AppNavbar } from './AppNavbar';
import { BottomNav } from './BottomNav';
import { UserMenu } from './UserMenu';

type Props = {
  user: { name: string; email: string };
  /** вышла новая версия, список изменений которой пользователь ещё не открывал: красная точка на «Профиль» */
  hasNewChangelog: boolean;
  children: React.ReactNode;
};

// высота нижнего меню на мобильных: полоса, нижний отступ-надбавка и безопасная зона iPhone
export const FOOTER_HEIGHT = 'calc(72px + env(safe-area-inset-bottom, 0px))';

// десктоп: только боковая панель (профиль внизу); мобильные: навигация в нижнем меню. Шапки нет
export function AppShellLayout({ user, hasNewChangelog, children }: Props) {
  return (
    <SettingsItemsProvider>
      <PullToRefresh />
      <AppShell
        navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: true } }}
        // offset: false — мейн заезжает под нижнее меню до края экрана, без пустой полосы
        footer={{ height: { base: FOOTER_HEIGHT, sm: 0 }, offset: false }}
        padding="md"
      >
        <AppShell.Navbar p="md" withBorder={false}>
          <AppShell.Section grow>
            <AppNavbar />
          </AppShell.Section>
          {/* профиль в левом нижнем углу */}
          <AppShell.Section>
            <UserMenu user={user} />
          </AppShell.Section>
        </AppShell.Navbar>

        {/* на мобильных без нижнего отступа: иначе страница на высоту экрана плюс padding и чуть скроллится */}
        <AppShell.Main pb={{ base: 0, sm: 'md' }}>
          <Box>{children}</Box>
        </AppShell.Main>

        <AppShell.Footer
          hiddenFrom="sm"
          pb="calc(env(safe-area-inset-bottom, 0px) + 12px)"
        >
          <BottomNav profileBadge={hasNewChangelog} />
        </AppShell.Footer>
      </AppShell>
    </SettingsItemsProvider>
  );
}

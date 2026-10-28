'use client';

import { AppShell, Box } from '@mantine/core';
import { PullToRefresh } from '@/shared/ui/PullToRefresh';
import { SettingsItemsProvider } from '@/shared/ui/SettingsItems';
import { MobileSettings } from './MobileSettings';

type Props = {
  children: React.ReactNode;
};

// нижний отступ страниц: только безопасная зона iPhone (меню внизу больше нет)
export const BOTTOM_INSET = 'env(safe-area-inset-bottom, 0px)';

// без боковой панели, шапки и нижнего меню: навигацию каждая страница строит сама
// (на главной и в пространстве «Главная» и «Профиль» в углах, в разделах «назад»)
export function AppShellLayout({ children }: Props) {
  return (
    <SettingsItemsProvider>
      <PullToRefresh />
      <AppShell padding="md">
        {/* без нижнего отступа: иначе страница на высоту экрана плюс padding и чуть скроллится */}
        <AppShell.Main pb={0}>
          <Box>{children}</Box>
        </AppShell.Main>
      </AppShell>
      <MobileSettings />
    </SettingsItemsProvider>
  );
}

'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconSettings, IconUser, IconUsers } from '@tabler/icons-react';
import { ActionIcon, Drawer, NavLink, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useSettingsItems } from '@/shared/ui/SettingsItems';

function Item({
  label,
  icon,
  active,
  href,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  const style = {
    flex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    color: active ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-dimmed)',
  } as const;

  const content = (
    <>
      {icon}
      <Text size="xs" fw={active ? 600 : 400} c="inherit" lh={1.2}>
        {label}
      </Text>
    </>
  );

  return href ? (
    <UnstyledButton component={Link} href={href} aria-current={active ? 'page' : undefined} style={style}>
      {content}
    </UnstyledButton>
  ) : (
    <UnstyledButton onClick={onClick} style={style}>
      {content}
    </UnstyledButton>
  );
}

// нижнее меню на мобильных: бюджеты, настройки и профиль
export function BottomNav() {
  const pathname = usePathname();
  const [settingsOpened, settings] = useDisclosure(false);
  const items = useSettingsItems();

  return (
    <>
      <nav style={{ display: 'flex', height: '100%' }} aria-label="Основное меню">
        <Item
          href="/budgets"
          label="Бюджеты"
          icon={<IconUsers size={22} />}
          active={pathname.startsWith('/budgets')}
        />
        <Item
          href="/profile"
          label="Профиль"
          icon={<IconUser size={22} />}
          active={pathname.startsWith('/profile')}
        />
      </nav>

      {/* настройки бюджета — фиксированная кнопка в правом верхнем углу экрана */}
      {items.length > 0 && (
        <ActionIcon
          variant="default"
          size="lg"
          radius="xl"
          aria-label="Настройки бюджета"
          onClick={settings.open}
          style={{
            position: 'fixed',
            top: 'var(--mantine-spacing-md)',
            right: 'var(--mantine-spacing-md)',
            zIndex: 100,
          }}
        >
          <IconSettings size={18} />
        </ActionIcon>
      )}

      <Drawer
        opened={settingsOpened}
        onClose={settings.close}
        position="bottom"
        size="auto"
        radius="lg"
        title="Настройки"
      >
        <Stack gap={2} pb="md">
          {items.map((item) => (
            <NavLink
              key={item.key}
              label={item.label}
              leftSection={item.icon}
              onClick={() => {
                settings.close();
                item.onClick();
              }}
              style={{ borderRadius: 'var(--mantine-radius-md)' }}
            />
          ))}
        </Stack>
      </Drawer>
    </>
  );
}

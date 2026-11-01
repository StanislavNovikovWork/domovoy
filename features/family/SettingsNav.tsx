'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IconCrown, IconSettings2 } from '@tabler/icons-react';
import { Box, NavLink, Stack, Text } from '@mantine/core';
import { PageTopBar } from '@/features/app-shell';
import type { ReactNode } from 'react';

type Props = { householdId: string };

type Item = { label: string; icon: ReactNode; href: string };

function navItems(base: string): Item[] {
  return [
    { label: 'Управление пространством', icon: <IconSettings2 size={18} />, href: `${base}/space` },
    { label: 'Управление подпиской', icon: <IconCrown size={18} />, href: `${base}/subscription` },
  ];
}

function Links({ items, pathname }: { items: Item[]; pathname: string }) {
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.label}
          component={Link}
          href={item.href}
          label={item.label}
          leftSection={item.icon}
          active={pathname === item.href}
          variant="light"
          style={{ borderRadius: 'var(--mantine-radius-md)' }}
        />
      ))}
    </>
  );
}

// внутреннее меню настроек пространства на десктопе: слева разделы, справа контент
export function SettingsNav({ householdId }: Props) {
  const pathname = usePathname();
  const base = `/budgets/${householdId}/settings`;

  return (
    <Box component="nav" w={240} visibleFrom="md" style={{ flexShrink: 0 }}>
      <Text fw={700} size="lg" mb="xs" px="xs">
        Список настроек
      </Text>
      <Links items={navItems(base)} pathname={pathname} />
    </Box>
  );
}

// мобильный экран настроек: только список разделов; на десктопе сразу открываем первый раздел
export function SettingsIndex({ householdId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const base = `/budgets/${householdId}/settings`;

  useEffect(() => {
    if (window.matchMedia('(min-width: 62em)').matches) router.replace(`${base}/space`);
  }, [router, base]);

  return (
    <Stack gap="lg" hiddenFrom="md">
      <PageTopBar backHref={`/budgets/${householdId}`} backLabel="К пространству" title="Настройки" />
      <Box component="nav">
        <Links items={navItems(base)} pathname={pathname} />
      </Box>
    </Stack>
  );
}

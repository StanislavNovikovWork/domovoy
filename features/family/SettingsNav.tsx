'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconCrown, IconSettings2, IconUsers } from '@tabler/icons-react';
import { Box, NavLink, Text } from '@mantine/core';

type Props = { householdId: string };

// внутреннее меню настроек пространства на десктопе: слева разделы, справа контент
export function SettingsNav({ householdId }: Props) {
  const pathname = usePathname();
  const base = `/budgets/${householdId}/settings`;
  const items = [
    { label: 'Участники', icon: <IconUsers size={18} />, href: `${base}/members` },
    { label: 'Управление пространством', icon: <IconSettings2 size={18} />, href: `${base}/space` },
    { label: 'Управление подпиской', icon: <IconCrown size={18} />, href: `${base}/subscription` },
  ];

  return (
    <Box component="nav" w={240} visibleFrom="md" style={{ flexShrink: 0 }}>
      <Text fw={700} size="lg" mb="xs" px="xs">
        Список настроек
      </Text>
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
    </Box>
  );
}

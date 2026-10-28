'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconHome,
  IconLayoutDashboard,
  IconMapPin,
  IconNotes,
  IconPhoto,
  IconTargetArrow,
  IconUser,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react';
import { Box, Group, NavLink, Stack } from '@mantine/core';

type Props = {
  householdId: string;
  /** красная точка на пункте «Профиль»: есть непрочитанный список изменений */
  hasNewChangelog: boolean;
  children: ReactNode;
};

type Item = { label: string; icon: ReactNode; href?: string };

// боковое меню пространства на десктопе; на мобильном вместо него плитки на «Рабочем столе»
export function SpaceShell({ householdId, hasNewChangelog, children }: Props) {
  const pathname = usePathname();
  const base = `/budgets/${householdId}`;
  const items: Item[] = [
    { label: 'Рабочий стол', icon: <IconLayoutDashboard size={18} />, href: base },
    { label: 'Бюджет', icon: <IconWallet size={18} />, href: `${base}/budget` },
    { label: 'Участники', icon: <IconUsers size={18} />, href: `${base}/members` },
    { label: 'Куда сходить', icon: <IconMapPin size={18} />, href: `${base}/places` },
    { label: 'Галерея', icon: <IconPhoto size={18} /> },
    { label: 'План', icon: <IconTargetArrow size={18} /> },
    { label: 'Заметки', icon: <IconNotes size={18} /> },
  ];

  const linkProps = {
    variant: 'light' as const,
    style: { borderRadius: 'var(--mantine-radius-md)' },
  };

  return (
    <Group align="flex-start" wrap="nowrap" gap="lg">
      <Box
        component="nav"
        w={220}
        visibleFrom="md"
        style={{ flexShrink: 0, position: 'sticky', top: 16 }}
      >
        {/* вся высота экрана: профиль уходит в низ меню */}
        <Stack h="calc(100dvh - 2 * var(--mantine-spacing-md))" justify="space-between" gap={4}>
          <Box>
            <NavLink
              component={Link}
              href="/"
              label="Все пространства"
              leftSection={<IconHome size={18} />}
              {...linkProps}
            />
            {items.map((item) =>
              item.href ? (
                <NavLink
                  key={item.label}
                  component={Link}
                  href={item.href}
                  label={item.label}
                  leftSection={item.icon}
                  active={pathname === item.href}
                  {...linkProps}
                />
              ) : (
                <NavLink
                  key={item.label}
                  label={item.label}
                  description="В разработке"
                  leftSection={item.icon}
                  disabled
                  {...linkProps}
                />
              )
            )}
          </Box>
          <NavLink
            component={Link}
            href="/profile"
            label="Профиль"
            leftSection={<IconUser size={18} />}
            rightSection={
              hasNewChangelog ? (
                <Box w={8} h={8} bg="red" aria-label="Есть новые изменения" style={{ borderRadius: '50%' }} />
              ) : undefined
            }
            active={pathname === '/profile'}
            {...linkProps}
          />
        </Stack>
      </Box>
      <Box style={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Group>
  );
}

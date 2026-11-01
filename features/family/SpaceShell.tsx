'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconAddressBook,
  IconCake,
  IconCalendar,
  IconChefHat,
  IconCrown,
  IconFileText,
  IconHelp,
  IconHome,
  IconLayoutDashboard,
  IconMap,
  IconList,
  IconMapPin,
  IconPhoto,
  IconSettings,
  IconTargetArrow,
  IconUser,
  IconWallet,
} from '@tabler/icons-react';
import { Box, Divider, Group, NavLink, Stack } from '@mantine/core';

type Props = {
  householdId: string;
  /** красная точка на пункте «Профиль»: есть непрочитанный список изменений */
  hasNewChangelog: boolean;
  /** периодический бюджет показывает разделы-заглушки и календарь */
  periodic: boolean;
  children: ReactNode;
};

type Item = {
  label: string;
  icon: ReactNode;
  href?: string;
  /** активен и на вложенных страницах (настройки) */
  prefix?: boolean;
};

// боковое меню пространства на десктопе; на мобильном вместо него плитки на «Рабочем столе»
export function SpaceShell({ householdId, hasNewChangelog, periodic, children }: Props) {
  const pathname = usePathname();
  const base = `/budgets/${householdId}`;
  const items: Item[] = [
    { label: 'Рабочий стол', icon: <IconLayoutDashboard size={18} />, href: base },
    { label: 'Бюджет', icon: <IconWallet size={18} />, href: `${base}/budget` },
    { label: 'Куда сходить', icon: <IconMapPin size={18} />, href: `${base}/places` },
    // разделы-заглушки и календарь пока только у периодических пространств
    ...(periodic
      ? [
          { label: 'Галерея', icon: <IconPhoto size={18} /> },
          { label: 'План затрат', icon: <IconTargetArrow size={18} />, href: `${base}/plan` },
          { label: 'Списки', icon: <IconList size={18} /> },
          { label: 'Документы', icon: <IconFileText size={18} /> },
          { label: 'Меню', icon: <IconChefHat size={18} /> },
          { label: 'Карта', icon: <IconMap size={18} /> },
          { label: 'Контакты', icon: <IconAddressBook size={18} /> },
          { label: 'Дни рождения', icon: <IconCake size={18} /> },
          { label: 'Календарь', icon: <IconCalendar size={18} />, href: `${base}/calendar` },
        ]
      : [{ label: 'План затрат', icon: <IconTargetArrow size={18} />, href: `${base}/plan` }]),
  ];
  const serviceItems: Item[] = [
    ...(periodic
      ? [
          { label: 'Премиум', icon: <IconCrown size={18} /> },
          { label: 'Настройки', icon: <IconSettings size={18} />, href: `${base}/settings`, prefix: true },
          { label: 'Помощь', icon: <IconHelp size={18} /> },
        ]
      : [
          {
            label: 'Настройки',
            icon: <IconSettings size={18} />,
            href: `${base}/settings`,
            prefix: true,
          },
        ]),
  ];

  const renderItem = (item: Item) =>
    item.href ? (
      <NavLink
        key={item.label}
        component={Link}
        href={item.href}
        label={item.label}
        leftSection={item.icon}
        active={item.prefix ? pathname.startsWith(item.href) : pathname === item.href}
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
    );

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
            {items.map(renderItem)}
            <Divider my="xs" />
            {serviceItems.map(renderItem)}
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

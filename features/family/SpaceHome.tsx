'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  IconAddressBook,
  IconCake,
  IconCalendar,
  IconFolder,
  IconChefHat,
  IconFileText,
  IconMap,
  IconList,
  IconMapPin,
  IconPhoto,
  IconSettings,
  IconTargetArrow,
  IconWallet,
} from '@tabler/icons-react';
import { Box, Card, Container, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { BOTTOM_INSET, HomeProfileBar } from '@/features/app-shell';
import { DESKTOP_TILE_KEYS, orderDesktopTiles } from '@/shared/config/desktop-tiles';
import type { CalendarEventItem } from '@/server/calendar/queries';
import type { ShoppingWidgetData } from '@/server/checklists/queries';
import { BudgetSummaryWidget, type BudgetWidgetData } from './BudgetSummaryWidget';
import { CalendarWidget } from './CalendarWidget';
import { ShoppingWidget } from './ShoppingWidget';

type Props = {
  householdId: string;
  name: string;
  hasNewChangelog: boolean;
  /** плитки, скрытые этим участником */
  hiddenTiles: string[];
  /** порядок плиток этого участника */
  tileOrder: string[];
  /** данные для виджетов «Рабочего стола» на десктопе */
  desktop: {
    budget: BudgetWidgetData;
    events: CalendarEventItem[];
    shopping: ShoppingWidgetData;
  };
};

type Tile = { key: string; label: string; icon: ReactNode; color: string; href?: string };

// пространство (хозяйство): «Главная» и «Профиль» в углах, ниже плитки разделов
export function SpaceHome({
  householdId,
  name,
  hasNewChangelog,
  hiddenTiles,
  tileOrder,
  desktop,
}: Props) {
  const allTiles: Tile[] = [
    {
      key: 'budget',
      label: 'Бюджет',
      icon: <IconWallet size={30} />,
      color: 'teal',
      href: `/budgets/${householdId}/budget`,
    },
    // у периодических пространств вместо «Настроек» на втором месте «Списки»
    ...(desktop.budget.periodic
      ? [
          {
            key: 'lists',
            label: 'Списки',
            icon: <IconList size={30} />,
            color: 'pink',
            href: `/budgets/${householdId}/lists`,
          },
        ]
      : [
          {
            key: 'settings',
            label: 'Настройки',
            icon: <IconSettings size={30} />,
            color: 'gray',
            href: `/budgets/${householdId}/settings`,
          },
        ]),
    {
      key: 'places',
      label: 'Куда сходить',
      icon: <IconMapPin size={30} />,
      color: 'cyan',
      href: `/budgets/${householdId}/places`,
    },
    {
      key: 'plan',
      label: 'План затрат',
      icon: <IconTargetArrow size={30} />,
      color: 'orange',
      href: `/budgets/${householdId}/plan`,
    },
    // разделы-заглушки и календарь пока только у периодических пространств
    ...(desktop.budget.periodic
      ? [
          {
            key: 'calendar',
            label: 'Календарь',
            icon: <IconCalendar size={30} />,
            color: 'teal',
            href: `/budgets/${householdId}/calendar`,
          },
          {
            key: 'settings',
            label: 'Настройки',
            icon: <IconSettings size={30} />,
            color: 'gray',
            href: `/budgets/${householdId}/settings`,
          },
          { key: 'docs', label: 'Документы', icon: <IconFileText size={30} />, color: 'indigo' },
          {
            key: 'menu',
            label: 'Меню',
            icon: <IconChefHat size={30} />,
            color: 'red',
            href: `/budgets/${householdId}/menu`,
          },
          { key: 'map', label: 'Карта', icon: <IconMap size={30} />, color: 'cyan' },
          {
            key: 'contacts',
            label: 'Контакты',
            icon: <IconAddressBook size={30} />,
            color: 'grape',
          },
          { key: 'birthdays', label: 'Дни рождения', icon: <IconCake size={30} />, color: 'orange' },
          { key: 'gallery', label: 'Галерея', icon: <IconPhoto size={30} />, color: 'grape' },
          {
            key: 'projects',
            label: 'Поездки',
            icon: <IconFolder size={30} />,
            color: 'blue',
            href: `/budgets/${householdId}/projects`,
          },
        ]
      : []),
  ];
  // «Настройки» не настраиваются и остаются на своём месте; остальные плитки сортируем по tileOrder
  const configurable = new Set(DESKTOP_TILE_KEYS);
  const orderedConfigurable = orderDesktopTiles(
    allTiles.filter((t) => configurable.has(t.key)),
    tileOrder
  );
  const queue = [...orderedConfigurable];
  const orderedAll = allTiles
    .map((t) => (configurable.has(t.key) ? queue.shift() : t))
    .filter((t): t is Tile => Boolean(t));
  const tiles = orderedAll.filter((t) => t.key === 'settings' || !hiddenTiles.includes(t.key));

  return (
    <Stack gap="lg" pb={BOTTOM_INSET}>
      {/* на десктопе верхняя строка не нужна: навигация и профиль в боковом меню */}
      <Box hiddenFrom="md">
        <HomeProfileBar hasNewChangelog={hasNewChangelog} title={name} />
      </Box>
      {/* на десктопе вместо плиток — боковое меню и «Рабочий стол» с виджетами */}
      <Box visibleFrom="md">
        <Stack gap="lg">
          <Group align="stretch" wrap="nowrap" gap="lg">
            <Box style={{ flex: 1, minWidth: 0 }} maw={720}>
              <BudgetSummaryWidget householdId={householdId} data={desktop.budget} />
            </Box>
            <Stack w={300} gap="lg" style={{ flexShrink: 0 }}>
              <CalendarWidget householdId={householdId} events={desktop.events} />
              <ShoppingWidget householdId={householdId} data={desktop.shopping} />
            </Stack>
          </Group>
        </Stack>
      </Box>
      <Container size="md" p={0} mx={0} w="100%" hiddenFrom="md">
        <Stack gap="lg">
          <SimpleGrid cols={2}>
            {tiles.map((t) => {
              // название слева сверху, цветная иконка справа снизу
              const body = (
                <Stack h="100%" justify="space-between" gap="xs">
                  <Stack gap={0}>
                    <Text fw={600}>{t.label}</Text>
                    {!t.href && (
                      <Text size="xs" c="dimmed">
                        В разработке
                      </Text>
                    )}
                  </Stack>
                  <Group justify="flex-end">
                    {/* оттенок светлее в тёмной теме, иначе цвета тонут в фоне */}
                    <Box
                      c={`light-dark(var(--mantine-color-${t.color}-6), var(--mantine-color-${t.color}-3))`}
                      style={{ display: 'flex' }}
                    >
                      {t.icon}
                    </Box>
                  </Group>
                </Stack>
              );
              return t.href ? (
                <Card key={t.key} withBorder radius="md" h={100} p="sm" component={Link} href={t.href}>
                  {body}
                </Card>
              ) : (
                <Card key={t.key} withBorder radius="md" h={100} p="sm">
                  {body}
                </Card>
              );
            })}
          </SimpleGrid>
        </Stack>
      </Container>
    </Stack>
  );
}

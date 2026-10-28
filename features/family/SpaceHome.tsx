'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  IconMapPin,
  IconNotes,
  IconPhoto,
  IconTargetArrow,
  IconUsers,
  IconWallet,
} from '@tabler/icons-react';
import { Box, Card, Container, Group, SimpleGrid, Stack, Text } from '@mantine/core';
import { BOTTOM_INSET, HomeProfileBar } from '@/features/app-shell';

type Props = {
  householdId: string;
  name: string;
  hasNewChangelog: boolean;
};

type Tile = { key: string; label: string; icon: ReactNode; color: string; href?: string };

// пространство (хозяйство): «Главная» и «Профиль» в углах, ниже плитки разделов
export function SpaceHome({ householdId, name, hasNewChangelog }: Props) {
  const tiles: Tile[] = [
    {
      key: 'budget',
      label: 'Бюджет',
      icon: <IconWallet size={30} />,
      color: 'teal',
      href: `/budgets/${householdId}/budget`,
    },
    {
      key: 'members',
      label: 'Участники',
      icon: <IconUsers size={30} />,
      color: 'blue',
      href: `/budgets/${householdId}/members`,
    },
    {
      key: 'places',
      label: 'Куда сходить',
      icon: <IconMapPin size={30} />,
      color: 'cyan',
      href: `/budgets/${householdId}/places`,
    },
    { key: 'gallery', label: 'Галерея', icon: <IconPhoto size={30} />, color: 'grape' },
    { key: 'plan', label: 'План', icon: <IconTargetArrow size={30} />, color: 'orange' },
    { key: 'notes', label: 'Заметки', icon: <IconNotes size={30} />, color: 'pink' },
  ];

  return (
    <Stack gap="lg" pb={BOTTOM_INSET}>
      <HomeProfileBar hasNewChangelog={hasNewChangelog} title={name} />
      <Container size="md" p={0} mx={0} w="100%">
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

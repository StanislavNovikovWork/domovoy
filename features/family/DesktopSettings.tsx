'use client';

import { useOptimistic, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconAddressBook,
  IconCake,
  IconCalendar,
  IconChefHat,
  IconCheck,
  IconFileText,
  IconList,
  IconMap,
  IconMapPin,
  IconPhoto,
  IconTargetArrow,
  IconWallet,
} from '@tabler/icons-react';
import { Box, Card, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BOTTOM_INSET, PageTopBar } from '@/features/app-shell';
import { setHiddenTiles } from '@/server/desktop/actions';
import { DESKTOP_TILES } from '@/shared/config/desktop-tiles';

type Props = { householdId: string; periodic: boolean; hidden: string[] };

const META: Record<string, { icon: ReactNode; color: string }> = {
  budget: { icon: <IconWallet size={28} />, color: 'teal' },
  lists: { icon: <IconList size={28} />, color: 'pink' },
  places: { icon: <IconMapPin size={28} />, color: 'cyan' },
  plan: { icon: <IconTargetArrow size={28} />, color: 'orange' },
  calendar: { icon: <IconCalendar size={28} />, color: 'teal' },
  docs: { icon: <IconFileText size={28} />, color: 'indigo' },
  menu: { icon: <IconChefHat size={28} />, color: 'red' },
  map: { icon: <IconMap size={28} />, color: 'cyan' },
  contacts: { icon: <IconAddressBook size={28} />, color: 'grape' },
  birthdays: { icon: <IconCake size={28} />, color: 'orange' },
  gallery: { icon: <IconPhoto size={28} />, color: 'grape' },
};

// настройка плиток мобильного рабочего стола; личная, у каждого участника своя
export function DesktopSettings({ householdId, periodic, hidden }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [current, applyHidden] = useOptimistic(hidden, (_, next: string[]) => next);
  const tiles = DESKTOP_TILES.filter((t) => periodic || !t.periodicOnly);

  const toggle = (key: string) => {
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    startTransition(async () => {
      applyHidden(next);
      const result = await setHiddenTiles({ householdId, hidden: next });
      if (!result.ok) notifications.show({ message: 'Не удалось сохранить', color: 'red' });
      router.refresh();
    });
  };

  return (
    <Stack gap="lg" maw={480} pb={BOTTOM_INSET}>
      <PageTopBar
        backHref={`/budgets/${householdId}/settings`}
        backLabel="К настройкам"
        title="Рабочий стол"
        titleAlign="left"
      />
      <Text size="sm" c="dimmed">
        Нажмите на плитку, чтобы показать или скрыть её на рабочем столе телефона. Настройка только для
        вас, «Настройки» скрыть нельзя.
      </Text>
      <SimpleGrid cols={2}>
        {tiles.map((t) => {
          const meta = META[t.key];
          const active = !current.includes(t.key);
          return (
            <UnstyledButton key={t.key} onClick={() => toggle(t.key)} aria-pressed={active}>
              <Card
                withBorder
                radius="md"
                h={100}
                p="sm"
                style={{
                  opacity: active ? 1 : 0.45,
                  borderStyle: active ? 'solid' : 'dashed',
                  borderColor: active
                    ? `var(--mantine-color-${meta.color}-5)`
                    : 'var(--mantine-color-default-border)',
                  transition: 'opacity 120ms',
                }}
              >
                <Stack h="100%" justify="space-between" gap="xs">
                  <Text fw={600}>{t.label}</Text>
                  <Box
                    c={`light-dark(var(--mantine-color-${meta.color}-6), var(--mantine-color-${meta.color}-3))`}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
                  >
                    {active ? <IconCheck size={18} /> : <span />}
                    {meta.icon}
                  </Box>
                </Stack>
              </Card>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

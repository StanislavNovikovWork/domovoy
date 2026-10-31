'use client';

import Link from 'next/link';
import { Box, Button, Group, Paper, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import type { CalendarEventItem } from '@/server/calendar/queries';

dayjs.locale('ru');

// узкий высокий виджет «Рабочего стола»: три ближайших события и переход в календарь
export function CalendarWidget({
  householdId,
  events,
}: {
  householdId: string;
  events: CalendarEventItem[];
}) {
  const today = dayjs().format('YYYY-MM-DD');
  const upcoming = events.filter((e) => e.eventDate >= today).slice(0, 3);

  return (
    <Paper withBorder radius="lg" p="lg" h="100%">
      <Stack gap="sm" h="100%">
        <Text fw={600} size="lg">
          Предстоящие события
        </Text>
        {upcoming.length === 0 ? (
          <Text size="sm" c="dimmed">
            Ближайших событий нет
          </Text>
        ) : (
          <Stack gap={8}>
            {upcoming.map((e) => (
              <Group key={e.id} gap="sm" wrap="nowrap" align="flex-start">
                {/* мини-календарик: полоска сверху и число по центру */}
                <Box
                  w={36}
                  h={38}
                  style={{
                    flexShrink: 0,
                    borderRadius: 'var(--mantine-radius-sm)',
                    border: '1px solid var(--mantine-color-default-border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box h={8} bg="blue" />
                  <Text
                    size="sm"
                    fw={600}
                    ta="center"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {dayjs(e.eventDate).date()}
                  </Text>
                </Box>
                <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" truncate>
                    {e.title}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {dayjs(e.eventDate).format('D MMMM')}
                    {e.eventTime ? `, ${e.eventTime.slice(0, 5)}` : ', весь день'}
                  </Text>
                </Stack>
              </Group>
            ))}
          </Stack>
        )}
        <Button
          component={Link}
          href={`/budgets/${householdId}/calendar`}
          variant="light"
          size="xs"
          mt="auto"
        >
          Перейти в календарь
        </Button>
      </Stack>
    </Paper>
  );
}

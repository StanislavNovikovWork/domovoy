'use client';

import { List, Modal, Stack, Text, Title } from '@mantine/core';
import type { ChangelogEntry } from '@/server/changelog/queries';

type Props = {
  opened: boolean;
  onClose: () => void;
  entries: ChangelogEntry[];
};

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

// список изменений приложения на весь экран: версия, дата и короткие пункты
export function ChangelogModal({ opened, onClose, entries }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Список изменений" fullScreen>
      <Stack gap="xl" maw={640} mx="auto">
        {entries.length === 0 && <Text c="dimmed">Пока нет записей.</Text>}
        {entries.map((e) => (
          <Stack key={e.version} gap="xs">
            <div>
              <Title order={4}>Версия {e.version}</Title>
              <Text size="sm" c="dimmed">
                {formatDate(e.releasedOn)}
              </Text>
            </div>
            <List size="sm" spacing={4}>
              {e.items.map((item) => (
                <List.Item key={item}>{item}</List.Item>
              ))}
            </List>
          </Stack>
        ))}
      </Stack>
    </Modal>
  );
}

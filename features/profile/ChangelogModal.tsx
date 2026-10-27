'use client';

import { Accordion, List, Modal, Text } from '@mantine/core';
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

// список изменений приложения на весь экран: версии сворачиваются, свежая раскрыта
export function ChangelogModal({ opened, onClose, entries }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Список изменений" fullScreen>
      {entries.length === 0 ? (
        <Text c="dimmed">Пока нет записей.</Text>
      ) : (
        <Accordion defaultValue={entries[0].version} maw={640} mx="auto">
          {entries.map((e) => (
            <Accordion.Item key={e.version} value={e.version}>
              <Accordion.Control>
                <Text fw={600}>Версия {e.version}</Text>
                <Text size="sm" c="dimmed">
                  {formatDate(e.releasedOn)}
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <List size="sm" spacing={4}>
                  {e.items.map((item) => (
                    <List.Item key={item}>{item}</List.Item>
                  ))}
                </List>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Modal>
  );
}

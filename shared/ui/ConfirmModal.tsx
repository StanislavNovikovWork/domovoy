'use client';

import type { ReactNode } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

type Props = {
  opened: boolean;
  onClose: () => void;
  title: string;
  text: ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
};

// подтверждение удаления; zIndex выше полноэкранных окон (200)
export function ConfirmModal({ opened, onClose, title, text, onConfirm, confirmLabel = 'Удалить' }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} size="sm" centered zIndex={350}>
      <Stack>
        <Text size="sm">{text}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button color="red" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

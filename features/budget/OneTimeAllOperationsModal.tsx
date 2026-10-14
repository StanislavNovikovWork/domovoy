'use client';

import { IconPencil, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Group, Modal } from '@mantine/core';
import type { TransactionItem } from '@/shared/lib/budget';
import { OneTimeOperations } from './OneTimeOperations';

type Props = {
  opened: boolean;
  onClose: () => void;
  items: TransactionItem[];
  onEdit: (t: TransactionItem) => void;
  // удаление выполняется оптимистично на уровне BudgetView: строка исчезает сразу
  onDelete: (id: string) => void;
};

// все операции разового бюджета: редактирование и удаление
export function OneTimeAllOperationsModal({ opened, onClose, items, onEdit, onDelete }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Все операции" fullScreen>
      <OneTimeOperations
        bare
        items={items}
        renderActions={(t) => (
          <Group gap={2} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label="Редактировать"
              onClick={() => onEdit(t)}
            >
              <IconPencil size={14} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              aria-label="Удалить"
              onClick={() => onDelete(t.id)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        )}
      />
    </Modal>
  );
}

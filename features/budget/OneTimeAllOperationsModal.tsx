'use client';

import { useState } from 'react';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Group, Modal } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { TransactionItem } from '@/shared/lib/budget';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
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
  // на мобильных окно на весь экран, на десктопе обычная модалка
  const isMobile = useMediaQuery('(max-width: 47.99375em)');
  // операция, удаление которой подтверждается в окне
  const [confirmDelete, setConfirmDelete] = useState<TransactionItem | null>(null);

  return (
    <>
    <ConfirmModal
      opened={!!confirmDelete}
      onClose={() => setConfirmDelete(null)}
      title="Удалить операцию?"
      text="Операция будет удалена. Это нельзя отменить."
      onConfirm={() => {
        const t = confirmDelete;
        setConfirmDelete(null);
        if (t) onDelete(t.id);
      }}
    />
    <Modal
      opened={opened}
      onClose={onClose}
      title="Все операции"
      size="lg"
      fullScreen={!!isMobile}
    >
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
              onClick={() => setConfirmDelete(t)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        )}
      />
    </Modal>
    </>
  );
}

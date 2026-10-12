'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Group, Modal } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { deleteTransaction } from '@/server/transactions/actions';
import type { TransactionItem } from '@/shared/lib/budget';
import { OneTimeOperations } from './OneTimeOperations';

type Props = {
  opened: boolean;
  onClose: () => void;
  householdId: string;
  items: TransactionItem[];
  onEdit: (t: TransactionItem) => void;
};

// все операции разового бюджета: редактирование и удаление
export function OneTimeAllOperationsModal({ opened, onClose, householdId, items, onEdit }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = (t: TransactionItem) => {
    if (!window.confirm(`Удалить операцию «${t.note || t.categoryName}»?`)) return;
    setDeletingId(t.id);
    startTransition(async () => {
      const result = await deleteTransaction({ householdId, id: t.id });
      setDeletingId(null);
      if (result.ok) {
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Все операции" size="md">
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
              loading={deletingId === t.id}
              onClick={() => remove(t)}
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        )}
      />
    </Modal>
  );
}

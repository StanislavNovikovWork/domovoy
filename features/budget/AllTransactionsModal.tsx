'use client';

import { useState } from 'react';
import { IconPencil, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Group, Modal, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { TransactionItem, TxType } from '@/shared/lib/budget';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { formatShortDate } from '@/shared/lib/period';
import { capitalize } from '@/shared/lib/text';
import { signedMoney } from './SidePanel';

type Props = {
  opened: boolean;
  onClose: () => void;
  type: TxType;
  periodLabel: string;
  items: TransactionItem[]; // уже за выбранный период и тип, новые сверху
  onEdit: (t: TransactionItem) => void;
  // удаление выполняется оптимистично на уровне BudgetView: строка исчезает сразу
  onDelete: (id: string) => void;
};

// все операции периодического бюджета: редактирование и удаление
export function AllTransactionsModal({
  opened,
  onClose,
  type,
  periodLabel,
  items,
  onEdit,
  onDelete,
}: Props) {
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
      title={`${type === 'expense' ? 'Расходы' : 'Доходы'}, ${periodLabel}`}
      size="lg"
      fullScreen={!!isMobile}
    >
      {items.length === 0 ? (
        <Text c="dimmed" size="sm" ta="center" py="md">
          Нет операций за этот период
        </Text>
      ) : (
        <Stack gap={0}>
          {items.map((t, index) => (
            <Group
              key={t.id}
              gap="sm"
              wrap="nowrap"
              py="xs"
              style={
                index > 0
                  ? { borderTop: '1px solid var(--mantine-color-default-border)' }
                  : undefined
              }
            >
              <Text size="xs" c="dimmed" w={44} style={{ flexShrink: 0 }}>
                {formatShortDate(t.occurredOn)}
              </Text>
              <Text size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
                {capitalize(t.note || t.categoryName)}
              </Text>
              <Text
                size="sm"
                fw={500}
                c={t.categoryType === 'income' ? 'teal' : undefined}
                style={{ whiteSpace: 'nowrap' }}
              >
                {signedMoney(t)}
              </Text>
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
            </Group>
          ))}
        </Stack>
      )}
    </Modal>
    </>
  );
}

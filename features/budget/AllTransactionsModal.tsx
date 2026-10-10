'use client';

import { Box, Group, Modal, Stack, Text } from '@mantine/core';
import type { TransactionItem, TxType } from '@/shared/lib/budget';
import { formatShortDate } from '@/shared/lib/period';
import { signedMoney } from './SidePanel';

type Props = {
  opened: boolean;
  onClose: () => void;
  type: TxType;
  periodLabel: string;
  items: TransactionItem[]; // уже за выбранный период и тип, новые сверху
};

export function AllTransactionsModal({ opened, onClose, type, periodLabel, items }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`${type === 'expense' ? 'Расходы' : 'Доходы'}, ${periodLabel}`}
      size="md"
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
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" truncate>
                  {t.note || t.categoryName}
                </Text>
                <Text size="xs" c="dimmed" truncate>
                  {t.categoryName}
                </Text>
              </Box>
              <Text
                size="sm"
                fw={500}
                c={t.categoryType === 'income' ? 'teal' : undefined}
                style={{ whiteSpace: 'nowrap' }}
              >
                {signedMoney(t)}
              </Text>
            </Group>
          ))}
        </Stack>
      )}
    </Modal>
  );
}

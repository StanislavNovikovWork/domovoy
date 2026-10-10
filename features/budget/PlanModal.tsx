'use client';

import { useState, useTransition } from 'react';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { removePlan, removePlanItem, setPlan, setPlanItem } from '@/server/plans/actions';
import type { PlanRow } from '@/shared/lib/budget';
import { formatMoney } from '@/shared/lib/money';
import { formatPeriodLabel } from '@/shared/lib/period';
import type { CategoryOption } from '@/shared/types/category';
import { AnimatedHeight } from '@/shared/ui/AnimatedHeight';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';

type Props = {
  opened: boolean;
  onClose: () => void;
  householdId: string;
  month: string; // YYYY-MM-01
  rows: PlanRow[];
  categories: CategoryOption[];
  /** категория, выбранная в форме «Добавить категорию» при открытии (например, для «Задать лимит») */
  initialCategoryId?: string | null;
};

const numberProps = {
  min: 0,
  decimalScale: 2,
  decimalSeparator: ',',
  thousandSeparator: ' ',
  suffix: ' ₽',
  hideControls: true,
} as const;

// значение из отформатированного поля («12 400,5 ₽») в рубли
function parseRubles(text: string): number {
  return Number(text.replace(/\s/g, '').replace(',', '.').replace('₽', ''));
}

type Result = { ok: true } | { ok: false; error: string };

// выполняет действие в transition; при ошибке показывает уведомление, при успехе вызывает onSuccess
function useAction() {
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<Result>, onSuccess?: () => void) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) onSuccess?.();
      else notifications.show({ message: result.error, color: 'red' });
    });
  };
  return { pending, run };
}

export function PlanModal({
  opened,
  onClose,
  householdId,
  month,
  rows,
  categories,
  initialCategoryId,
}: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`План затрат, ${formatPeriodLabel('month', month)}`}
      size="lg"
    >
      {/* содержимое пересоздаётся при каждом открытии */}
      <AnimatedHeight>
        <Content
          householdId={householdId}
          month={month}
          rows={rows}
          categories={categories}
          initialCategoryId={initialCategoryId}
          onClose={onClose}
        />
      </AnimatedHeight>
    </Modal>
  );
}

function Content({
  householdId,
  month,
  rows,
  categories,
  initialCategoryId,
  onClose,
}: Omit<Props, 'opened'>) {
  const { pending, run } = useAction();
  const [categoryId, setCategoryId] = useState<string | null>(initialCategoryId ?? null);
  const [amount, setAmount] = useState<number | string>('');

  const planned = new Set(rows.map((r) => r.categoryId));
  const available = categories.filter((c) => c.type === 'expense' && !planned.has(c.id));

  const add = () => {
    if (!categoryId) {
      notifications.show({ message: 'Выберите категорию', color: 'red' });
      return;
    }
    // сумма необязательна: категорию можно добавить пустой и сразу расписать статьи
    const kopecks = typeof amount === 'number' && amount > 0 ? Math.round(amount * 100) : 0;
    run(
      () => setPlan({ householdId, categoryId, month, amount: kopecks }),
      () => {
        setCategoryId(null);
        setAmount('');
        if (kopecks > 0) onClose();
      }
    );
  };

  return (
    <Stack>
      {available.length > 0 && (
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Добавить категорию
          </Text>
          <Group gap="xs" wrap="nowrap" align="flex-start">
            <Select
              placeholder="Категория"
              data={available.map((c) => ({ value: c.id, label: c.name }))}
              value={categoryId}
              onChange={setCategoryId}
              style={{ flex: 1 }}
              comboboxProps={{ withinPortal: true }}
            />
            <NumberInput
              placeholder="Сумма"
              w={130}
              value={amount}
              onChange={setAmount}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add();
                }
              }}
              {...numberProps}
            />
            <Button onClick={add} loading={pending}>
              Добавить
            </Button>
          </Group>
        </Stack>
      )}

      {rows.length === 0 && (
        <Text c="dimmed" size="sm">
          Добавьте категории и задайте, сколько планируете на них потратить. Внутри категории можно
          расписать статьи, например «Связь»: мобильная связь, VPN, интернет.
        </Text>
      )}

      {rows.map((r) => (
        <RowEditor key={r.categoryId} row={r} householdId={householdId} month={month} />
      ))}
    </Stack>
  );
}

// категория плана: сумма (или итог по статьям) и редактор статей
function RowEditor({
  row,
  householdId,
  month,
}: {
  row: PlanRow;
  householdId: string;
  month: string;
}) {
  const { pending, run } = useAction();
  const hasItems = row.items.length > 0;
  // только что добавленная категория без суммы: сразу предлагаем расписать статьи
  const [adding, setAdding] = useState(!hasItems && row.planned === 0);
  const [itemName, setItemName] = useState('');
  const [itemAmount, setItemAmount] = useState<number | string>('');

  const saveCategory = (value: number) => {
    if (value > 0 && Math.round(value * 100) !== row.planned) {
      run(() =>
        setPlan({ householdId, categoryId: row.categoryId, month, amount: Math.round(value * 100) })
      );
    }
  };

  const saveItem = (name: string, value: number, onSuccess?: () => void) =>
    run(
      () =>
        setPlanItem({
          householdId,
          categoryId: row.categoryId,
          month,
          name,
          amount: Math.round(value * 100),
        }),
      onSuccess
    );

  const addItem = () => {
    if (!itemName.trim()) {
      notifications.show({ message: 'Введите название статьи', color: 'red' });
      return;
    }
    if (typeof itemAmount !== 'number' || itemAmount <= 0) {
      notifications.show({ message: 'Введите сумму', color: 'red' });
      return;
    }
    saveItem(itemName.trim(), itemAmount, () => {
      setItemName('');
      setItemAmount('');
      setAdding(false);
    });
  };

  return (
    <Stack gap="xs">
      <Group gap="sm" wrap="nowrap">
        <CategoryBadge icon={row.icon} color={row.color} size={36} />
        <Text size="sm" fw={500} truncate style={{ flex: 1, minWidth: 0 }}>
          {row.name}
        </Text>
        {hasItems ? (
          <Text size="sm" fw={600} ta="right" w={130} title="Сумма считается по статьям">
            {formatMoney(row.planned)}
          </Text>
        ) : (
          <NumberInput
            aria-label={`План на ${row.name}`}
            placeholder="Сумма"
            w={130}
            defaultValue={row.planned > 0 ? row.planned / 100 : ''}
            onBlur={(e) => saveCategory(parseRubles(e.currentTarget.value))}
            {...numberProps}
          />
        )}
        <ActionIcon
          variant="subtle"
          color="red"
          aria-label="Убрать категорию из плана"
          disabled={pending}
          onClick={() => run(() => removePlan({ householdId, categoryId: row.categoryId, month }))}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>

      <Stack gap="xs" pl={44}>
        {row.items.map((i) => (
          <Group key={i.name} gap="sm" wrap="nowrap">
            <Text size="sm" c="dimmed" truncate style={{ flex: 1, minWidth: 0 }}>
              {i.name}
            </Text>
            <NumberInput
              aria-label={`${i.name}: сумма`}
              size="xs"
              w={130}
              defaultValue={i.planned / 100}
              onBlur={(e) => {
                const value = parseRubles(e.currentTarget.value);
                if (value > 0 && Math.round(value * 100) !== i.planned) saveItem(i.name, value);
              }}
              {...numberProps}
            />
            <ActionIcon
              variant="subtle"
              color="red"
              size="sm"
              aria-label={`Удалить статью ${i.name}`}
              disabled={pending}
              onClick={() =>
                run(() =>
                  removePlanItem({ householdId, categoryId: row.categoryId, month, name: i.name })
                )
              }
            >
              <IconTrash size={14} />
            </ActionIcon>
          </Group>
        ))}

        {adding ? (
          <Group gap="xs" wrap="nowrap" align="flex-start">
            <TextInput
              placeholder="Например, Мобильная связь"
              size="xs"
              maxLength={40}
              value={itemName}
              onChange={(e) => setItemName(e.currentTarget.value)}
              style={{ flex: 1 }}
              data-autofocus
            />
            <NumberInput
              placeholder="0"
              size="xs"
              w={130}
              value={itemAmount}
              onChange={setItemAmount}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
              {...numberProps}
            />
            <Button size="xs" onClick={addItem} loading={pending}>
              Ок
            </Button>
            <ActionIcon
              variant="subtle"
              color="red"
              size={30}
              aria-label="Отменить добавление статьи"
              onClick={() => {
                setItemName('');
                setItemAmount('');
                setAdding(false);
              }}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        ) : (
          <Button
            variant="subtle"
            size="compact-xs"
            leftSection={<IconPlus size={12} />}
            onClick={() => setAdding(true)}
            style={{ alignSelf: 'flex-start' }}
          >
            Добавить статью
          </Button>
        )}
      </Stack>
    </Stack>
  );
}

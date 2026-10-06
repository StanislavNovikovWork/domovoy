'use client';

import { useTransition } from 'react';
import { Button, Modal, NumberInput, SegmentedControl, Select, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { createTransaction } from '@/server/transactions/actions';

type Type = 'expense' | 'income';
export type CategoryOption = { id: string; name: string; type: Type };

type Props = {
  opened: boolean;
  onClose: () => void;
  householdId: string;
  categories: CategoryOption[];
  defaultType: Type;
};

export function AddTransactionModal({ opened, onClose, ...rest }: Props) {
  return (
    <Modal opened={opened} onClose={onClose} title="Новая операция" centered>
      {/* форма внутри модалки: при каждом открытии создаётся заново и сбрасывается */}
      <TransactionForm onClose={onClose} {...rest} />
    </Modal>
  );
}

function TransactionForm({
  onClose,
  householdId,
  categories,
  defaultType,
}: Omit<Props, 'opened'>) {
  const [pending, startTransition] = useTransition();

  const form = useForm({
    initialValues: {
      type: defaultType as Type,
      categoryId: '',
      amount: '' as number | string,
      occurredOn: new Date().toLocaleDateString('sv-SE'), // локальная дата YYYY-MM-DD
      note: '',
    },
    validate: {
      categoryId: (v) => (v ? null : 'Выберите категорию'),
      amount: (v) => (typeof v === 'number' && v > 0 ? null : 'Введите сумму'),
      occurredOn: (v) => (v ? null : 'Укажите дату'),
    },
  });

  const options = categories
    .filter((c) => c.type === form.values.type)
    .map((c) => ({ value: c.id, label: c.name }));

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await createTransaction({
        householdId,
        categoryId: values.categoryId,
        amount: Math.round(Number(values.amount) * 100), // рубли → копейки
        occurredOn: values.occurredOn,
        note: values.note || undefined,
      });

      if (result.ok) {
        notifications.show({ message: 'Операция добавлена', color: 'teal' });
        onClose();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <SegmentedControl
          fullWidth
          value={form.values.type}
          onChange={(v) => {
            form.setFieldValue('type', v as Type);
            form.setFieldValue('categoryId', ''); // категории другого типа не подходят
          }}
          data={[
            { value: 'expense', label: 'Расход' },
            { value: 'income', label: 'Доход' },
          ]}
        />

        <NumberInput
          label="Сумма"
          placeholder="0"
          min={0}
          decimalScale={2}
          decimalSeparator=","
          thousandSeparator=" "
          suffix=" ₽"
          hideControls
          data-autofocus
          {...form.getInputProps('amount')}
        />

        <Select
          label="Категория"
          placeholder="Выберите категорию"
          data={options}
          {...form.getInputProps('categoryId')}
        />

        <TextInput label="Дата" type="date" {...form.getInputProps('occurredOn')} />

        <TextInput
          label="Комментарий"
          placeholder="Необязательно"
          maxLength={200}
          {...form.getInputProps('note')}
        />

        <Button type="submit" loading={pending}>
          Добавить
        </Button>
      </Stack>
    </form>
  );
}
'use client';

import { useState, useTransition } from 'react';
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Popover,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCalendar } from '@tabler/icons-react';
import { createTransaction } from '@/server/transactions/actions';
import { CategoryIcon } from '@/shared/ui/CategoryIcon';
import { formatDate, parseDate } from '@/shared/lib/period';

type Type = 'expense' | 'income';
export type CategoryOption = { id: string; name: string; type: Type; icon: string; color: string };

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

function TransactionForm({ onClose, householdId, categories, defaultType }: Omit<Props, 'opened'>) {
  const [pending, startTransition] = useTransition();
  const [calendarOpened, setCalendarOpened] = useState(false);

  const now = new Date();
  const today = formatDate(now);
  const yesterday = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  const form = useForm({
    initialValues: {
      type: defaultType as Type,
      categoryId: '',
      amount: '' as number | string,
      occurredOn: today,
      note: '',
    },
    validate: {
      categoryId: (v) => (v ? null : 'Выберите категорию'),
      amount: (v) => (typeof v === 'number' && v > 0 ? null : 'Введите сумму'),
    },
  });

  const visibleCategories = categories.filter((c) => c.type === form.values.type);
  const isCustomDate = form.values.occurredOn !== today && form.values.occurredOn !== yesterday;

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

        <div>
          <Text size="sm" fw={500} mb={8}>
            Категория
          </Text>
          <SimpleGrid cols={4} spacing="xs" verticalSpacing="sm">
            {visibleCategories.map((c) => {
              const selected = form.values.categoryId === c.id;
              return (
                <UnstyledButton
                  key={c.id}
                  type="button"
                  onClick={() => form.setFieldValue('categoryId', c.id)}
                  aria-pressed={selected}
                >
                  <Stack gap={4} align="center">
                    <ThemeIcon
                      size={48}
                      radius="xl"
                      color={c.color}
                      variant={selected ? 'filled' : 'light'}
                    >
                      <CategoryIcon name={c.icon} size={22} />
                    </ThemeIcon>
                    <Text size="xs" ta="center" fw={selected ? 600 : 400} lineClamp={2}>
                      {c.name}
                    </Text>
                  </Stack>
                </UnstyledButton>
              );
            })}
          </SimpleGrid>
          {form.errors.categoryId && (
            <Text size="xs" c="red" mt={6}>
              {form.errors.categoryId}
            </Text>
          )}
        </div>

        <div>
          <Text size="sm" fw={500} mb={8}>
            Дата
          </Text>
          <Group gap="xs" grow>
            <Button
              type="button"
              variant={form.values.occurredOn === today ? 'filled' : 'light'}
              onClick={() => form.setFieldValue('occurredOn', today)}
            >
              Сегодня
            </Button>
            <Button
              type="button"
              variant={form.values.occurredOn === yesterday ? 'filled' : 'light'}
              onClick={() => form.setFieldValue('occurredOn', yesterday)}
            >
              Вчера
            </Button>

            <Popover opened={calendarOpened} onChange={setCalendarOpened} position="bottom-end" withArrow>
              <Popover.Target>
                <Button
                  type="button"
                  variant={isCustomDate ? 'filled' : 'light'}
                  leftSection={<IconCalendar size={16} />}
                  onClick={() => setCalendarOpened((o) => !o)}
                >
                  {isCustomDate
                    ? parseDate(form.values.occurredOn).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                      })
                    : 'Календарь'}
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <DatePicker
                  value={form.values.occurredOn}
                  maxDate={today}
                  onChange={(value) => {
                    if (value) {
                      form.setFieldValue('occurredOn', value);
                      setCalendarOpened(false);
                    }
                  }}
                />
              </Popover.Dropdown>
            </Popover>
          </Group>
        </div>

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
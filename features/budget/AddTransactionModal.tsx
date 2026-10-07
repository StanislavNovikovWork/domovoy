'use client';

import { useState, useTransition } from 'react';
import {
  Box,
  Button,
  Chip,
  Group,
  Modal,
  NumberInput,
  Popover,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconCalendar } from '@tabler/icons-react';
import { createTransaction } from '@/server/transactions/actions';
import { formatDate, parseDate } from '@/shared/lib/period';
import type { CategoryOption } from '@/shared/types/category';

export type { CategoryOption };

type Type = 'expense' | 'income';

const TYPES: Type[] = ['expense', 'income'];

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

  const selectedCategory = categories.find((c) => c.id === form.values.categoryId);
  const suggestions = selectedCategory?.suggestions ?? [];
  const isCustomDate = form.values.occurredOn !== today && form.values.occurredOn !== yesterday;

  const selectCategory = (category: CategoryOption) => {
    // если в поле осталась подсказка прежней категории, очищаем её; свой текст не трогаем
    if (selectedCategory?.suggestions.includes(form.values.note)) {
      form.setFieldValue('note', '');
    }
    form.setFieldValue('categoryId', category.id);
  };

  const toggleSuggestion = (text: string) => {
    form.setFieldValue('note', form.values.note === text ? '' : text);
  };

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
            if (selectedCategory?.suggestions.includes(form.values.note)) {
              form.setFieldValue('note', '');
            }
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
          {/* сетки обоих типов лежат в одной grid-ячейке: высота блока не меняется при переключении */}
          <Box style={{ display: 'grid' }}>
            {TYPES.map((type) => {
              const active = type === form.values.type;
              return (
                <SimpleGrid
                  key={type}
                  cols={5}
                  spacing="xs"
                  verticalSpacing="sm"
                  aria-hidden={!active}
                  style={{ gridArea: '1 / 1', visibility: active ? 'visible' : 'hidden' }}
                >
                  {categories
                    .filter((c) => c.type === type)
                    .map((c) => {
                      const selected = form.values.categoryId === c.id;
                      return (
                        <UnstyledButton
                          key={c.id}
                          type="button"
                          onClick={() => selectCategory(c)}
                          aria-pressed={selected}
                        >
                          <Stack gap={4} align="center">
                            <CategoryBadge
                              icon={c.icon}
                              color={c.color}
                              size={56}
                              state={selected ? 'selected' : form.values.categoryId ? 'muted' : 'default'}
                            />
                            <Text size="xs" ta="center" fw={selected ? 600 : 400} lineClamp={2}>
                              {c.name}
                            </Text>
                          </Stack>
                        </UnstyledButton>
                      );
                    })}
                </SimpleGrid>
              );
            })}
          </Box>
          {form.errors.categoryId && (
            <Text size="xs" c="red" mt={6}>
              {form.errors.categoryId}
            </Text>
          )}
        </div>

        <div>
          <Text size="sm" fw={500} mb={8}>
            Что конкретно
          </Text>
          {suggestions.length > 0 && (
            <Group gap="xs" mb="xs">
              {suggestions.map((s) => (
                <Chip
                  key={s}
                  size="xs"
                  variant="light"
                  color={selectedCategory?.color}
                  checked={form.values.note === s}
                  onChange={() => toggleSuggestion(s)}
                >
                  {s}
                </Chip>
              ))}
            </Group>
          )}
          <TextInput
            aria-label="Что конкретно"
            placeholder={suggestions.length > 0 ? 'Выберите выше или напишите своё' : 'Необязательно'}
            maxLength={200}
            {...form.getInputProps('note')}
          />
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

        <Button type="submit" loading={pending}>
          Добавить
        </Button>
      </Stack>
    </form>
  );
}
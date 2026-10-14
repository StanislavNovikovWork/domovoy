'use client';

import { useState } from 'react';
import { IconCalendar, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Chip,
  Group,
  Input,
  Modal,
  NumberInput,
  Popover,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import type { TransactionItem } from '@/shared/lib/budget';
import { formatDate, parseDate } from '@/shared/lib/period';
import type { CreateTransactionInput } from '@/shared/schemas/transaction';
import type { CategoryOption } from '@/shared/types/category';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';

export type { CategoryOption };

type Type = 'expense' | 'income';

const TYPES: Type[] = ['expense', 'income'];

export type ShareParticipant = { userId: string; name: string };

export type SaveTransactionRequest = {
  // id редактируемой операции; без него создаётся новая
  editingId?: string;
  // данные для сервера
  payload: Omit<CreateTransactionInput, 'id'>;
  // то же для мгновенного показа в списке
  item: TransactionItem;
};

type Props = {
  opened: boolean;
  onClose: () => void;
  householdId: string;
  categories: CategoryOption[];
  /** члены бюджета; если переданы, под суммой появляется блок «участники расхода» */
  members?: ShareParticipant[];
  /** участники без аккаунта, сохранённые в бюджете */
  guestNames?: string[];
  /** текущий пользователь: плательщик по умолчанию */
  currentUserId?: string;
  defaultType: Type;
  /** разовый бюджет: только расходы, переключателя типа нет */
  expenseOnly?: boolean;
  /** предзаполнение формы, например при оплате статьи плана; amount в рублях */
  prefill?: { categoryId: string; note: string; amount: number } | null;
  /** редактирование существующей операции: форма заполняется её данными */
  editing?: TransactionItem | null;
  /** сохранение операции: родитель показывает её сразу и отправляет запрос в фоне */
  onSave: (request: SaveTransactionRequest) => void;
};

export function AddTransactionModal({ opened, onClose, ...rest }: Props) {
  // на мобильных форма выезжает снизу на всю ширину, без отступов, с закруглёнными верхними углами
  const isMobile = useMediaQuery('(max-width: 47.99375em)');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={rest.editing ? 'Редактирование операции' : 'Новая операция'}
      // при редактировании форма открывается поверх окна «Все операции» (200); календарь и списки выше (300)
      zIndex={rest.editing ? 250 : undefined}
      centered={!isMobile}
      size={isMobile ? '100%' : undefined}
      xOffset={isMobile ? 0 : undefined}
      yOffset={isMobile ? 0 : undefined}
      transitionProps={isMobile ? { transition: 'slide-up' } : undefined}
      styles={
        isMobile
          ? {
              inner: { alignItems: 'flex-end' },
              content: {
                width: '100%',
                maxWidth: '100%',
                // svh, не dvh: динамическая высота меняется при скрытии адресной строки,
                // а её пересчёт со скроллом к селекту уходит в цикл — мерцает вся форма
                maxHeight: '92svh',
                borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0',
              },
              body: { paddingBottom: 'max(var(--mantine-spacing-md), env(safe-area-inset-bottom))' },
            }
          : undefined
      }
    >
      {/* форма внутри модалки: при каждом открытии создаётся заново и сбрасывается */}
      <TransactionForm onClose={onClose} {...rest} />
    </Modal>
  );
}

type Share = { userId: string | null; name: string; amount: number | string };

function TransactionForm({
  onClose,
  householdId,
  categories,
  members,
  guestNames,
  currentUserId,
  defaultType,
  expenseOnly,
  prefill,
  editing,
  onSave,
}: Omit<Props, 'opened'>) {
  const [calendarOpened, setCalendarOpened] = useState(false);
  // гости редактируемой операции, которых уже нет среди гостей бюджета (например, удалены)
  const customNames: string[] = editing
    ? [
        ...(editing.shares ?? []).filter((s) => !s.userId).map((s) => s.name),
        ...(!editing.paidByUserId && editing.paidByName ? [editing.paidByName] : []),
      ]
    : [];

  const now = new Date();
  const today = formatDate(now);
  const yesterday = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));

  // в разовом бюджете категорию не спрашиваем: любой расход уходит в «Прочее»
  const miscCategoryId =
    (expenseOnly &&
      (categories.find((c) => c.name === 'Прочее' && c.type === 'expense')?.id ??
        categories.find((c) => c.type === 'expense')?.id)) ||
    '';

  const form = useForm({
    initialValues: editing
      ? {
          type: editing.categoryType as Type,
          categoryId: editing.categoryId,
          amount: editing.amount / 100 as number | string,
          occurredOn: editing.occurredOn,
          note: editing.note ?? '',
          shares: (editing.shares ?? []).map((s) => ({
            userId: s.userId,
            name: s.name,
            amount: s.amount / 100,
          })) as Share[],
          paidBy:
            editing.paidByUserId ??
            (editing.paidByName ? `~${editing.paidByName}` : (currentUserId ?? '')),
        }
      : {
          type: (prefill ? 'expense' : defaultType) as Type,
          categoryId: prefill?.categoryId ?? miscCategoryId,
          amount: (prefill?.amount ?? '') as number | string,
          occurredOn: today,
          note: prefill?.note ?? '',
          shares: [] as Share[],
          // кто платил: userId члена бюджета или «~имя» гостя; по умолчанию автор
          paidBy: currentUserId ?? '',
        },
    validate: {
      categoryId: (v) => (v ? null : 'Выберите категорию'),
      amount: (v) => (typeof v === 'number' && v > 0 ? null : 'Введите сумму'),
      note: (v) => (v.trim() ? null : 'Укажите, что конкретно'),
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

  // участники: члены бюджета + сохранённые гости + только что вписанные имена (без повторов)
  const guestList = [...(guestNames ?? [])];
  for (const n of customNames) {
    if (!guestList.some((g) => g.toLowerCase() === n.toLowerCase())) guestList.push(n);
  }
  const people: { userId: string | null; name: string }[] = [
    ...(members ?? []),
    ...guestList.map((name) => ({ userId: null, name })),
  ];
  const shareKey = (s: { userId: string | null; name: string }) => s.userId ?? `~${s.name}`;
  // плательщиком может быть любой участник: член бюджета или гость
  const payers = people;
  const payerKey = shareKey;

  const toggleShare = (person: { userId: string | null; name: string }) => {
    const index = form.values.shares.findIndex((s) => shareKey(s) === shareKey(person));
    if (index >= 0) {
      form.removeListItem('shares', index);
    } else {
      form.insertListItem('shares', { ...person, amount: '' });
    }
  };

  // делит общую сумму между выбранными участниками поровну; лишние копейки достаются первым
  const splitEvenly = () => {
    const total = form.values.amount;
    if (typeof total !== 'number' || total <= 0) {
      notifications.show({ message: 'Сначала введите сумму', color: 'red' });
      return;
    }
    const count = form.values.shares.length;
    const kopecks = Math.round(total * 100);
    const base = Math.floor(kopecks / count);
    const extra = kopecks - base * count;
    form.values.shares.forEach((_, i) => {
      form.setFieldValue(`shares.${i}.amount`, (base + (i < extra ? 1 : 0)) / 100);
    });
  };

  const handleSubmit = form.onSubmit((values) => {
    for (const s of values.shares) {
      if (typeof s.amount !== 'number' || s.amount <= 0) {
        notifications.show({ message: `Введите сумму для ${s.name}`, color: 'red' });
        return;
      }
    }
    const amount = Math.round(Number(values.amount) * 100); // рубли → копейки
    const paidBy = members ? payers.find((p) => payerKey(p) === values.paidBy) : undefined;
    const shares = values.shares.map((s) => ({
      userId: s.userId,
      name: s.name,
      amount: Math.round(Number(s.amount) * 100),
    }));
    const category = categories.find((c) => c.id === values.categoryId);
    if (!category) return;

    // без выбранных участников сервер записывает расход на автора: показываем так же сразу
    const me = members?.find((m) => m.userId === currentUserId);
    const shownShares =
      shares.length === 0 && me ? [{ userId: me.userId, name: me.name, amount }] : shares;

    // операция уходит наверх и сохраняется в фоне, форма закрывается сразу
    onSave({
      editingId: editing?.id,
      payload: {
        householdId,
        categoryId: values.categoryId,
        amount,
        occurredOn: values.occurredOn,
        note: values.note.trim(),
        paidBy,
        shares,
      },
      item: {
        id: editing?.id ?? crypto.randomUUID(),
        amount,
        occurredOn: values.occurredOn,
        note: values.note.trim(),
        paidByUserId: paidBy?.userId ?? null,
        paidByName: paidBy?.name ?? null,
        shares: members ? shownShares : undefined,
        categoryId: category.id,
        categoryName: category.name,
        categoryType: category.type,
        categoryIcon: category.icon,
        categoryColor: category.color,
      },
    });
    onClose();
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        {!expenseOnly && (
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
        )}

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

        {members && (
          <Select
            label="Кто платил"
            data={payers.map((p) => ({ value: payerKey(p), label: p.name }))}
            allowDeselect={false}
            // без портала: дропдаун внутри модалки, иначе у края нижней шторки
            // перепозиционирование уходит в цикл и мерцает вся форма (mantine#8255)
            comboboxProps={{ withinPortal: false, position: 'bottom', middlewares: { flip: false } }}
            {...form.getInputProps('paidBy')}
          />
        )}

        {/* участники расхода: только в разовых бюджетах (members переданы) */}
        {members && (
          <div>
            <Group justify="space-between" align="center" mb={8} mih={22}>
              <Text size="sm" fw={500}>
                Участники расхода
              </Text>
              {form.values.shares.length >= 2 && (
                <Button type="button" variant="light" size="compact-xs" onClick={splitEvenly}>
                  Поровну
                </Button>
              )}
            </Group>
            <Stack gap={0} mb="xs">
              {people.map((p) => {
                const i = form.values.shares.findIndex((s) => shareKey(s) === shareKey(p));
                const share = i >= 0 ? form.values.shares[i] : null;
                return (
                  // mih под высоту инпута: строка не прыгает, когда он появляется
                  <Group key={shareKey(p)} gap="xs" wrap="nowrap" mih={26}>
                    <UnstyledButton
                      type="button"
                      onClick={() => toggleShare(p)}
                      style={{ flex: 1, minWidth: 0 }}
                    >
                      <Text size="sm" c={share ? undefined : 'dimmed'} truncate>
                        {p.name}
                      </Text>
                    </UnstyledButton>
                    {share && (
                      <>
                        <NumberInput
                          size="xs"
                          variant="unstyled"
                          w={120}
                          placeholder="Сумма"
                          min={0}
                          decimalScale={2}
                          decimalSeparator=","
                          thousandSeparator=" "
                          suffix=" ₽"
                          hideControls
                          aria-label={`Сумма: ${share.name}`}
                          styles={{ input: { height: 26, minHeight: 26 } }}
                          value={share.amount}
                          onChange={(v) => form.setFieldValue(`shares.${i}.amount`, v)}
                          onFocus={() => {
                            // единственный незаполненный участник: подставляем остаток от общей суммы
                            if (share.amount !== '' || typeof form.values.amount !== 'number')
                              return;
                            const others = form.values.shares.filter((_, j) => j !== i);
                            if (others.length === 0 || others.some((s) => typeof s.amount !== 'number' || s.amount <= 0))
                              return;
                            const rest =
                              form.values.amount -
                              others.reduce((acc, s) => acc + (s.amount as number), 0);
                            if (rest > 0) form.setFieldValue(`shares.${i}.amount`, rest);
                          }}
                        />
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size={26}
                          aria-label={`Убрать ${share.name}`}
                          onClick={() => form.removeListItem('shares', i)}
                        >
                          <IconTrash size={14} />
                        </ActionIcon>
                      </>
                    )}
                  </Group>
                );
              })}
            </Stack>
          </div>
        )}

        {/* в разовом бюджете категорий нет: всё уходит в «Прочее» */}
        {!expenseOnly && (
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
                              state={
                                selected ? 'selected' : form.values.categoryId ? 'muted' : 'default'
                              }
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
        )}

        <div>
          <Input.Label required mb={8}>
            Что конкретно
          </Input.Label>
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
            placeholder={
              suggestions.length > 0
                ? 'Выберите выше или напишите своё'
                : 'Например, Продукты в Пятёрочке'
            }
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

            <Popover
              opened={calendarOpened}
              onChange={setCalendarOpened}
              position="bottom-end"
              withArrow
            >
              <Popover.Target>
                <Button
                  type="button"
                  variant={isCustomDate ? 'filled' : 'light'}
                  aria-label="Выбрать дату"
                  px={isCustomDate ? undefined : 10}
                  onClick={() => setCalendarOpened((o) => !o)}
                >
                  {isCustomDate ? (
                    parseDate(form.values.occurredOn).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })
                  ) : (
                    <IconCalendar size={18} />
                  )}
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

        <Button type="submit">
          {editing ? 'Сохранить' : 'Добавить'}
        </Button>
      </Stack>
    </form>
  );
}

'use client';

import { useMemo, useOptimistic, useState, useTransition } from 'react';
import { IconChevronLeft, IconChevronRight, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { PageTopBar } from '@/features/app-shell';
import { createEvent, deleteEvent, updateEvent } from '@/server/calendar/actions';
import type { CalendarEventItem } from '@/server/calendar/queries';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { useMobileModal } from '@/shared/ui/useMobileModal';

type Props = {
  householdId: string;
  currentUserId: string;
  events: CalendarEventItem[];
};

type Action =
  | { type: 'add'; item: CalendarEventItem }
  | { type: 'update'; item: CalendarEventItem }
  | { type: 'remove'; id: string };

// месяцы и даты в русских названиях
dayjs.locale('ru');

const byDate = (items: CalendarEventItem[]) =>
  [...items].sort((a, b) => a.eventDate.localeCompare(b.eventDate));

// календарь пространства: точки на днях с событиями, под календарём список за выбранный день
export function CalendarView({ householdId, currentUserId, events }: Props) {
  const mobileModal = useMobileModal();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<string>(dayjs().format('YYYY-MM-DD'));
  // показанный месяц десктопной сетки (YYYY-MM-01)
  const [month, setMonth] = useState<string>(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [addOpened, setAddOpened] = useState(false);
  const [editing, setEditing] = useState<CalendarEventItem | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<CalendarEventItem | null>(null);

  const [items, apply] = useOptimistic(events, (state, action: Action): CalendarEventItem[] => {
    switch (action.type) {
      case 'add':
        return byDate([action.item, ...state]);
      case 'update':
        return byDate(state.map((e) => (e.id === action.item.id ? action.item : e)));
      case 'remove':
        return state.filter((e) => e.id !== action.id);
    }
  });

  // даты с событиями для точек на календаре
  const daysWithEvents = useMemo(() => new Set(items.map((e) => e.eventDate)), [items]);
  const dayEvents = items.filter((e) => e.eventDate === selected);
  const selectedLabel = dayjs(selected).format('D MMMM YYYY');

  const openAdd = () => {
    setEditing(null);
    setTitle('');
    setTime('');
    setAddOpened(true);
  };

  const openEdit = (e: CalendarEventItem) => {
    setEditing(e);
    setTitle(e.title);
    setTime(e.eventTime?.slice(0, 5) ?? '');
    setAddOpened(true);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const event = editing;
    const id = event?.id ?? crypto.randomUUID();
    setAddOpened(false);
    startTransition(async () => {
      const item: CalendarEventItem = {
        id,
        title: trimmed,
        eventDate: event?.eventDate ?? selected,
        eventTime: time || null,
        createdBy: event?.createdBy ?? currentUserId,
      };
      apply({ type: event ? 'update' : 'add', item });
      const payload = {
        id,
        householdId,
        title: trimmed,
        eventDate: item.eventDate,
        eventTime: time || undefined,
      };
      const result = event ? await updateEvent(payload) : await createEvent(payload);
      if (!result.ok) notifications.show({ message: result.error, color: 'red' });
    });
  };

  const remove = (id: string) =>
    startTransition(async () => {
      apply({ type: 'remove', id });
      const result = await deleteEvent({ householdId, id });
      if (!result.ok) notifications.show({ message: result.error, color: 'red' });
    });

  return (
    <Stack gap="lg" maw={{ base: 560, lg: '100%' }}>
      {/* шапка только на мобильном: на десктопе раздел в боковом меню, «+» не нужен */}
      <Box hiddenFrom="md">
        <PageTopBar
          backHref={`/budgets/${householdId}`}
          backLabel="К пространству"
          title="Календарь"
          right={
            <ActionIcon size="lg" radius="xl" aria-label="Добавить событие" onClick={openAdd}>
              <IconPlus size={20} />
            </ActionIcon>
          }
        />
      </Box>

      {/* мобильный вид: компактный календарь с точками */}
      <Box hiddenFrom="md">
        <DatePicker
          firstDayOfWeek={1}
          locale="ru"
          value={selected}
          onChange={(d) => d && setSelected(d)}
          renderDay={(date) => (
            <Stack gap={0} align="center">
              <div>{dayjs(date).date()}</div>
              {daysWithEvents.has(date) && (
                <Box w={5} h={5} bg="blue" style={{ borderRadius: '50%' }} />
              )}
            </Stack>
          )}
        />
      </Box>

      {/* десктопный вид: месячная сетка на весь экран, события внутри плиток дней */}
      <Box visibleFrom="md">
        <MonthGrid
          month={month}
          onMonthChange={(dir) =>
            setMonth(dayjs(month).add(dir, 'month').startOf('month').format('YYYY-MM-DD'))
          }
          selected={selected}
          onSelect={setSelected}
          items={items}
        />
      </Box>

      {/* события выбранного дня */}
      <Stack gap="xs">
        <Text fw={600}>{selectedLabel}</Text>
        {dayEvents.length === 0 ? (
          <Text size="sm" c="dimmed">
            На этот день событий нет
          </Text>
        ) : (
          dayEvents.map((e) => (
            <Group key={e.id} justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                {e.eventTime && (
                  <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {e.eventTime.slice(0, 5)}
                  </Text>
                )}
                <Text size="sm" style={{ minWidth: 0 }}>
                  {e.title}
                </Text>
              </Group>
              <Group gap={4} wrap="nowrap">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label="Изменить событие"
                  onClick={() => openEdit(e)}
                >
                  <IconPencil size={16} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label="Удалить событие"
                  onClick={() => setConfirmDelete(e)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Group>
            </Group>
          ))
        )}
        <Button variant="light" size="xs" leftSection={<IconPlus size={14} />} onClick={openAdd} style={{ alignSelf: 'flex-start' }}>
          Добавить событие
        </Button>
      </Stack>

      <Modal
        opened={addOpened}
        onClose={() => setAddOpened(false)}
        title={editing ? 'Изменить событие' : 'Новое событие'}
        {...mobileModal}
      >
        <form onSubmit={submit}>
          <Stack>
            <TextInput
              label="Название"
              placeholder="Например, День рождения"
              maxLength={120}
              data-autofocus
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
            />
            <TextInput
              label="Время"
              type="time"
              value={time}
              onChange={(e) => setTime(e.currentTarget.value)}
            />
            <Text size="sm" c="dimmed">
              {selectedLabel}
            </Text>
            <Button type="submit" disabled={!title.trim()}>
              {editing ? 'Сохранить' : 'Добавить'}
            </Button>
          </Stack>
        </form>
      </Modal>

      <ConfirmModal
        opened={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Удалить событие?"
        text={`«${confirmDelete?.title}» будет удалено.`}
        onConfirm={() => {
          const e = confirmDelete;
          setConfirmDelete(null);
          if (e) remove(e.id);
        }}
      />
    </Stack>
  );
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const CELL_BORDER = '1px solid var(--mantine-color-default-border)';

// десктопная месячная сетка: каждый день — большая плитка с событиями внутри
function MonthGrid({
  month,
  onMonthChange,
  selected,
  onSelect,
  items,
}: {
  month: string; // YYYY-MM-01
  onMonthChange: (dir: 1 | -1) => void;
  selected: string;
  onSelect: (date: string) => void;
  items: CalendarEventItem[];
}) {
  const start = dayjs(month).startOf('month');
  // неделя с понедельника: смещение первой ячейки назад до пн
  const offset = (start.day() + 6) % 7;
  const cellCount = Math.ceil((offset + start.daysInMonth()) / 7) * 7;
  const cells = useMemo(
    () =>
      Array.from({ length: cellCount }, (_, i) =>
        start.subtract(offset, 'day').add(i, 'day').format('YYYY-MM-DD')
      ),
    [month] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // события по дням
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEventItem[]>();
    for (const e of items) {
      const list = map.get(e.eventDate) ?? [];
      list.push(e);
      map.set(e.eventDate, list);
    }
    return map;
  }, [items]);

  const today = dayjs().format('YYYY-MM-DD');

  return (
    <Stack gap="xs">
      <Group justify="space-between" wrap="nowrap">
        <Text fw={700} size="lg" tt="capitalize">
          {dayjs(month).format('MMMM YYYY')}
        </Text>
        <Group gap={4} wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Прошлый месяц"
            onClick={() => onMonthChange(-1)}
          >
            <IconChevronLeft size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Следующий месяц"
            onClick={() => onMonthChange(1)}
          >
            <IconChevronRight size={18} />
          </ActionIcon>
        </Group>
      </Group>

      <SimpleGrid cols={7} spacing={0}>
        {WEEKDAYS.map((d) => (
          <Text key={d} size="xs" c="dimmed" ta="center" py={4}>
            {d}
          </Text>
        ))}
      </SimpleGrid>

      <SimpleGrid cols={7} spacing={0}>
        {cells.map((date) => {
          const inMonth = dayjs(date).isSame(start, 'month');
          const dayEvents = byDay.get(date) ?? [];
          const isSelected = date === selected;
          const isToday = date === today;
          return (
            <Box
              key={date}
              component="button"
              type="button"
              onClick={() => onSelect(date)}
              mih={110}
              p={6}
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                border: CELL_BORDER,
                margin: '-0.5px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                background: isSelected
                  ? 'var(--mantine-color-blue-light)'
                  : 'transparent',
              }}
            >
              <Text
                size="sm"
                fw={isToday ? 700 : 500}
                c={inMonth ? (isToday ? 'blue' : undefined) : 'dimmed'}
                mb={4}
              >
                {dayjs(date).date()}
              </Text>
              <Stack gap={2} w="100%">
                {dayEvents.slice(0, 3).map((e) => (
                  <Text
                    key={e.id}
                    size="xs"
                    truncate
                    px={4}
                    py={1}
                    style={{
                      borderRadius: 'var(--mantine-radius-sm)',
                      background: 'var(--mantine-color-blue-light)',
                      color: 'var(--mantine-color-blue-light-color)',
                    }}
                  >
                    {e.eventTime ? `${e.eventTime.slice(0, 5)} ${e.title}` : e.title}
                  </Text>
                ))}
                {dayEvents.length > 3 && (
                  <Text size="xs" c="dimmed">
                    +{dayEvents.length - 3} ещё
                  </Text>
                )}
              </Stack>
            </Box>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

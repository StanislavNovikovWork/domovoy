'use client';

import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { notifications } from '@mantine/notifications';
import { PageTopBar } from '@/features/app-shell';
import {
  addItem,
  deleteItem,
  deleteList,
  renameList,
  toggleItem,
} from '@/server/checklists/actions';
import type { ChecklistItemRow } from '@/server/checklists/queries';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { useMobileModal } from '@/shared/ui/useMobileModal';

dayjs.locale('ru');

type Props = {
  householdId: string;
  list: { id: string; title: string; kind: string };
  items: ChecklistItemRow[];
};

type Action =
  | { type: 'add'; item: ChecklistItemRow }
  | { type: 'toggle'; id: string; done: boolean }
  | { type: 'remove'; id: string };

// страница списка: пункты с чекбоксами, у покупок количество, у задач дата
export function ListView({ householdId, list, items }: Props) {
  const router = useRouter();
  const mobileModal = useMobileModal();
  const [, startTransition] = useTransition();
  const isShopping = list.kind === 'shopping';

  const [title, setTitle] = useState('');
  const [quantity, setQuantity] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [renameOpened, setRenameOpened] = useState(false);
  const [newTitle, setNewTitle] = useState(list.title);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [rows, apply] = useOptimistic(items, (state, action: Action): ChecklistItemRow[] => {
    switch (action.type) {
      case 'add':
        return [...state, action.item];
      case 'toggle':
        // выполненные уезжают в конец списка
        return state
          .map((r) => (r.id === action.id ? { ...r, done: action.done } : r))
          .sort((a, b) => Number(a.done) - Number(b.done));
      case 'remove':
        return state.filter((r) => r.id !== action.id);
    }
  });

  const add = (ev: React.FormEvent) => {
    ev.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const item: ChecklistItemRow = {
      id: crypto.randomUUID(),
      title: trimmed,
      done: false,
      quantity: isShopping && quantity.trim() ? quantity.trim() : null,
      dueDate: !isShopping && dueDate ? dueDate : null,
      createdBy: null,
    };
    setTitle('');
    setQuantity('');
    setDueDate('');
    startTransition(async () => {
      apply({ type: 'add', item });
      const result = await addItem({
        id: item.id,
        householdId,
        listId: list.id,
        title: trimmed,
        quantity: item.quantity ?? undefined,
        dueDate: item.dueDate ?? undefined,
      });
      if (!result.ok) notifications.show({ message: result.error, color: 'red' });
    });
  };

  const toggle = (row: ChecklistItemRow) =>
    startTransition(async () => {
      apply({ type: 'toggle', id: row.id, done: !row.done });
      await toggleItem({ householdId, listId: list.id, itemId: row.id, done: !row.done });
    });

  const remove = (id: string) =>
    startTransition(async () => {
      apply({ type: 'remove', id });
      await deleteItem({ householdId, listId: list.id, itemId: id });
    });

  const rename = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed || trimmed === list.title) {
      setRenameOpened(false);
      return;
    }
    const result = await renameList({ householdId, listId: list.id, title: trimmed });
    if (!result.ok) notifications.show({ message: result.error, color: 'red' });
    setRenameOpened(false);
    router.refresh();
  };

  const removeList = async () => {
    setConfirmDelete(false);
    await deleteList({ householdId, listId: list.id });
    router.push(`/budgets/${householdId}/lists`);
    router.refresh();
  };

  return (
    <Stack gap="lg" maw={560}>
      <PageTopBar
        backHref={`/budgets/${householdId}/lists`}
        backLabel="К спискам"
        title={list.title}
        right={
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              size="lg"
              radius="xl"
              variant="subtle"
              color="gray"
              aria-label="Переименовать список"
              onClick={() => {
                setNewTitle(list.title);
                setRenameOpened(true);
              }}
            >
              <IconPencil size={18} />
            </ActionIcon>
            <ActionIcon
              size="lg"
              radius="xl"
              variant="subtle"
              color="red"
              aria-label="Удалить список"
              onClick={() => setConfirmDelete(true)}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        }
      />

      {/* добавление пункта: название + количество (покупки) или дата (задачи) */}
      <Box component="form" onSubmit={add}>
        <Group gap="sm" wrap="nowrap">
          <TextInput
            placeholder={isShopping ? 'Что купить?' : 'Новая задача'}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          {isShopping ? (
            <TextInput
              placeholder="Кол-во"
              w={100}
              value={quantity}
              onChange={(e) => setQuantity(e.currentTarget.value)}
            />
          ) : (
            <TextInput type="date" w={150} value={dueDate} onChange={(e) => setDueDate(e.currentTarget.value)} />
          )}
          <ActionIcon
            type="submit"
            size="lg"
            radius="xl"
            variant="filled"
            disabled={!title.trim()}
            aria-label="Добавить пункт"
          >
            <IconPlus size={18} />
          </ActionIcon>
        </Group>
      </Box>

      <Stack gap={0}>
        {rows.length === 0 && (
          <Text size="sm" c="dimmed">
            Список пуст
          </Text>
        )}
        {rows.map((row) => (
          <Group
            key={row.id}
            gap="sm"
            wrap="nowrap"
            py={6}
            style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
          >
            <Checkbox
              checked={row.done}
              onChange={() => toggle(row)}
              aria-label={row.done ? 'Снять отметку' : 'Отметить выполненным'}
            />
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text
                size="sm"
                td={row.done ? 'line-through' : undefined}
                c={row.done ? 'dimmed' : undefined}
              >
                {row.title}
              </Text>
              {(row.quantity || row.dueDate) && (
                <Text size="xs" c="dimmed">
                  {row.quantity ?? dayjs(row.dueDate).format('D MMMM')}
                </Text>
              )}
            </Box>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label="Удалить пункт"
              onClick={() => remove(row.id)}
            >
              <IconTrash size={15} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>

      <Modal
        opened={renameOpened}
        onClose={() => setRenameOpened(false)}
        title="Переименовать список"
        {...mobileModal}
      >
        <Stack>
          <TextInput
            label="Название"
            maxLength={80}
            data-autofocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && rename()}
          />
          <Button onClick={rename} disabled={!newTitle.trim()}>
            Сохранить
          </Button>
        </Stack>
      </Modal>

      <ConfirmModal
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Удалить список?"
        text={`Список «${list.title}» и все его пункты будут удалены.`}
        onConfirm={removeList}
      />
    </Stack>
  );
}

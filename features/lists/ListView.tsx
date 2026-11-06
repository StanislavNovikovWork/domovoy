'use client';

import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useOptimistic, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { IconPencil, IconArrowUp, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Checkbox,
  Group,
  Modal,
  Stack,
  Tabs,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { PageTopBar } from '@/features/app-shell';
import {
  addItem,
  addPreset,
  deleteItem,
  deletePreset,
  deleteList,
  renameList,
  toggleItem,
} from '@/server/checklists/actions';
import type { ChecklistItemRow, ShoppingPresetRow } from '@/server/checklists/queries';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { useMobileModal } from '@/shared/ui/useMobileModal';

dayjs.locale('ru');

type Props = {
  householdId: string;
  list: { id: string; title: string; kind: string };
  items: ChecklistItemRow[];
  presets: ShoppingPresetRow[];
};

type Action =
  | { type: 'add'; item: ChecklistItemRow }
  | { type: 'toggle'; id: string; done: boolean }
  | { type: 'remove'; id: string };

// страница списка: пункты с чекбоксами, у покупок количество, у задач дата
export function ListView({ householdId, list, items, presets }: Props) {
  const router = useRouter();
  const mobileModal = useMobileModal();
  const [, startTransition] = useTransition();
  const isShopping = list.kind === 'shopping';
  const isDesktop = useMediaQuery('(min-width: 62em)');
  const [tab, setTab] = useState<string | null>('list');

  const [title, setTitle] = useState('');
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
      quantity: null,
      dueDate: !isShopping && dueDate ? dueDate : null,
      createdBy: null,
    };
    setTitle('');
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

  const addFromPreset = (preset: ShoppingPresetRow) => {
    const item: ChecklistItemRow = {
      id: crypto.randomUUID(),
      title: preset.title,
      done: false,
      quantity: preset.quantity,
      dueDate: null,
      createdBy: null,
    };
    startTransition(async () => {
      apply({ type: 'add', item });
      notifications.show({ message: `«${preset.title}» добавлено в список`, color: 'teal' });
      const result = await addItem({
        id: item.id,
        householdId,
        listId: list.id,
        title: item.title,
        quantity: item.quantity ?? undefined,
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

  const listBlock = (
    <>
      {/* добавление пункта: название + количество (покупки) или дата (задачи) */}
      <Box component="form" onSubmit={add}>
        <Group gap="sm" wrap="nowrap">
          <TextInput
            variant="unstyled"
            placeholder={isShopping ? '+ Добавить пункт' : '+ Новая задача'}
            styles={{ input: { '::placeholder': { fontSize: '1.1em' } } }}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          {!isShopping && (
            <TextInput
              type="date"
              w={150}
              value={dueDate}
              onChange={(e) => setDueDate(e.currentTarget.value)}
            />
          )}
          <ActionIcon
            type="submit"
            size="lg"
            radius="xl"
            variant="filled"
            disabled={!title.trim()}
            aria-label="Добавить пункт"
          >
            <IconArrowUp size={18} />
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
    </>
  );

  const topBar = (
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
  );

  return (
    <Stack gap="xs" maw={isShopping && isDesktop ? 960 : 560}>
      {!(isShopping && isDesktop) && topBar}

      {isShopping && !isDesktop && (
        <Tabs value={tab} onChange={setTab}>
          <Tabs.List grow>
            <Tabs.Tab value="list">Список</Tabs.Tab>
            <Tabs.Tab value="presets">Заготовки</Tabs.Tab>
          </Tabs.List>
        </Tabs>
      )}

      {isShopping && isDesktop ? (
        <Group align="flex-start" gap="xl" wrap="nowrap">
          <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
            {topBar}
            {listBlock}
          </Stack>
          <Box w={320} style={{ flexShrink: 0 }}>
            <PresetsPanel showTitle householdId={householdId} presets={presets} onPick={addFromPreset} />
          </Box>
        </Group>
      ) : isShopping && tab === 'presets' ? (
        <PresetsPanel
          householdId={householdId}
          presets={presets}
          onPick={addFromPreset}
        />
      ) : (
        listBlock
      )}

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

// заготовки покупок: клик по позиции добавляет её в список
function PresetsPanel({
  householdId,
  presets,
  onPick,
  showTitle = false,
}: {
  showTitle?: boolean;
  householdId: string;
  presets: ShoppingPresetRow[];
  onPick: (preset: ShoppingPresetRow) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [title, setTitle] = useState('');

  const add = (ev: React.FormEvent) => {
    ev.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setTitle('');
    startTransition(async () => {
      const result = await addPreset({ householdId, title: trimmed });
      if (!result.ok) notifications.show({ message: result.error, color: 'red' });
      router.refresh();
    });
  };

  const remove = (id: string) =>
    startTransition(async () => {
      await deletePreset({ householdId, presetId: id });
      router.refresh();
    });

  return (
    <Stack gap="xs">
      {showTitle && (
        <Group h={34} align="center">
          <Text fw={600}>Заготовки</Text>
        </Group>
      )}
      <Box component="form" onSubmit={add}>
        <Group gap="sm" wrap="nowrap">
          <TextInput
            variant="unstyled"
            placeholder="+ Добавить заготовку"
            styles={{ input: { '::placeholder': { fontSize: '1.1em' } } }}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <ActionIcon
            type="submit"
            size="lg"
            radius="xl"
            disabled={!title.trim()}
            aria-label="Добавить заготовку"
          >
            <IconArrowUp size={18} />
          </ActionIcon>
        </Group>
      </Box>
      {presets.length === 0 && (
        <Text size="sm" c="dimmed">
          Добавьте позиции, которые часто покупаете
        </Text>
      )}
      <Stack gap={0}>
        {presets.map((p) => (
          <Group
            key={p.id}
            gap="sm"
            wrap="nowrap"
            py={6}
            style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
          >
            <UnstyledButton
              onClick={() => onPick(p)}
              style={{ flex: 1, minWidth: 0 }}
              aria-label={`Добавить в список: ${p.title}`}
            >
              <Text size="sm">{p.title}</Text>
              {p.quantity && (
                <Text size="xs" c="dimmed">
                  {p.quantity}
                </Text>
              )}
            </UnstyledButton>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label="Удалить заготовку"
              onClick={() => remove(p.id)}
            >
              <IconTrash size={15} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>
    </Stack>
  );
}

'use client';

import { useOptimistic, useState, useTransition } from 'react';
import {
  IconConfetti,
  IconHeart,
  IconHeartFilled,
  IconMapPin,
  IconPencil,
  IconPlus,
  IconToolsKitchen2,
  IconTrash,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { PageTopBar } from '@/features/app-shell';
import { createPlace, deletePlace, togglePlaceLike, updatePlace } from '@/server/places/actions';
import type { PlaceItem } from '@/server/places/queries';
import { PLACE_KINDS, type PlaceKind } from '@/shared/config/place-kinds';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { useMobileModal } from '@/shared/ui/useMobileModal';

type Props = {
  householdId: string;
  currentUserId: string;
  role: 'owner' | 'member';
  places: PlaceItem[];
};

type Action =
  | { type: 'add'; item: PlaceItem }
  | { type: 'update'; item: PlaceItem }
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string };

const kindOf = (value: string) => PLACE_KINDS.find((k) => k.value === value) ?? PLACE_KINDS[PLACE_KINDS.length - 1];

// иконка вида места: еда, развлечения, остальное
function KindIcon({ kind }: { kind: string }) {
  if (kind === 'food') return <IconToolsKitchen2 size={22} />;
  if (kind === 'fun') return <IconConfetti size={22} />;
  return <IconMapPin size={22} />;
}

// ссылку можно вставить вместе с адресом: вытаскиваем её из строки, остальное не показываем
const extractUrl = (value: string) => value.match(/https?:\/\/\S+/i)?.[0] ?? null;

// больше лайков выше; при равенстве порядок сохраняется (новые идут первыми)
const byLikes = (items: PlaceItem[]) => [...items].sort((a, b) => b.likes - a.likes);

export function PlacesView({ householdId, currentUserId, role, places }: Props) {
  const mobileModal = useMobileModal();
  const [, startTransition] = useTransition();
  const [filter, setFilter] = useState<'all' | PlaceKind>('all');
  const [addOpened, setAddOpened] = useState(false);
  const [editing, setEditing] = useState<PlaceItem | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [comment, setComment] = useState('');
  const [kind, setKind] = useState<PlaceKind>('food');
  const [confirmDelete, setConfirmDelete] = useState<PlaceItem | null>(null);

  // оптимистичный список: место, лайк и удаление видны сразу, запрос идёт в фоне
  const [items, apply] = useOptimistic(places, (state, action: Action): PlaceItem[] => {
    switch (action.type) {
      case 'add':
        return byLikes([action.item, ...state]);
      case 'update':
        return byLikes(state.map((p) => (p.id === action.item.id ? { ...p, ...action.item } : p)));
      case 'toggle':
        return byLikes(
          state.map((p) =>
            p.id === action.id
              ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) }
              : p
          )
        );
      case 'remove':
        return state.filter((p) => p.id !== action.id);
    }
  });

  const visible = filter === 'all' ? items : items.filter((p) => p.kind === filter);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setLocation('');
    setComment('');
    setKind(filter === 'all' ? 'food' : filter);
    setAddOpened(true);
  };

  const openEdit = (p: PlaceItem) => {
    setEditing(p);
    setName(p.name);
    setLocation(p.location ?? '');
    setComment(p.comment ?? '');
    setKind(kindOf(p.kind).value);
    setAddOpened(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const place = editing;
    const id = place?.id ?? crypto.randomUUID();
    setAddOpened(false);
    startTransition(async () => {
      const item: PlaceItem = {
        id,
        name: trimmed,
        kind,
        location: location.trim() || null,
        comment: comment.trim() || null,
        createdBy: place?.createdBy ?? currentUserId,
        likes: place?.likes ?? 0,
        likedByMe: place?.likedByMe ?? false,
      };
      apply({ type: place ? 'update' : 'add', item });
      const result = place
        ? await updatePlace({ id, householdId, name: trimmed, kind, location, comment })
        : await createPlace({ id, householdId, name: trimmed, kind, location, comment });
      if (!result.ok) notifications.show({ message: result.error, color: 'red' });
    });
  };

  const toggleLike = (id: string) =>
    startTransition(async () => {
      apply({ type: 'toggle', id });
      const result = await togglePlaceLike({ householdId, id });
      if (!result.ok) notifications.show({ message: result.error, color: 'red' });
    });

  const remove = (id: string) =>
    startTransition(async () => {
      apply({ type: 'remove', id });
      const result = await deletePlace({ householdId, id });
      if (!result.ok) notifications.show({ message: result.error, color: 'red' });
    });

  return (
    <Stack gap="lg" maw={560}>
      <PageTopBar
        backHref={`/budgets/${householdId}`}
        backLabel="К пространству"
        title="Куда сходить"
        right={
          <ActionIcon size="lg" radius="xl" aria-label="Добавить место" onClick={openAdd}>
            <IconPlus size={20} />
          </ActionIcon>
        }
      />

      {/* фильтр по виду места */}
      <Group gap={6}>
        {[{ value: 'all', label: 'Все' }, ...PLACE_KINDS].map((k) => (
          <Button
            key={k.value}
            size="compact-sm"
            radius="xl"
            variant={filter === k.value ? 'filled' : 'light'}
            color={filter === k.value ? undefined : 'gray'}
            onClick={() => setFilter(k.value as 'all' | PlaceKind)}
          >
            {k.label}
          </Button>
        ))}
      </Group>

      {items.length === 0 ? (
        // пустой список: плашка, по клику открывается форма добавления
        <Card
          withBorder
          radius="md"
          component="button"
          type="button"
          mih={100}
          onClick={openAdd}
          aria-label="Добавить место"
          style={{ borderStyle: 'dashed', cursor: 'pointer', background: 'transparent' }}
        >
          <Stack gap={4} align="center" justify="center" h="100%" c="dimmed">
            <IconPlus size={28} />
            <Text size="sm">Добавить место</Text>
          </Stack>
        </Card>
      ) : visible.length === 0 ? (
        <Text c="dimmed" ta="center" mt="xl">
          В этом виде пока нет мест.
        </Text>
      ) : (
        <Stack gap="xs">
          {visible.map((p) => {
            const k = kindOf(p.kind);
            const canEdit = role === 'owner' || p.createdBy === currentUserId;
            return (
              <Card key={p.id} withBorder radius="md" p="sm">
                <Group justify="space-between" wrap="nowrap" gap="sm">
                  <Stack gap={4} style={{ minWidth: 0 }}>
                    <Text fw={600} lineClamp={2}>
                      {p.name}
                    </Text>
                    {p.location &&
                      (() => {
                        const url = extractUrl(p.location);
                        return url ? (
                          <Anchor
                            size="sm"
                            truncate
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Открыть на карте
                          </Anchor>
                        ) : (
                          <Text size="sm" c="dimmed" truncate>
                            {p.location}
                          </Text>
                        );
                      })()}
                    {p.comment && (
                      <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                        {p.comment}
                      </Text>
                    )}
                  </Stack>
                  <Stack align="flex-end" justify="space-between" gap="xs" style={{ alignSelf: 'stretch' }}>
                    {/* вид места: только иконка в правом верхнем углу */}
                    <Box
                      c={`light-dark(var(--mantine-color-${k.color}-6), var(--mantine-color-${k.color}-3))`}
                      style={{ display: 'flex' }}
                      role="img"
                      aria-label={k.label}
                      title={k.label}
                    >
                      <KindIcon kind={p.kind} />
                    </Box>
                    <Group gap={4} wrap="nowrap">
                    {canEdit && (
                      <>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label="Изменить место"
                          onClick={() => openEdit(p)}
                        >
                          <IconPencil size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          aria-label="Удалить место"
                          onClick={() => setConfirmDelete(p)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </>
                    )}
                    <Group gap={2} wrap="nowrap">
                      <ActionIcon
                        variant="transparent"
                        c={p.likedByMe ? 'red' : 'gray'}
                        aria-label={p.likedByMe ? 'Убрать лайк' : 'Лайкнуть'}
                        aria-pressed={p.likedByMe}
                        onClick={() => toggleLike(p.id)}
                      >
                        {p.likedByMe ? <IconHeartFilled size={18} /> : <IconHeart size={18} />}
                      </ActionIcon>
                      <Text size="sm" c="dimmed">
                        {p.likes}
                      </Text>
                    </Group>
                    </Group>
                  </Stack>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}

      <Modal
        opened={addOpened}
        onClose={() => setAddOpened(false)}
        title={editing ? 'Изменить место' : 'Новое место'}
        {...mobileModal}
      >
        <form onSubmit={submit}>
          <Stack>
            <TextInput
              label="Название"
              placeholder="Например, Кофейня на углу"
              maxLength={80}
              data-autofocus
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
            />
            <TextInput
              label="Локация"
              placeholder="Адрес и ссылка из карт"
              maxLength={500}
              value={location}
              onChange={(e) => setLocation(e.currentTarget.value)}
            />
            <Textarea
              label="Комментарий"
              placeholder="Чем интересно место"
              maxLength={500}
              autosize
              minRows={2}
              maxRows={5}
              value={comment}
              onChange={(e) => setComment(e.currentTarget.value)}
            />
            <div>
              <Text size="sm" fw={500} mb={6}>
                Что это
              </Text>
              <Group gap={6}>
                {PLACE_KINDS.map((k) => (
                  <Button
                    key={k.value}
                    type="button"
                    size="compact-sm"
                    radius="xl"
                    variant={kind === k.value ? 'filled' : 'light'}
                    color={kind === k.value ? k.color : 'gray'}
                    onClick={() => setKind(k.value)}
                  >
                    {k.label}
                  </Button>
                ))}
              </Group>
            </div>
            <Button type="submit" disabled={!name.trim()}>
              {editing ? 'Сохранить' : 'Добавить'}
            </Button>
          </Stack>
        </form>
      </Modal>

      <ConfirmModal
        opened={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Удалить место?"
        text={`«${confirmDelete?.name}» будет удалено вместе с лайками.`}
        onConfirm={() => {
          const p = confirmDelete;
          setConfirmDelete(null);
          if (p) remove(p.id);
        }}
      />
    </Stack>
  );
}

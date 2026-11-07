'use client';

import { useOptimistic, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconAddressBook,
  IconCake,
  IconCalendar,
  IconChefHat,
  IconCheck,
  IconFileText,
  IconFolder,
  IconGripVertical,
  IconList,
  IconMap,
  IconMapPin,
  IconPhoto,
  IconTargetArrow,
  IconWallet,
} from '@tabler/icons-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Card, SimpleGrid, Stack, Text, UnstyledButton } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BOTTOM_INSET, PageTopBar } from '@/features/app-shell';
import { setDesktopTiles } from '@/server/desktop/actions';
import { DESKTOP_TILES, orderDesktopTiles } from '@/shared/config/desktop-tiles';

type Props = { householdId: string; periodic: boolean; hidden: string[]; order: string[] };
type Tile = (typeof DESKTOP_TILES)[number];
type Prefs = { hidden: string[]; order: string[] };

const META: Record<string, { icon: ReactNode; color: string }> = {
  budget: { icon: <IconWallet size={28} />, color: 'teal' },
  lists: { icon: <IconList size={28} />, color: 'pink' },
  places: { icon: <IconMapPin size={28} />, color: 'cyan' },
  plan: { icon: <IconTargetArrow size={28} />, color: 'orange' },
  calendar: { icon: <IconCalendar size={28} />, color: 'teal' },
  docs: { icon: <IconFileText size={28} />, color: 'indigo' },
  menu: { icon: <IconChefHat size={28} />, color: 'red' },
  map: { icon: <IconMap size={28} />, color: 'cyan' },
  contacts: { icon: <IconAddressBook size={28} />, color: 'grape' },
  birthdays: { icon: <IconCake size={28} />, color: 'orange' },
  gallery: { icon: <IconPhoto size={28} />, color: 'grape' },
  projects: { icon: <IconFolder size={28} />, color: 'blue' },
};

function SortableTile({
  tile,
  active,
  onToggle,
}: {
  tile: Tile;
  active: boolean;
  onToggle: () => void;
}) {
  const meta = META[tile.key];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tile.key,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'relative',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 1 : undefined,
      }}
    >
      <UnstyledButton onClick={onToggle} aria-pressed={active} w="100%">
        <Card
          withBorder
          radius="md"
          h={100}
          p="sm"
          style={{
            opacity: active ? 1 : 0.45,
            borderStyle: active ? 'solid' : 'dashed',
            borderColor: active
              ? `var(--mantine-color-${meta.color}-5)`
              : 'var(--mantine-color-default-border)',
            transition: 'opacity 120ms',
          }}
        >
          <Stack h="100%" justify="space-between" gap="xs">
            <Text fw={600} pr={18}>
              {tile.label}
            </Text>
            <Box
              c={`light-dark(var(--mantine-color-${meta.color}-6), var(--mantine-color-${meta.color}-3))`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}
            >
              {active ? <IconCheck size={18} /> : <span />}
              {meta.icon}
            </Box>
          </Stack>
        </Card>
      </UnstyledButton>
      <Box
        {...attributes}
        {...listeners}
        aria-label={`Переместить «${tile.label}»`}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          cursor: 'grab',
          touchAction: 'none',
          zIndex: 2,
          color: 'var(--mantine-color-dimmed)',
        }}
      >
        <IconGripVertical size={16} />
      </Box>
    </div>
  );
}

// настройка плиток мобильного рабочего стола; личная, у каждого участника своя
export function DesktopSettings({ householdId, periodic, hidden, order }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [prefs, applyPrefs] = useOptimistic({ hidden, order }, (_state, next: Prefs) => next);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const available = DESKTOP_TILES.filter((t) => periodic || !t.periodicOnly);
  const tiles = orderDesktopTiles(available, prefs.order);

  const save = (next: Prefs) => {
    startTransition(async () => {
      applyPrefs(next);
      const result = await setDesktopTiles({
        householdId,
        hidden: next.hidden,
        order: next.order,
      });
      if (!result.ok) {
        notifications.show({ message: 'Не удалось сохранить', color: 'red' });
      }
      router.refresh();
    });
  };

  const toggle = (key: string) => {
    const nextHidden = prefs.hidden.includes(key)
      ? prefs.hidden.filter((k) => k !== key)
      : [...prefs.hidden, key];
    save({ hidden: nextHidden, order: prefs.order });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = tiles.findIndex((t) => t.key === active.id);
    const newIndex = tiles.findIndex((t) => t.key === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    save({ hidden: prefs.hidden, order: arrayMove(tiles, oldIndex, newIndex).map((t) => t.key) });
  };

  return (
    <Stack gap="lg" maw={480} pb={BOTTOM_INSET}>
      <PageTopBar
        backHref={`/budgets/${householdId}/settings`}
        backLabel="К настройкам"
        title="Рабочий стол"
        titleAlign="left"
      />
      <Text size="sm" c="dimmed">
        Нажмите на плитку, чтобы показать или скрыть её на рабочем столе телефона. Перетащите за
        ручку, чтобы изменить порядок. Настройка только для вас, «Настройки» скрыть нельзя.
      </Text>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tiles.map((t) => t.key)} strategy={rectSortingStrategy}>
          <SimpleGrid cols={2}>
            {tiles.map((t) => (
              <SortableTile
                key={t.key}
                tile={t}
                active={!prefs.hidden.includes(t.key)}
                onToggle={() => toggle(t.key)}
              />
            ))}
          </SimpleGrid>
        </SortableContext>
      </DndContext>
    </Stack>
  );
}

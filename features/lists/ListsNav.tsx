'use client';

import { Icon } from '@iconify/react';
import spiralNotepad from '@iconify/icons-fluent-emoji/spiral-notepad';
import shoppingCart from '@iconify/icons-fluent-emoji/shopping-cart';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IconChecklist, IconPlus, IconShoppingCart } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  NavLink,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { PageTopBar } from '@/features/app-shell';
import { createList } from '@/server/checklists/actions';
import type { ChecklistItem } from '@/server/checklists/queries';
import { useMobileModal } from '@/shared/ui/useMobileModal';
import { pluralRu } from '@/shared/lib/plural';

export const KIND_ICON: Record<string, React.ReactNode> = {
  shopping: <IconShoppingCart size={18} />,
  tasks: <IconChecklist size={18} />,
};

export const KIND_LABEL: Record<string, string> = {
  shopping: 'Покупки',
  tasks: 'Задачи',
};

// окно создания списка: название и вид (покупки/задачи)
function NewListModal({
  householdId,
  opened,
  onClose,
}: {
  householdId: string;
  opened: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const mobileModal = useMobileModal();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'shopping' | 'tasks'>('tasks');
  const [pending, setPending] = useState(false);

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setPending(true);
    const id = crypto.randomUUID();
    const result = await createList({ id, householdId, title: trimmed, kind });
    setPending(false);
    if (!result.ok) {
      notifications.show({ message: result.error, color: 'red' });
      return;
    }
    setTitle('');
    onClose();
    router.push(`/budgets/${householdId}/lists/${id}`);
    router.refresh();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Новый список" {...mobileModal}>
      <Stack>
        <TextInput
          label="Название"
          placeholder="Например, Продукты"
          maxLength={80}
          data-autofocus
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
        <SegmentedControl
          fullWidth
          value={kind}
          onChange={(v) => setKind(v as 'shopping' | 'tasks')}
          data={[
            { value: 'tasks', label: 'Задачи' },
            { value: 'shopping', label: 'Покупки' },
          ]}
        />
        <Button onClick={submit} loading={pending} disabled={!title.trim()}>
          Создать
        </Button>
      </Stack>
    </Modal>
  );
}

function Links({
  householdId,
  items,
  pathname,
}: {
  householdId: string;
  items: ChecklistItem[];
  pathname: string;
}) {
  const base = `/budgets/${householdId}/lists`;
  return (
    <>
      {items.map((item) => (
        <NavLink
          key={item.id}
          component={Link}
          href={`${base}/${item.id}`}
          label={item.title}
          leftSection={KIND_ICON[item.kind]}
          active={pathname === `${base}/${item.id}`}
          variant="light"
          style={{ borderRadius: 'var(--mantine-radius-md)' }}
        />
      ))}
    </>
  );
}

// левая колонка «Списков» на десктопе
export function ListsNav({ householdId, items }: { householdId: string; items: ChecklistItem[] }) {
  const pathname = usePathname();
  const [opened, setOpened] = useState(false);

  return (
    <Box component="nav" w={240} visibleFrom="md" style={{ flexShrink: 0 }}>
      <Group justify="space-between" wrap="nowrap" mb="xs" px="xs">
        <Text fw={700} size="lg">
          Списки
        </Text>
        <Button
          variant="light"
          size="compact-xs"
          leftSection={<IconPlus size={12} />}
          onClick={() => setOpened(true)}
        >
          Новый список
        </Button>
      </Group>
      <Links householdId={householdId} items={items} pathname={pathname} />
      <NewListModal householdId={householdId} opened={opened} onClose={() => setOpened(false)} />
    </Box>
  );
}

// мобильный экран «Списков»: только список списков; на десктопе открываем первый
export function ListsIndex({ householdId, items }: { householdId: string; items: ChecklistItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [opened, setOpened] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // закреплённые плашки: первый список покупок и первый список задач
  const shopping = items.find((i) => i.kind === 'shopping');
  const tasks = items.find((i) => i.kind === 'tasks');

  const rest = items.filter((i) => i !== shopping && i !== tasks);

  useEffect(() => {
    if (window.matchMedia('(min-width: 62em)').matches && items.length > 0) {
      router.replace(`/budgets/${householdId}/lists/${items[0].id}`);
      return;
    }
    // клиентский кэш роутера держит страницу 30с (staleTimes):
    // при возврате «назад» компонент не монтируется заново, поэтому обновляем по смене url
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  const base = `/budgets/${householdId}/lists`;

  // плашка всегда на месте: если списка такого вида ещё нет, тап его создаёт
  const openDefault = async (kind: 'shopping' | 'tasks', list?: ChecklistItem) => {
    if (busy) return;
    if (list) {
      router.push(`${base}/${list.id}`);
      return;
    }
    setBusy(kind);
    const id = crypto.randomUUID();
    const result = await createList({
      id,
      householdId,
      title: KIND_LABEL[kind],
      kind,
    });
    setBusy(null);
    if (!result.ok) {
      notifications.show({ message: result.error, color: 'red' });
      return;
    }
    router.push(`${base}/${id}`);
    router.refresh();
  };

  const TILE_ICON = { shopping: shoppingCart, tasks: spiralNotepad };

  const Tile = ({ kind, list }: { kind: 'shopping' | 'tasks'; list?: ChecklistItem }) => (
    <UnstyledButton onClick={() => openDefault(kind, list)}>
      <Paper withBorder radius="lg" p="md" h={104} pos="relative">
        <Stack gap={4}>
          <Text fw={600} size="sm">
            {KIND_LABEL[kind]}
          </Text>
          {list && (
            <Text size="xs" c="dimmed">
              {list.pendingCount} {pluralRu(list.pendingCount, ['пункт', 'пункта', 'пунктов'])}
            </Text>
          )}
          {busy === kind ? (
            <Loader size={14} />
          ) : (
            !list && (
              <Text size="xs" c="dimmed">
                Создать
              </Text>
            )
          )}
        </Stack>
        <Box pos="absolute" right={12} bottom={10}>
          <Icon icon={TILE_ICON[kind]} width={36} />
        </Box>
      </Paper>
    </UnstyledButton>
  );

  return (
    <Stack gap="lg" hiddenFrom="md">
      <PageTopBar
        backHref={`/budgets/${householdId}`}
        backLabel="К пространству"
        title="Списки"
        right={
          <ActionIcon size="lg" radius="xl" aria-label="Новый список" onClick={() => setOpened(true)}>
            <IconPlus size={20} />
          </ActionIcon>
        }
      />
      <SimpleGrid cols={2}>
        <Tile kind="shopping" list={shopping} />
        <Tile kind="tasks" list={tasks} />
      </SimpleGrid>
      <Box component="nav">
        <Links householdId={householdId} items={rest} pathname={pathname} />
      </Box>
      <NewListModal householdId={householdId} opened={opened} onClose={() => setOpened(false)} />
    </Stack>
  );
}

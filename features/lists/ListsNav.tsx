'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { IconChecklist, IconPlus, IconShoppingCart } from '@tabler/icons-react';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  NavLink,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { PageTopBar } from '@/features/app-shell';
import { createList } from '@/server/checklists/actions';
import type { ChecklistItem } from '@/server/checklists/queries';
import { useMobileModal } from '@/shared/ui/useMobileModal';

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

  useEffect(() => {
    if (window.matchMedia('(min-width: 62em)').matches && items.length > 0) {
      router.replace(`/budgets/${householdId}/lists/${items[0].id}`);
    }
  }, [router, householdId, items]);

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
      <Box component="nav">
        <Links householdId={householdId} items={items} pathname={pathname} />
        {items.length === 0 && (
          <Text size="sm" c="dimmed" px="xs">
            Списков пока нет
          </Text>
        )}
      </Box>
      <NewListModal householdId={householdId} opened={opened} onClose={() => setOpened(false)} />
    </Stack>
  );
}

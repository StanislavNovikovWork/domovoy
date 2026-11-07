'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus } from '@tabler/icons-react';
import {
  ActionIcon,
  Button,
  Card,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { BOTTOM_INSET, PageTopBar } from '@/features/app-shell';
import { createHousehold } from '@/server/households/actions';
import type { listChildHouseholds as listProjects } from '@/server/households/queries';
import { useMobileModal } from '@/shared/ui/useMobileModal';

type Project = Awaited<ReturnType<typeof listProjects>>[number];

// поездки пространства: дочерние бюджеты
export function ProjectsView({
  householdId,
  spaceName,
  projects,
}: {
  householdId: string;
  spaceName: string;
  projects: Project[];
}) {
  const router = useRouter();
  const mobileModal = useMobileModal();
  const [opened, setOpened] = useState(false);
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    startTransition(async () => {
      const result = await createHousehold({
        name: trimmed,
        parentId: householdId,
      });
      if (!result.ok) {
        notifications.show({ message: result.error, color: 'red' });
        return;
      }
      setOpened(false);
      setName('');
      router.refresh();
    });
  };

  return (
    <Stack gap="lg" pb={BOTTOM_INSET}>
      <PageTopBar
        backHref={`/budgets/${householdId}`}
        backLabel={spaceName}
        title="Поездки"
        right={
          <ActionIcon
            size="lg"
            radius="xl"
            aria-label="Новая поездка"
            onClick={() => setOpened(true)}
          >
            <IconPlus size={20} />
          </ActionIcon>
        }
      />

      {projects.length === 0 ? (
        <Text c="dimmed" size="sm">
          Поездок пока нет. Создайте бюджет под поездку — он будет жить внутри этого пространства.
        </Text>
      ) : (
        <SimpleGrid cols={2}>
          {projects.map((p) => (
            <Card
              key={p.id}
              withBorder
              radius="md"
              mih={110}
              onClick={() => router.push(`/budgets/${p.id}/budget`)}
              style={{ cursor: 'pointer' }}
            >
              <Stack h="100%" justify="center">
                <Text fw={600} size="lg" ta="center" truncate>
                  {p.name}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <Modal opened={opened} onClose={() => setOpened(false)} title="Новая поездка" {...mobileModal}>
        <Stack>
          <TextInput
            label="Название"
            placeholder="Например, Поездка в Сочи"
            maxLength={40}
            data-autofocus
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <Button onClick={submit} loading={pending} disabled={!name.trim()}>
            Создать
          </Button>
        </Stack>
      </Modal>
    </Stack>
  );
}

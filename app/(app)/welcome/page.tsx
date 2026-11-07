'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ensurePersonalSpace, renameHousehold } from '@/server/households/actions';

const SUGGESTIONS = ['Я', 'Семья', 'Друзья', 'Компания'];

// онбординг: личное пространство уже создано, предлагаем его назвать
export default function WelcomePage() {
  const router = useRouter();
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    ensurePersonalSpace().then((res) => {
      if (res.ok && res.id) setSpaceId(res.id);
      else router.replace('/');
    });
  }, [router]);

  const submit = (value?: string) => {
    const trimmed = (value ?? name).trim();
    if (!trimmed || !spaceId) return;
    startTransition(async () => {
      const result = await renameHousehold({ householdId: spaceId, name: trimmed });
      if (!result.ok) {
        notifications.show({ message: result.error, color: 'red' });
        return;
      }
      router.push('/');
      router.refresh();
    });
  };

  return (
    <Stack gap="lg" maw={420} mx="auto" mt="15vh">
      <div>
        <Title order={2}>Как назовёте пространство?</Title>
        <Text c="dimmed" size="sm" mt={4}>
          Личное пространство уже создано — его видите только вы. Название можно поменять позже в
          настройках.
        </Text>
      </div>
      <Group gap="xs">
        {SUGGESTIONS.map((s) => (
          <Button key={s} variant="light" size="sm" onClick={() => submit(s)} disabled={pending}>
            {s}
          </Button>
        ))}
      </Group>
      <TextInput
        placeholder="Или введите своё название"
        maxLength={40}
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        disabled={!spaceId}
      />
      <Group gap="xs">
        <Button onClick={() => submit()} loading={pending} disabled={!name.trim() || !spaceId}>
          Начать
        </Button>
        <Button variant="subtle" color="gray" onClick={() => router.push('/')} disabled={pending}>
          Пропустить
        </Button>
      </Group>
    </Stack>
  );
}

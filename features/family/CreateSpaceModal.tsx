'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal, Stack, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { createHousehold } from '@/server/households/actions';
import { useMobileModal } from '@/shared/ui/useMobileModal';

// создание корневого пространства (периодического бюджета)
export function CreateSpaceModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const mobileModal = useMobileModal();
  const [name, setName] = useState('');
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createHousehold({ name: trimmed });
      if (result.ok) {
        notifications.show({ message: 'Пространство создано', color: 'teal' });
        setName('');
        onClose();
        router.push(`/budgets/${result.id}`);
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Новое пространство" {...mobileModal}>
      <Stack>
        <TextInput
          label="Название"
          placeholder="Например, Семья или Друзья"
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
  );
}

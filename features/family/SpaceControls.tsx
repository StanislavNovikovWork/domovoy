'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  deleteHousehold,
  leaveHousehold,
  renameHousehold,
} from '@/server/households/actions';

type Props = {
  householdId: string;
  name: string;
  role: 'owner' | 'member';
};

// название пространства над списком участников: у владельца с редактированием, у участника на чтение
export function SpaceNameField({ householdId, name, role }: Props) {
  const router = useRouter();
  const [newName, setNewName] = useState(name);
  useEffect(() => setNewName(name), [name]);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const rename = () => {
    setPendingKey('rename');
    renameHousehold({ householdId, name: newName })
      .then((result) => {
        if (result.ok) {
          notifications.show({ message: 'Название изменено', color: 'teal' });
          router.refresh();
        } else {
          notifications.show({ message: result.error, color: 'red' });
        }
      })
      .finally(() => setPendingKey(null));
  };

  if (role !== 'owner') {
    return <TextInput label="Название пространства" value={name} readOnly variant="filled" />;
  }

  return (
    <Group align="flex-end" wrap="nowrap">
      <TextInput
        label="Название пространства"
        maxLength={40}
        value={newName}
        onChange={(e) => setNewName(e.currentTarget.value)}
        style={{ flex: 1 }}
      />
      <Button
        variant="default"
        onClick={rename}
        loading={pendingKey === 'rename'}
        disabled={!newName.trim() || newName.trim() === name}
      >
        Сохранить
      </Button>
    </Group>
  );
}

// управление пространством: удаление (владелец) или выход (участник)
export function SpaceControls({ householdId, name, role }: Props) {
  const router = useRouter();
  const isOwner = role === 'owner';
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const track = async (key: string, fn: () => Promise<void>) => {
    setPendingKey(key);
    try {
      await fn();
    } finally {
      setPendingKey(null);
    }
  };

  const remove = () => {
    setConfirmDelete(false);
    track('delete', async () => {
      const result = await deleteHousehold({ householdId });
      if (result.ok) {
        notifications.show({ message: 'Пространство удалено', color: 'teal' });
        router.push('/');
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  const leave = () => {
    track('leave', async () => {
      const result = await leaveHousehold({ householdId });
      if (result.ok) {
        notifications.show({ message: 'Вы вышли из пространства', color: 'teal' });
        router.push('/');
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  return (
    <>
      <Modal
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Удалить пространство?"
        size="sm"
        centered
        zIndex={350}
      >
        <Stack>
          <Text size="sm">
            Пространство «{name}» будет удалено вместе со всеми операциями. Это нельзя отменить.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmDelete(false)}>
              Отмена
            </Button>
            <Button color="red" onClick={remove}>
              Удалить
            </Button>
          </Group>
        </Stack>
      </Modal>

      {isOwner ? (
        <Button
          mt="auto"
          variant="light"
          color="red"
          onClick={() => setConfirmDelete(true)}
          loading={pendingKey === 'delete'}
        >
          Удалить пространство
        </Button>
      ) : (
        <Button mt="auto" variant="light" color="red" onClick={leave} loading={pendingKey === 'leave'}>
          Выйти из пространства
        </Button>
      )}
    </>
  );
}

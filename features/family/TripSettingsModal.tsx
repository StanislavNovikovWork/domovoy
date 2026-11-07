'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconCrown, IconUserMinus } from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  addTripGuest,
  addTripParticipant,
  deleteHousehold,
  removeTripGuest,
  removeTripParticipant,
  renameTrip,
} from '@/server/households/actions';
import type { HouseholdGuestItem, HouseholdMemberItem } from '@/server/households/queries';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { useMobileModal } from '@/shared/ui/useMobileModal';

type Props = {
  opened: boolean;
  onClose: () => void;
  householdId: string;
  parentId: string;
  name: string;
  role: 'owner' | 'member';
  currentUserId: string;
  members: HouseholdMemberItem[];
  guests: HouseholdGuestItem[];
  spaceMembers: HouseholdMemberItem[];
  spaceGuests: HouseholdGuestItem[];
};

// настройки разовой поездки: название, участники из родительского пространства, удаление
export function TripSettingsModal({
  opened,
  onClose,
  householdId,
  parentId,
  name,
  role,
  currentUserId,
  members,
  guests,
  spaceMembers,
  spaceGuests,
}: Props) {
  const router = useRouter();
  const mobileModal = useMobileModal();
  const [tripName, setTripName] = useState(name);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [selectedAdd, setSelectedAdd] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (opened) setTripName(name);
  }, [opened, name]);

  const track = async (key: string, fn: () => Promise<void>) => {
    setPendingKey(key);
    try {
      await fn();
    } finally {
      setPendingKey(null);
    }
  };

  const run = (
    key: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string
  ) => {
    track(key, async () => {
      const result = await action();
      if (result.ok) {
        notifications.show({ message: success, color: 'teal' });
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  const rename = () => {
    track('rename', async () => {
      const result = await renameTrip({ householdId, name: tripName });
      if (result.ok) {
        notifications.show({ message: 'Название изменено', color: 'teal' });
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  const memberIds = new Set(members.map((m) => m.userId));
  const guestNames = new Set(guests.map((g) => g.name.toLowerCase()));
  const addOptions = [
    ...spaceMembers
      .filter((m) => !memberIds.has(m.userId))
      .map((m) => ({ value: `u:${m.userId}`, label: m.name })),
    ...spaceGuests
      .filter((g) => !guestNames.has(g.name.toLowerCase()))
      .map((g) => ({ value: `g:${g.name}`, label: `${g.name} (гость)` })),
  ];

  const addParticipant = () => {
    if (!selectedAdd) return;
    const sep = selectedAdd.indexOf(':');
    const kind = selectedAdd.slice(0, sep);
    const value = selectedAdd.slice(sep + 1);
    track('add', async () => {
      const result =
        kind === 'u'
          ? await addTripParticipant({ householdId, userId: value })
          : await addTripGuest({ householdId, name: value });
      if (result.ok) {
        setSelectedAdd(null);
        notifications.show({ message: 'Участник добавлен', color: 'teal' });
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  const remove = () => {
    setConfirmDelete(false);
    track('delete', async () => {
      const result = await deleteHousehold({ householdId });
      if (result.ok) {
        notifications.show({ message: 'Поездка удалена', color: 'teal' });
        router.push(`/budgets/${parentId}`);
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  return (
    <>
      <ConfirmModal
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Удалить поездку?"
        text={`Поездка «${name}» будет удалена вместе со всеми операциями. Это нельзя отменить.`}
        onConfirm={remove}
      />

      <Modal opened={opened} onClose={onClose} title="Настройки поездки" size="lg" {...mobileModal}>
        <Stack gap="lg">
          <Group align="flex-end" wrap="nowrap">
            <TextInput
              label="Название"
              maxLength={40}
              value={tripName}
              onChange={(e) => setTripName(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Button
              variant="default"
              onClick={rename}
              loading={pendingKey === 'rename'}
              disabled={!tripName.trim() || tripName.trim() === name}
            >
              Сохранить
            </Button>
          </Group>

          <div>
            <Text fw={600} mb={6}>
              Участники
            </Text>
            <Stack gap="xs">
              {members.map((m) => (
                <Group key={m.userId} justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <Avatar radius="xl" color="blue" name={m.name} src={m.image} />
                    <Text size="sm" fw={500}>
                      {m.name}
                      {m.userId === currentUserId && (
                        <Text span c="dimmed">
                          {' '}
                          (вы)
                        </Text>
                      )}
                    </Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    {m.role === 'owner' && (
                      <IconCrown
                        size={18}
                        aria-label="Владелец"
                        style={{ color: 'var(--mantine-color-yellow-6)' }}
                      />
                    )}
                    {m.role !== 'owner' && (
                      <Tooltip label="Убрать из поездки">
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          disabled={pendingKey === `member:${m.userId}`}
                          onClick={() =>
                            run(
                              `member:${m.userId}`,
                              () => removeTripParticipant({ householdId, userId: m.userId }),
                              'Участник удалён'
                            )
                          }
                        >
                          <IconUserMinus size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </Group>
                </Group>
              ))}
              {guests.map((g) => (
                <Group key={g.id} justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap">
                    <Avatar radius="xl" color="gray" name={g.name} />
                    <Text size="sm" fw={500}>
                      {g.name}
                    </Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Badge variant="light" color="gray">
                      Без аккаунта
                    </Badge>
                    <Tooltip label="Убрать из поездки">
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        disabled={pendingKey === `guest:${g.id}`}
                        onClick={() =>
                          run(
                            `guest:${g.id}`,
                            () => removeTripGuest({ householdId, guestId: g.id }),
                            'Участник удалён'
                          )
                        }
                      >
                        <IconUserMinus size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              ))}
            </Stack>

            {addOptions.length > 0 && (
              <Group gap="xs" mt="sm" wrap="nowrap">
                <Select
                  size="sm"
                  placeholder="Участник пространства"
                  data={addOptions}
                  value={selectedAdd}
                  onChange={setSelectedAdd}
                  searchable
                  style={{ flex: 1 }}
                />
                <Button
                  variant="light"
                  size="sm"
                  onClick={addParticipant}
                  loading={pendingKey === 'add'}
                  disabled={!selectedAdd}
                >
                  Добавить
                </Button>
              </Group>
            )}
          </div>

          <Divider />

          {role === 'owner' && (
            <Button
              variant="light"
              color="red"
              onClick={() => setConfirmDelete(true)}
              loading={pendingKey === 'delete'}
            >
              Удалить поездку
            </Button>
          )}
        </Stack>
      </Modal>
    </>
  );
}

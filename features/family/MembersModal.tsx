'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCheck,
  IconCopy,
  IconLink,
  IconPlus,
  IconTrash,
  IconUserMinus,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  CopyButton,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  addGuest,
  createInvite,
  deleteHousehold,
  leaveHousehold,
  removeGuest,
  removeMember,
  renameHousehold,
  revokeInvite,
} from '@/server/households/actions';
import type {
  HouseholdGuestItem,
  HouseholdMemberItem,
  InviteItem,
} from '@/server/households/queries';
import { useMobileModal } from '@/shared/ui/useMobileModal';

type Props = {
  opened: boolean;
  onClose: () => void;
  householdId: string;
  name: string;
  currentUserId: string;
  role: 'owner' | 'member';
  members: HouseholdMemberItem[];
  guests: HouseholdGuestItem[];
  invites: InviteItem[];
};

const ROLE_LABEL = { owner: 'Владелец', member: 'Участник' } as const;

export function MembersModal({
  opened,
  onClose,
  householdId,
  name,
  currentUserId,
  role,
  members,
  guests,
  invites,
}: Props) {
  const router = useRouter();
  const mobileModal = useMobileModal();
  // ключ выполняемого действия: загрузка показывается только на нажатой кнопке
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const track = async (key: string, fn: () => Promise<void>) => {
    setPendingKey(key);
    try {
      await fn();
    } finally {
      setPendingKey(null);
    }
  };
  const [newLink, setNewLink] = useState<string | null>(null);
  // origin доступен только в браузере: при SSR window нет
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const inviteUrl = (token: string) => `${origin}/invite/${token}`;
  const isOwner = role === 'owner';
  const [newName, setNewName] = useState(name);
  useEffect(() => setNewName(name), [name]);

  const rename = () => {
    track('rename', async () => {
      const result = await renameHousehold({ householdId, name: newName });
      if (result.ok) {
        notifications.show({ message: 'Название изменено', color: 'teal' });
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  const remove = () => {
    if (
      !window.confirm(`Удалить бюджет «${name}» вместе со всеми операциями? Это нельзя отменить.`)
    )
      return;
    track('delete', async () => {
      const result = await deleteHousehold({ householdId });
      if (result.ok) {
        notifications.show({ message: 'Бюджет удалён', color: 'teal' });
        router.push('/budgets');
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  const run = (
    key: string,
    action: () => Promise<{ ok: boolean; error?: string }>,
    success?: string
  ) => {
    track(key, async () => {
      const result = await action();
      if (result.ok) {
        if (success) notifications.show({ message: success, color: 'teal' });
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  const invite = () => {
    track('invite', async () => {
      const result = await createInvite({ householdId });
      if (result.ok) {
        setNewLink(inviteUrl(result.token));
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
        notifications.show({ message: 'Вы вышли из бюджета', color: 'teal' });
        onClose();
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  const [guestName, setGuestName] = useState('');
  // участник без аккаунта: сохраняется гостем бюджета и появляется в форме расхода
  const addGuestByName = () => {
    const guest = guestName.trim();
    if (!guest) return;
    track('addGuest', async () => {
      const result = await addGuest({ householdId, name: guest });
      if (result.ok) {
        setGuestName('');
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Участники" size="md" {...mobileModal}>
      <Stack>
        <Stack gap="xs">
          {members.map((m) => (
            <Group key={m.userId} justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <Avatar radius="xl" color="blue" name={m.name} />
                <div>
                  <Text size="sm" fw={500}>
                    {m.name}
                    {m.userId === currentUserId && (
                      <Text span c="dimmed">
                        {' '}
                        (вы)
                      </Text>
                    )}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {m.email}
                  </Text>
                </div>
              </Group>
              <Group gap="xs" wrap="nowrap">
                <Badge variant="light" color={m.role === 'owner' ? 'teal' : 'gray'}>
                  {ROLE_LABEL[m.role]}
                </Badge>
                {isOwner && m.role !== 'owner' && (
                  <Tooltip label="Удалить из бюджета">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      disabled={pendingKey === `member:${m.userId}`}
                      onClick={() =>
                        run(
                          `member:${m.userId}`,
                          () => removeMember({ householdId, userId: m.userId }),
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
                {isOwner && (
                  <Tooltip label="Удалить из списка">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      disabled={pendingKey === `guest:${g.id}`}
                      onClick={() =>
                        run(
                          `guest:${g.id}`,
                          () => removeGuest({ householdId, guestId: g.id }),
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
        </Stack>

        <Group gap="xs" wrap="nowrap">
          <TextInput
            size="sm"
            placeholder="Участник без аккаунта: имя"
            maxLength={40}
            value={guestName}
            onChange={(e) => setGuestName(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addGuestByName();
              }
            }}
            style={{ flex: 1 }}
          />
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Добавить участника"
            disabled={!guestName.trim() || pendingKey === 'addGuest'}
            onClick={addGuestByName}
          >
            <IconPlus size={16} />
          </ActionIcon>
        </Group>

        {isOwner && (
          <>
            <Button
              variant="light"
              leftSection={<IconLink size={16} />}
              onClick={invite}
              loading={pendingKey === 'invite'}
            >
              Создать ссылку-приглашение
            </Button>

            {newLink && (
              <TextInput
                label="Ссылка готова, отправьте её близкому"
                description="Одноразовая, действует 7 дней"
                value={newLink}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
                rightSection={
                  <CopyButton value={newLink}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Скопировано' : 'Скопировать'}>
                        <ActionIcon
                          variant="subtle"
                          color={copied ? 'teal' : 'gray'}
                          onClick={copy}
                        >
                          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                }
              />
            )}

            {invites.length > 0 && (
              <div>
                <Text size="sm" fw={500} mb={6}>
                  Действующие приглашения
                </Text>
                <Stack gap={4}>
                  {invites.map((i) => (
                    <Group key={i.id} justify="space-between" wrap="nowrap">
                      <Text size="xs" c="dimmed">
                        до{' '}
                        {i.expiresAt.toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </Text>
                      <Group gap={4} wrap="nowrap">
                        <CopyButton value={inviteUrl(i.token)}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Скопировано' : 'Скопировать ссылку'}>
                              <ActionIcon
                                variant="subtle"
                                color={copied ? 'teal' : 'gray'}
                                onClick={copy}
                              >
                                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                        <Tooltip label="Отозвать">
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            disabled={pendingKey === `invite:${i.id}`}
                            onClick={() =>
                              run(
                                `invite:${i.id}`,
                                () => revokeInvite({ householdId, inviteId: i.id }),
                                'Приглашение отозвано'
                              )
                            }
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </div>
            )}
          </>
        )}

        {isOwner && (
          <>
            <Group align="flex-end" wrap="nowrap">
              <TextInput
                label="Название бюджета"
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
            <Button variant="subtle" color="red" onClick={remove} loading={pendingKey === 'delete'}>
              Удалить бюджет
            </Button>
          </>
        )}

        {!isOwner && (
          <Button variant="subtle" color="red" onClick={leave} loading={pendingKey === 'leave'}>
            Выйти из бюджета
          </Button>
        )}
      </Stack>
    </Modal>
  );
}

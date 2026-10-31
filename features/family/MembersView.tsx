'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconCheck,
  IconCopy,
  IconCrown,
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
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  addGuest,
  createInvite,
  removeGuest,
  removeMember,
  revokeInvite,
} from '@/server/households/actions';
import type {
  HouseholdGuestItem,
  HouseholdMemberItem,
  InviteItem,
} from '@/server/households/queries';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';
import { SpaceControls } from './SpaceControls';

type Props = {
  householdId: string;
  name: string;
  currentUserId: string;
  role: 'owner' | 'member';
  members: HouseholdMemberItem[];
  guests: HouseholdGuestItem[];
  invites: InviteItem[];
  /** false: без переименования и удаления/выхода (в настройках они в «Управление пространством») */
  showSpaceControls?: boolean;
};

export function MembersView({
  householdId,
  name,
  currentUserId,
  role,
  members,
  guests,
  invites,
  showSpaceControls = true,
}: Props) {
  const router = useRouter();
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
  // участник, которого подтверждают на удаление (аккаунт или гость)
  const [confirmMember, setConfirmMember] = useState<{
    guest: boolean;
    id: string;
    name: string;
  } | null>(null);

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
    <>
    <ConfirmModal
      opened={!!confirmMember}
      onClose={() => setConfirmMember(null)}
      title="Удалить участника?"
      text={`${confirmMember?.name} будет удалён из бюджета.`}
      onConfirm={() => {
        const c = confirmMember;
        setConfirmMember(null);
        if (!c) return;
        if (c.guest)
          run(`guest:${c.id}`, () => removeGuest({ householdId, guestId: c.id }), 'Участник удалён');
        else
          run(`member:${c.id}`, () => removeMember({ householdId, userId: c.id }), 'Участник удалён');
      }}
    />

    <Stack maw={480} pb="md" style={{ flex: 1 }}>
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
                </div>
              </Group>
              <Group gap="xs" wrap="nowrap">
                {m.role === 'owner' && (
                  <IconCrown
                    size={18}
                    aria-label="Владелец"
                    style={{ color: 'var(--mantine-color-yellow-6)' }}
                  />
                )}
                {isOwner && m.role !== 'owner' && (
                  <Tooltip label="Удалить из бюджета">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      disabled={pendingKey === `member:${m.userId}`}
                      onClick={() =>
                        setConfirmMember({ guest: false, id: m.userId, name: m.name })
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
                        setConfirmMember({ guest: true, id: g.id, name: g.name })
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

        {isOwner && (
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
        )}

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
                description="Действует 7 дней"
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

        {showSpaceControls && (
          <SpaceControls householdId={householdId} name={name} role={role} />
        )}
    </Stack>
    </>
  );
}

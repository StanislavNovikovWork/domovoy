'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, Button, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { acceptInvite } from '@/server/households/actions';
import { withNext } from '@/shared/lib/safe-next';

export type InviteState =
  | { kind: 'guest'; inviterName: string; householdName: string } // действует, не вошёл
  | { kind: 'can-join'; inviterName: string; householdName: string } // действует, вошёл
  | { kind: 'already-in-this'; householdId: string }
  | { kind: 'invalid' };

type Props = { token: string; state: InviteState };

export function InviteCard({ token, state }: Props) {
  return (
    <Container size={420} my={80}>
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <Content token={token} state={state} />
      </Paper>
    </Container>
  );
}

function Content({ token, state }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = `/invite/${token}`;

  const join = () => {
    startTransition(async () => {
      const result = await acceptInvite({ token });
      if (result.ok) {
        notifications.show({ message: 'Вы вступили в бюджет', color: 'teal' });
        router.push(`/budgets/${result.id}`);
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
        router.refresh(); // состояние могло измениться: перерисуем страницу
      }
    });
  };

  switch (state.kind) {
    case 'guest':
    case 'can-join':
      return (
        <Stack>
          <Title order={3} ta="center">
            Приглашение в бюджет
          </Title>
          <Text ta="center">
            <Text span fw={600}>
              {state.inviterName}
            </Text>{' '}
            приглашает вас в бюджет{' '}
            <Text span fw={600}>
              «{state.householdName}»
            </Text>
          </Text>
          {state.kind === 'can-join' ? (
            <Button onClick={join} loading={pending} fullWidth>
              Вступить в бюджет
            </Button>
          ) : (
            <>
              <Button component={Link} href={withNext('/register', next)} fullWidth>
                Зарегистрироваться
              </Button>
              <Button component={Link} href={withNext('/login', next)} variant="default" fullWidth>
                Войти
              </Button>
            </>
          )}
        </Stack>
      );

    case 'already-in-this':
      return (
        <Stack align="center">
          <Title order={3}>Вы уже в этом бюджете</Title>
          <Anchor component={Link} href={`/budgets/${state.householdId}`}>
            Перейти к бюджету
          </Anchor>
        </Stack>
      );

    case 'invalid':
      return (
        <Stack align="center">
          <Title order={3}>Ссылка недействительна</Title>
          <Text c="dimmed" size="sm" ta="center">
            Попросите новую у того, кто вас пригласил
          </Text>
          <Anchor component={Link} href="/">
            На главную
          </Anchor>
        </Stack>
      );
  }
}

'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconUsers } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { createFamilyHousehold } from '@/server/households/actions';
import type { HouseholdListItem } from '@/server/households/queries';

const pluralMembers = (n: number) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} участник`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} участника`;
  return `${n} участников`;
};

export function BudgetsList({ budgets }: { budgets: HouseholdListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm({
    initialValues: { name: '' },
    validate: { name: (v) => (v.trim() ? null : 'Введите название') },
  });

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await createFamilyHousehold(values);
      if (result.ok) {
        notifications.show({ message: 'Бюджет создан', color: 'teal' });
        router.push(`/budgets/${result.id}`);
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  });

  return (
    <Container size="md" p={0}>
      <Stack gap="lg">
        <Title order={2}>Мои бюджеты</Title>

        <Paper withBorder p="md" radius="md">
          <form onSubmit={handleSubmit}>
            <Group align="flex-end" wrap="nowrap">
              <TextInput
                label="Новый бюджет"
                placeholder="Например, Отпуск или Ремонт"
                maxLength={40}
                style={{ flex: 1 }}
                {...form.getInputProps('name')}
              />
              <Button type="submit" loading={pending}>
                Создать
              </Button>
            </Group>
          </form>
        </Paper>

        {budgets.length === 0 ? (
          <Text c="dimmed">
            Здесь пока пусто. Создайте бюджет под любую цель или проект и пригласите в него других
            людей. Если вас уже пригласили, откройте ссылку из приглашения.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {budgets.map((b) => (
              <Card key={b.id} withBorder radius="md" component={Link} href={`/budgets/${b.id}`}>
                <Group justify="space-between" wrap="nowrap">
                  <Text fw={600} truncate>
                    {b.name}
                  </Text>
                  <Badge variant="light" color={b.role === 'owner' ? 'teal' : 'gray'}>
                    {b.role === 'owner' ? 'Владелец' : 'Участник'}
                  </Badge>
                </Group>
                <Group gap={6} mt="xs" c="dimmed">
                  <IconUsers size={16} />
                  <Text size="sm">{pluralMembers(b.membersCount)}</Text>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}

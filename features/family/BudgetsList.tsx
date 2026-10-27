'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconCrown, IconPlus, IconUsers } from '@tabler/icons-react';
import {
  Button,
  Box,
  Card,
  Checkbox,
  Container,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { createHousehold } from '@/server/households/actions';
import type { HouseholdListItem } from '@/server/households/queries';
import { useMobileModal } from '@/shared/ui/useMobileModal';

export function BudgetsList({ budgets }: { budgets: HouseholdListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [opened, modal] = useDisclosure(false);
  const mobileModal = useMobileModal();

  const form = useForm({
    initialValues: { name: '', oneTime: false },
    validate: { name: (v) => (v.trim() ? null : 'Введите название') },
  });

  const close = () => {
    modal.close();
    form.reset();
  };

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await createHousehold(values);
      if (result.ok) {
        notifications.show({ message: 'Бюджет создан', color: 'teal' });
        router.push(`/budgets/${result.id}`);
      } else if (result.field) {
        // ошибки конкретного поля (дубль названия) показываем как валидация инпута
        form.setFieldError(result.field, result.error);
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  });

  return (
    <Container size="md" p={0} mx={0}>
      <Stack gap="lg">
        <Modal opened={opened} onClose={close} title="Новый бюджет" {...mobileModal}>
          <form onSubmit={handleSubmit}>
            <Stack>
              <TextInput
                label="Название"
                placeholder="Например, Отпуск или Ремонт"
                maxLength={40}
                data-autofocus
                {...form.getInputProps('name')}
              />
              <Checkbox
                label="Разовый бюджет"
                description="Без разбивки по дням, неделям и месяцам: только план и фактические траты"
                {...form.getInputProps('oneTime', { type: 'checkbox' })}
              />
              <Button type="submit" loading={pending}>
                Создать
              </Button>
            </Stack>
          </form>
        </Modal>

        {budgets.length === 0 && (
          <Text c="dimmed">
            Здесь пока пусто. Создайте бюджет под любую цель или проект и пригласите в него других
            людей. Если вас уже пригласили, откройте ссылку из приглашения.
          </Text>
        )}

        {/* два бюджета в ряд на любом экране */}
        <SimpleGrid cols={2}>
          {budgets.map((b) => (
            <Card
              key={b.id}
              withBorder
              radius="md"
              component={Link}
              href={`/budgets/${b.id}`}
              mih={140}
            >
              {b.role === 'owner' && (
                <IconCrown
                  size={18}
                  aria-label="Вы владелец"
                  style={{
                    position: 'absolute',
                    top: 'var(--mantine-spacing-md)',
                    right: 'var(--mantine-spacing-md)',
                    color: 'var(--mantine-color-yellow-6)',
                  }}
                />
              )}
              <Stack h="100%" justify="space-between" gap="xs">
                <Box h={18} />
                <Text fw={600} ta="center" lineClamp={3} px="xs">
                  {b.name}
                </Text>
                <Group gap={6} c="dimmed" wrap="nowrap" aria-label="Участников">
                  <IconUsers size={16} />
                  <Text size="sm">{b.membersCount}</Text>
                </Group>
              </Stack>
            </Card>
          ))}

          <Card
            withBorder
            radius="md"
            component="button"
            type="button"
            mih={140}
            onClick={modal.open}
            aria-label="Создать бюджет"
            style={{ borderStyle: 'dashed', cursor: 'pointer', background: 'transparent' }}
          >
            <Stack gap={4} align="center" justify="center" h="100%" c="dimmed">
              <IconPlus size={28} />
              <Text size="sm">Новый бюджет</Text>
            </Stack>
          </Card>
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

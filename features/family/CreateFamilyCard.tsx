'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Container, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { createFamilyHousehold } from '@/server/households/actions';

export function CreateFamilyCard() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm({
    initialValues: { name: 'Семья' },
    validate: { name: (v) => (v.trim() ? null : 'Введите название') },
  });

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await createFamilyHousehold(values);
      if (result.ok) {
        notifications.show({ message: 'Семейный бюджет создан', color: 'teal' });
        router.refresh();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  });

  return (
    <Container size={420} mt="xl">
      <Paper withBorder shadow="sm" p="xl" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            <Title order={3} ta="center">
              Семейный бюджет
            </Title>
            <Text c="dimmed" size="sm" ta="center">
              Создайте общий бюджет и пригласите близких по ссылке. Если вас уже пригласили, откройте
              ссылку из приглашения.
            </Text>
            <TextInput label="Название" maxLength={40} data-autofocus {...form.getInputProps('name')} />
            <Button type="submit" loading={pending}>
              Создать
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

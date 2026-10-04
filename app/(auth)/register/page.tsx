import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Container, Paper, Text, Title } from '@mantine/core';
import { RegisterForm } from '@/features/auth';
import { auth } from '@/server/auth';

export const metadata = {
  title: 'Регистрация',
};

export default async function RegisterPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect('/');

  return (
    <Container size={420} my={80}>
      <Title order={2} ta="center">
        Регистрация
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
        Создайте аккаунт, чтобы начать вести семейный бюджет
      </Text>

      <Paper withBorder shadow="sm" p="xl" radius="md">
        <RegisterForm />
      </Paper>
    </Container>
  );
}
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Container, Paper, Text, Title } from '@mantine/core';
import { auth } from '@/server/auth';
import { LoginForm } from '@/features/auth';
export const metadata = {
  title: 'Вход',
};

export default async function LoginPage() {
  // Если пользователь уже вошёл, на странице входа ему делать нечего
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect('/');

  return (
    <Container size={420} my={80}>
      <Title order={2} ta="center">
        Вход
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
        Войдите, чтобы продолжить вести семейный бюджет
      </Text>

      <Paper withBorder shadow="sm" p="xl" radius="md">
        <LoginForm />
      </Paper>
    </Container>
  );
}
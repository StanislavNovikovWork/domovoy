import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Container, Paper, Text, Title } from '@mantine/core';
import { RegisterForm } from '@/features/auth';
import { auth } from '@/server/auth';
import { safeNext } from '@/shared/lib/safe-next';

export const metadata = {
  title: 'Регистрация',
};

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function RegisterPage({ searchParams }: Props) {
  const next = safeNext((await searchParams).next);

  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(next);

  return (
    <Container size={420} my={80}>
      <Title order={2} ta="center">
        Регистрация
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5} mb="xl">
        Создайте аккаунт, чтобы начать вести семейный бюджет
      </Text>

      <Paper withBorder shadow="sm" p="xl" radius="md">
        <RegisterForm next={next} />
      </Paper>
    </Container>
  );
}

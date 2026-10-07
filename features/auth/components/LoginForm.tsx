'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, Button, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { hasLength, isEmail, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { authClient } from '@/shared/lib/auth-client';
import { withNext } from '@/shared/lib/safe-next';

export function LoginForm({ next = '/' }: { next?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { email: '', password: '' },
    validate: {
      email: isEmail('Введите корректный email'),
      password: hasLength({ min: 8 }, 'Пароль должен быть не короче 8 символов'),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setLoading(false);
      notifications.show({
        color: 'red',
        title: 'Не удалось войти',
        message:
          error.code === 'INVALID_EMAIL_OR_PASSWORD'
            ? 'Неверный email или пароль'
            : (error.message ?? 'Что-то пошло не так, попробуйте ещё раз'),
      });
      return;
    }

    router.push(next);
    router.refresh();
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="md">
        <TextInput
          label="Email"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          required
          key={form.key('email')}
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label="Пароль"
          autoComplete="current-password"
          required
          key={form.key('password')}
          {...form.getInputProps('password')}
        />
        <Button type="submit" loading={loading} fullWidth>
          Войти
        </Button>
        <Text size="sm" c="dimmed" ta="center">
          Нет аккаунта?{' '}
          <Anchor component={Link} href={withNext('/register', next)} size="sm">
            Зарегистрироваться
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
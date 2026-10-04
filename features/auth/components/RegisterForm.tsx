'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Anchor, Button, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { hasLength, isEmail, matchesField, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { authClient } from '@/shared/lib/auth-client';

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validate: {
      name: hasLength({ min: 2 }, 'Введите имя'),
      email: isEmail('Введите корректный email'),
      password: hasLength({ min: 8 }, 'Пароль должен быть не короче 8 символов'),
      confirmPassword: matchesField('password', 'Пароли не совпадают'),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setLoading(true);

    const { error } = await authClient.signUp.email({
      name: values.name.trim(),
      email: values.email,
      password: values.password,
    });

    if (error) {
      setLoading(false);
      notifications.show({
        color: 'red',
        title: 'Не удалось зарегистрироваться',
        message: error.code?.includes('USER_ALREADY_EXISTS')
          ? 'Пользователь с таким email уже существует'
          : (error.message ?? 'Что-то пошло не так, попробуйте ещё раз'),
      });
      return;
    }

    router.push('/');
    router.refresh();
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Stack gap="md">
        <TextInput
          label="Имя"
          placeholder="Как вас зовут"
          autoComplete="name"
          required
          key={form.key('name')}
          {...form.getInputProps('name')}
        />
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
          description="Не короче 8 символов"
          autoComplete="new-password"
          required
          key={form.key('password')}
          {...form.getInputProps('password')}
        />
        <PasswordInput
          label="Повторите пароль"
          autoComplete="new-password"
          required
          key={form.key('confirmPassword')}
          {...form.getInputProps('confirmPassword')}
        />
        <Button type="submit" loading={loading} fullWidth>
          Создать аккаунт
        </Button>
        <Text size="sm" c="dimmed" ta="center">
          Уже есть аккаунт?{' '}
          <Anchor component={Link} href="/login" size="sm">
            Войти
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
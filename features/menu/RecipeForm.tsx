'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus, IconX } from '@tabler/icons-react';
import { ActionIcon, Button, FileInput, Group, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { PageTopBar } from '@/features/app-shell';
import { createRecipe } from '@/server/recipes/actions';

type Row = { key: string; name: string; quantity: string };

const newRow = (): Row => ({ key: crypto.randomUUID(), name: '', quantity: '' });

// форма создания рецепта: название, ингредиенты с количеством, описание
export function RecipeForm({ householdId }: { householdId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>(() => [newRow()]);

  const update = (key: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const id = crypto.randomUUID();
    startTransition(async () => {
      const result = await createRecipe({
        id,
        householdId,
        title: trimmed,
        description: description.trim() || undefined,
        ingredients: rows
          .filter((r) => r.name.trim())
          .map((r) => ({ name: r.name.trim(), quantity: r.quantity.trim() || null })),
      });
      if (!result.ok) {
        notifications.show({ message: result.error, color: 'red' });
        return;
      }
      if (photo) {
        const body = new FormData();
        body.set('file', photo);
        body.set('kind', 'recipe');
        body.set('householdId', householdId);
        body.set('recipeId', id);
        const res = await fetch('/api/uploads', { method: 'POST', body });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: 'Не удалось загрузить фото' }));
          notifications.show({ message: `Рецепт сохранён, но фото не загружено: ${error}`, color: 'yellow' });
        }
      }
      router.push(`/budgets/${householdId}/menu/${id}`);
      router.refresh();
    });
  };

  return (
    <Stack gap="lg" maw={640}>
      <PageTopBar
        backHref={`/budgets/${householdId}/menu`}
        backLabel="К меню"
        title="Новый рецепт"
        titleAlign="left"
      />
      <form onSubmit={submit}>
        <Stack>
          <TextInput
            label="Название"
            placeholder="Например, Борщ"
            maxLength={120}
            data-autofocus
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
          <FileInput
            label="Фото блюда"
            placeholder="Выберите фото"
            accept="image/*"
            clearable
            value={photo}
            onChange={setPhoto}
          />
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Ингредиенты
            </Text>
            {rows.map((r) => (
              <Group key={r.key} gap="sm" wrap="nowrap">
                <TextInput
                  placeholder="Продукт"
                  style={{ flex: 1 }}
                  value={r.name}
                  onChange={(e) => update(r.key, { name: e.currentTarget.value })}
                />
                <TextInput
                  placeholder="Кол-во"
                  w={100}
                  value={r.quantity}
                  onChange={(e) => update(r.key, { quantity: e.currentTarget.value })}
                />
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  aria-label="Убрать ингредиент"
                  disabled={rows.length === 1}
                  onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                >
                  <IconX size={16} />
                </ActionIcon>
              </Group>
            ))}
            <Button
              variant="light"
              size="xs"
              leftSection={<IconPlus size={14} />}
              style={{ alignSelf: 'flex-start' }}
              onClick={() => setRows((rs) => [...rs, newRow()])}
            >
              Добавить ингредиент
            </Button>
          </Stack>
          <Textarea
            label="Описание"
            placeholder="Как готовить"
            autosize
            minRows={4}
            maxLength={4000}
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
          />
          <Button type="submit" loading={pending} disabled={!title.trim()}>
            Сохранить рецепт
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}

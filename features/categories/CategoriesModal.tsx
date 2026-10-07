'use client';

import { useState, useTransition } from 'react';
import {
  Button,
  CheckIcon,
  ColorSwatch,
  Group,
  Modal,
  NavLink,
  SegmentedControl,
  Stack,
  TagsInput,
  Text,
  TextInput,
  UnstyledButton
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';
import { archiveCategory, createCategory, updateCategory } from '@/server/categories/actions';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/shared/config/category-options';
import { AnimatedHeight } from '@/shared/ui/AnimatedHeight';
import { CategoryBadge } from '@/shared/ui/CategoryBadge';
import type { CategoryOption } from '@/shared/types/category';

type Type = 'expense' | 'income';

type Props = {
  opened: boolean;
  onClose: () => void;
  householdId: string;
  categories: CategoryOption[];
};

export function CategoriesModal({ opened, onClose, ...rest }: Props) {
  // без centered: верх модалки зафиксирован отступом, при смене контента меняется только низ
  return (
    <Modal opened={opened} onClose={onClose} title="Категории" size="lg" yOffset="10dvh">
      {/* содержимое пересоздаётся при каждом открытии, поэтому всегда начинается со списка */}
      <Content {...rest} />
    </Modal>
  );
}

function Content({ householdId, categories }: Omit<Props, 'opened' | 'onClose'>) {
  const [type, setType] = useState<Type>('expense');
  const [editing, setEditing] = useState<CategoryOption | 'new' | null>(null);

  if (editing) {
    return (
      <AnimatedHeight>
        <CategoryForm
          key={editing === 'new' ? 'new' : editing.id}
          householdId={householdId}
          type={editing === 'new' ? type : editing.type}
          category={editing === 'new' ? null : editing}
          onDone={() => setEditing(null)}
        />
      </AnimatedHeight>
    );
  }

  const list = categories.filter((c) => c.type === type);

  return (
    // кнопка вынесена в footer: она прижата к анимируемому нижнему краю и едет вместе с ним
    <AnimatedHeight
      footer={
        <Button fullWidth variant="light" leftSection={<IconPlus size={16} />} onClick={() => setEditing('new')}>
          Добавить категорию
        </Button>
      }
    >
      <Stack>
        <SegmentedControl
          fullWidth
          value={type}
          onChange={(v) => setType(v as Type)}
          data={[
            { value: 'expense', label: 'Расходы' },
            { value: 'income', label: 'Доходы' },
          ]}
        />

        <Stack gap={2}>
          {list.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" py="md">
              Категорий пока нет
            </Text>
          )}
          {list.map((c) => (
            <NavLink
              key={c.id}
              label={c.name}
              description={c.suggestions.length > 0 ? c.suggestions.join(', ') : undefined}
              leftSection={<CategoryBadge icon={c.icon} color={c.color} size={40} />}
              rightSection={<IconChevronRight size={16} />}
              onClick={() => setEditing(c)}
              style={{ borderRadius: 'var(--mantine-radius-md)' }}
            />
          ))}
        </Stack>
      </Stack>
    </AnimatedHeight>
  );
}

type FormProps = {
  householdId: string;
  type: Type;
  category: CategoryOption | null; // null = создание
  onDone: () => void;
};

function CategoryForm({ householdId, type, category, onDone }: FormProps) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm({
    initialValues: {
      name: category?.name ?? '',
      icon: category?.icon ?? 'tag',
      color: category?.color ?? 'blue',
      suggestions: category?.suggestions ?? [],
    },
    validate: {
      name: (v) => (v.trim() ? null : 'Введите название'),
    },
  });

  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>, success: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        notifications.show({ message: success, color: 'teal' });
        onDone();
      } else {
        notifications.show({ message: result.error, color: 'red' });
      }
    });
  };

  const handleSubmit = form.onSubmit((values) => {
    run(
      () =>
        category
          ? updateCategory({ ...values, householdId, id: category.id })
          : createCategory({ ...values, householdId, type }),
      'Сохранено',
    );
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <Group justify="space-between">
          <Button
            type="button"
            variant="subtle"
            color="gray"
            size="compact-md"
            leftSection={<IconArrowLeft size={16} />}
            onClick={onDone}
          >
            К списку
          </Button>
          <Text fw={600}>{category ? 'Редактирование' : 'Новая категория'}</Text>
        </Group>

        <TextInput
          label="Название"
          placeholder="Например, Продукты"
          maxLength={40}
          data-autofocus
          {...form.getInputProps('name')}
        />

        <div>
          <Text size="sm" fw={500} mb={8}>
            Иконка
          </Text>
          <Group gap="xs">
            {CATEGORY_ICONS.map((icon) => (
                <UnstyledButton
                key={icon}
                type="button"
                aria-label={icon}
                onClick={() => form.setFieldValue('icon', icon)}
                >
                <CategoryBadge
                    icon={icon}
                    color={form.values.color}
                    state={form.values.icon === icon ? 'selected' : 'muted'}
                />
                </UnstyledButton>
            ))}
          </Group>
        </div>

        <div>
          <Text size="sm" fw={500} mb={8}>
            Цвет
          </Text>
          <Group gap="xs">
            {CATEGORY_COLORS.map((color) => (
              <ColorSwatch
                key={color}
                component="button"
                type="button"
                size={28}
                color={`var(--mantine-color-${color}-6)`}
                aria-label={color}
                onClick={() => form.setFieldValue('color', color)}
                style={{ cursor: 'pointer', color: '#fff' }}
              >
                {form.values.color === color && <CheckIcon size={12} />}
              </ColorSwatch>
            ))}
          </Group>
        </div>

        <TagsInput
          label="Подсказки"
          description="Что обычно входит в категорию. Введите слово и нажмите Enter"
          placeholder="Например, Интернет"
          maxTags={20}
          {...form.getInputProps('suggestions')}
        />

        <Button type="submit" loading={pending && !confirmDelete}>
          Сохранить
        </Button>

        {category &&
          (confirmDelete ? (
            <Stack gap="xs">
              <Text size="sm" c="dimmed">
                Категория пропадёт из выбора, а прошлые операции сохранятся. Удалить?
              </Text>
              <Group grow>
                <Button type="button" variant="default" onClick={() => setConfirmDelete(false)}>
                  Отмена
                </Button>
                <Button
                  type="button"
                  color="red"
                  loading={pending}
                  onClick={() => run(() => archiveCategory({ householdId, id: category.id }), 'Категория удалена')}
                >
                  Удалить
                </Button>
              </Group>
            </Stack>
          ) : (
            <Button type="button" variant="subtle" color="red" onClick={() => setConfirmDelete(true)}>
              Удалить категорию
            </Button>
          ))}
      </Stack>
    </form>
  );
}
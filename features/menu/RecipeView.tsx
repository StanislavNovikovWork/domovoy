'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconShoppingCartPlus, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Button, Group, Image, List, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { PageTopBar } from '@/features/app-shell';
import type { RecipeIngredient } from '@/server/db/schema/recipe';
import { addRecipeToShopping, deleteRecipe } from '@/server/recipes/actions';
import { ConfirmModal } from '@/shared/ui/ConfirmModal';

type Props = {
  householdId: string;
  recipe: {
    id: string;
    title: string;
    description: string | null;
    photoId: string | null;
    ingredients: RecipeIngredient[];
  };
};

// детализация рецепта: ингредиенты, описание и кнопка «В список покупок»
export function RecipeView({ householdId, recipe }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toShopping = () =>
    startTransition(async () => {
      const result = await addRecipeToShopping({ householdId, recipeId: recipe.id });
      if (!result.ok) {
        notifications.show({ message: result.error, color: 'red' });
        return;
      }
      notifications.show({
        color: 'teal',
        message: (
          <Text size="sm">
            Ингредиенты добавлены в список «{result.listTitle}».{' '}
            <Link href={`/budgets/${householdId}/lists/${result.listId}`}>Открыть</Link>
          </Text>
        ),
      });
      router.refresh();
    });

  const remove = async () => {
    setConfirmDelete(false);
    await deleteRecipe({ householdId, recipeId: recipe.id });
    router.push(`/budgets/${householdId}/menu`);
    router.refresh();
  };

  return (
    <Stack gap="lg" maw={640}>
      <PageTopBar
        backHref={`/budgets/${householdId}/menu`}
        backLabel="К меню"
        title={recipe.title}
        right={
          <ActionIcon
            size="lg"
            radius="xl"
            variant="subtle"
            color="red"
            aria-label="Удалить рецепт"
            onClick={() => setConfirmDelete(true)}
          >
            <IconTrash size={18} />
          </ActionIcon>
        }
      />

      {recipe.photoId && (
        <Image
          src={`/api/files/${recipe.photoId}`}
          alt={recipe.title}
          radius="md"
          mah={360}
          fit="cover"
        />
      )}

      <Group>
        <Button
          leftSection={<IconShoppingCartPlus size={16} />}
          loading={pending}
          disabled={recipe.ingredients.length === 0}
          onClick={toShopping}
        >
          В список покупок
        </Button>
      </Group>

      <Stack gap="xs">
        <Text fw={600}>Ингредиенты</Text>
        {recipe.ingredients.length === 0 ? (
          <Text size="sm" c="dimmed">
            Ингредиенты не указаны
          </Text>
        ) : (
          <List size="sm" spacing={4}>
            {recipe.ingredients.map((i, idx) => (
              <List.Item key={idx}>
                {i.name}
                {i.quantity && (
                  <Text span c="dimmed">
                    {' '}
                    — {i.quantity}
                  </Text>
                )}
              </List.Item>
            ))}
          </List>
        )}
      </Stack>

      {recipe.description && (
        <Stack gap="xs">
          <Text fw={600}>Описание</Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
            {recipe.description}
          </Text>
        </Stack>
      )}

      <ConfirmModal
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Удалить рецепт?"
        text={`Рецепт «${recipe.title}» будет удалён.`}
        onConfirm={remove}
      />
    </Stack>
  );
}

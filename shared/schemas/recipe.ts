import { z } from 'zod';

export const ingredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: z.string().trim().max(40).nullable().optional(),
});

export const createRecipeSchema = z.object({
  id: z.uuid().optional(),
  householdId: z.uuid(),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000).optional(),
  ingredients: z.array(ingredientSchema).max(100),
});

export const recipeIdSchema = z.object({
  householdId: z.uuid(),
  recipeId: z.uuid(),
});

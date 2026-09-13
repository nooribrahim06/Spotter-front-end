import * as z from "zod";

/**
 * Spotter — Nutrition Validation Schemas
 *
 * Zod schemas for all nutrition module forms.
 * Used with @hookform/resolvers for React Hook Form integration.
 */

/* ── Create Custom Food ──────────────────────────────────── */

export const createFoodSchema = z.object({
  nameEn: z
    .string()
    .trim()
    .min(1, "Enter a food name")
    .max(100, "Food name is too long"),
  nameAr: z
    .string()
    .trim()
    .max(100, "Arabic name is too long")
    .nullable()
    .optional()
    .transform((val) => val || null),
  category: z
    .string()
    .trim()
    .max(100, "Category is too long")
    .nullable()
    .optional()
    .transform((val) => val || null),
  caloriesPer100g: z
    .number({ error: "Enter calories per 100g" })
    .min(0, "Calories cannot be negative")
    .max(1000, "Calories must be at most 1000 per 100g"),
  proteinGramsPer100g: z
    .number({ error: "Enter protein per 100g" })
    .min(0, "Protein cannot be negative")
    .max(100, "Protein must be at most 100g per 100g"),
  carbohydrateGramsPer100g: z
    .number({ error: "Enter carbohydrates per 100g" })
    .min(0, "Carbohydrates cannot be negative")
    .max(100, "Carbohydrates must be at most 100g per 100g"),
  fatGramsPer100g: z
    .number({ error: "Enter fat per 100g" })
    .min(0, "Fat cannot be negative")
    .max(100, "Fat must be at most 100g per 100g"),
});

/* ── Quick Add ───────────────────────────────────────────── */

export const quickAddSchema = z.object({
  itemName: z
    .string()
    .trim()
    .max(100, "Name is too long")
    .optional()
    .transform((val) => val || undefined),
  calories: z
    .number({ error: "Enter calories" })
    .positive("Calories must be greater than zero"),
  proteinGrams: z
    .number()
    .min(0, "Protein cannot be negative")
    .nullable()
    .optional()
    .transform((val) => val ?? null),
  carbohydrateGrams: z
    .number()
    .min(0, "Carbohydrates cannot be negative")
    .nullable()
    .optional()
    .transform((val) => val ?? null),
  fatGrams: z
    .number()
    .min(0, "Fat cannot be negative")
    .nullable()
    .optional()
    .transform((val) => val ?? null),
});

/* ── Recipe Ingredient ───────────────────────────────────── */

const recipeIngredientSchema = z.object({
  foodId: z.string().min(1, "Select a food"),
  quantityGrams: z
    .number({ error: "Enter quantity" })
    .positive("Quantity must be greater than zero"),
});

/* ── Create / Update Recipe ──────────────────────────────── */

export const createRecipeSchema = z
  .object({
    nameEn: z
      .string()
      .trim()
      .min(1, "Enter a recipe name")
      .max(100, "Recipe name is too long"),
    nameAr: z
      .string()
      .trim()
      .max(100, "Arabic name is too long")
      .nullable()
      .optional()
      .transform((val) => val || null),
    servings: z
      .number({ error: "Enter number of servings" })
      .positive("Servings must be greater than zero"),
    countryCode: z
      .string()
      .trim()
      .length(2, "Country code must be exactly 2 letters")
      .nullable()
      .optional()
      .transform((val) => (val ? val.toUpperCase() : null)),
    cuisine: z
      .string()
      .trim()
      .max(100, "Cuisine is too long")
      .nullable()
      .optional()
      .transform((val) => val || null),
    instructions: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val || null),
    ingredients: z
      .array(recipeIngredientSchema)
      .min(1, "Add at least one ingredient")
      .max(100, "Maximum 100 ingredients"),
  })
  .superRefine((data, context) => {
    // Check for duplicate food IDs
    const foodIds = data.ingredients.map((ing) => ing.foodId);
    const seen = new Set();
    for (let i = 0; i < foodIds.length; i++) {
      if (seen.has(foodIds[i])) {
        context.addIssue({
          code: "custom",
          path: ["ingredients", i, "foodId"],
          message: "This food is already in the recipe. Combine the quantities instead.",
        });
      }
      seen.add(foodIds[i]);
    }
  });

/* ── Save Meal ───────────────────────────────────────────── */

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

const foodItemSchema = z.object({
  itemType: z.literal("FOOD"),
  foodId: z.string().min(1),
  quantityGrams: z
    .number({ error: "Enter quantity" })
    .positive("Quantity must be greater than zero"),
});

const recipeItemSchema = z.object({
  itemType: z.literal("RECIPE"),
  recipeId: z.string().min(1),
  servings: z
    .number({ error: "Enter servings" })
    .positive("Servings must be greater than zero"),
});

const quickItemSchema = z.object({
  itemType: z.literal("QUICK"),
  itemName: z.string().optional(),
  calories: z.number().positive("Calories must be greater than zero"),
  proteinGrams: z.number().nullable().optional(),
  carbohydrateGrams: z.number().nullable().optional(),
  fatGrams: z.number().nullable().optional(),
});

const mealItemInputSchema = z.discriminatedUnion("itemType", [
  foodItemSchema,
  recipeItemSchema,
  quickItemSchema,
]);

export const saveMealSchema = z
  .object({
    mealType: z.enum(MEAL_TYPES, { error: "Choose a meal type" }),
    occurredAt: z.string().min(1, "Set a date and time"),
    notes: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => val || null),
    items: z
      .array(mealItemInputSchema)
      .min(1, "Add at least one item")
      .max(100, "Maximum 100 items"),
  })
  .superRefine((data, context) => {
    // Validate occurredAt is not more than 5 minutes in the future
    const occurredAt = new Date(data.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) {
      context.addIssue({
        code: "custom",
        path: ["occurredAt"],
        message: "Enter a valid date and time",
      });
      return;
    }

    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (occurredAt > fiveMinutesFromNow) {
      context.addIssue({
        code: "custom",
        path: ["occurredAt"],
        message: "Meal time cannot be more than five minutes in the future",
      });
    }

    // Check for duplicate food IDs
    const foodIds = data.items
      .filter((item) => item.itemType === "FOOD")
      .map((item) => item.foodId);
    const seenFoods = new Set();
    for (const id of foodIds) {
      if (seenFoods.has(id)) {
        context.addIssue({
          code: "custom",
          path: ["items"],
          message: "The same food cannot appear twice",
        });
        break;
      }
      seenFoods.add(id);
    }

    // Check for duplicate recipe IDs
    const recipeIds = data.items
      .filter((item) => item.itemType === "RECIPE")
      .map((item) => item.recipeId);
    const seenRecipes = new Set();
    for (const id of recipeIds) {
      if (seenRecipes.has(id)) {
        context.addIssue({
          code: "custom",
          path: ["items"],
          message: "The same recipe cannot appear twice",
        });
        break;
      }
      seenRecipes.add(id);
    }
  });

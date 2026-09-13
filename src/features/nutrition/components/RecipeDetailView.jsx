import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMealDraftStore } from "../../../stores/mealDraftStore.js";
import { formatCalories, formatNutrient } from "../nutrition.domain.js";
import MacroChips from "./MacroChips.jsx";
import NutritionBar from "./NutritionBar.jsx";
import DeleteRecipeDialog from "./DeleteRecipeDialog.jsx";
import { showSuccess, showError } from "../../../components/ui/Toast.jsx";
import styles from "./RecipeDetailView.module.css";

/**
 * Full detailed presentation of a recipe.
 */
export default function RecipeDetailView({ recipe }) {
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { addRecipeItem, mealType, initDraft } = useMealDraftStore();

  const handleAddToMeal = () => {
    // If draft not initialized, initialize with LUNCH
    if (!mealType) {
      initDraft("LUNCH");
    }

    const added = addRecipeItem(recipe.id, 1, {
      nameEn: recipe.nameEn,
      calories: recipe.caloriesPerServing,
      proteinGrams: recipe.proteinGramsPerServing,
      carbohydrateGrams: recipe.carbohydrateGramsPerServing,
      fatGrams: recipe.fatGramsPerServing,
    });

    if (!added) {
      showError("This recipe is already in your meal draft.");
    } else {
      showSuccess(`Added 1 serving of "${recipe.nameEn}" to your meal draft.`);
      navigate("/app/meals/new");
    }
  };

  const handleDeleteSuccess = () => {
    navigate("/app/meals");
  };

  return (
    <article className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.badges}>
            {recipe.isCustom ? (
              <span className={styles.badgeCustom}>Custom Recipe</span>
            ) : (
              <span className={styles.badgeGlobal}>Global Spotter Recipe</span>
            )}
            {recipe.cuisine && <span className={styles.badgeMeta}>{recipe.cuisine}</span>}
            {recipe.countryCode && <span className={styles.badgeMeta}>{recipe.countryCode}</span>}
          </div>
          <h1 className={styles.title}>{recipe.nameEn}</h1>
          {recipe.nameAr && <span className={styles.titleAr} dir="rtl">{recipe.nameAr}</span>}
        </div>

        {/* ACTIONS */}
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={handleAddToMeal}
            className={styles.addToMealBtn}
          >
            + Add to Meal
          </button>

          {recipe.canEdit && (
            <div className={styles.ownerActions}>
              <button
                type="button"
                onClick={() => navigate(`/app/recipes/${recipe.id}/edit`)}
                className={styles.editBtn}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                className={styles.deleteBtn}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      {/* NUTRITION OVERVIEW CARD */}
      <section className={styles.nutritionCard} aria-label="Nutrition per serving">
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Nutrition per Serving</h2>
          <span className={styles.servingYield}>
            Yields {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
            {recipe.totalYieldGrams ? ` · Total ~${recipe.totalYieldGrams}g` : ""}
          </span>
        </div>

        <MacroChips
          calories={recipe.caloriesPerServing}
          proteinGrams={recipe.proteinGramsPerServing}
          carbohydrateGrams={recipe.carbohydrateGramsPerServing}
          fatGrams={recipe.fatGramsPerServing}
          size="md"
        />

        <NutritionBar
          proteinGrams={recipe.proteinGramsPerServing}
          carbohydrateGrams={recipe.carbohydrateGramsPerServing}
          fatGrams={recipe.fatGramsPerServing}
        />
      </section>

      {/* INGREDIENTS LIST */}
      <section className={styles.section} aria-label="Recipe ingredients">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Ingredients</h2>
          <span className={styles.itemCount}>
            {recipe.ingredients?.length || 0} items
          </span>
        </div>

        {recipe.ingredients?.length ? (
          <ul className={styles.ingredientList}>
            {recipe.ingredients.map((ing) => {
              const factor = ing.quantityGrams / 100;
              const ingCalories = (ing.food.caloriesPer100g || 0) * factor;

              return (
                <li key={ing.id} className={styles.ingredientRow}>
                  <div className={styles.ingMain}>
                    <span className={styles.ingName}>{ing.food.nameEn}</span>
                    <span className={styles.ingQty}>{ing.quantityGrams}g</span>
                  </div>
                  <span className={styles.ingCalories}>
                    {formatCalories(ingCalories)} cal
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.emptyNote}>No ingredients recorded.</p>
        )}
      </section>

      {/* INSTRUCTIONS */}
      {recipe.instructions && (
        <section className={styles.section} aria-label="Preparation instructions">
          <h2 className={styles.sectionTitle}>Instructions</h2>
          <div className={styles.instructionsText}>
            {recipe.instructions}
          </div>
        </section>
      )}

      {/* DELETE DIALOG */}
      <DeleteRecipeDialog
        recipe={recipe}
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </article>
  );
}

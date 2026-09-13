import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecipeDetails } from "../../features/nutrition/hooks/useRecipes.js";
import RecipeForm from "../../features/nutrition/components/RecipeForm.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import PageError from "../../components/ui/PageError.jsx";
import styles from "./RecipePage.module.css";

/**
 * Page for creating a new recipe or editing an existing user-created recipe.
 */
export default function RecipePage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();

  const isEdit = Boolean(recipeId);

  const { data: recipe, isLoading, isError, refetch } = useRecipeDetails(recipeId);

  useEffect(() => {
    document.title = isEdit ? "Edit Recipe — Spotter" : "Create Recipe — Spotter";
  }, [isEdit]);

  if (isEdit && isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeleton}>
          <Skeleton height="36px" width="200px" borderRadius="8px" />
          <Skeleton height="150px" borderRadius="16px" />
          <Skeleton height="150px" borderRadius="16px" />
        </div>
      </div>
    );
  }

  if (isEdit && isError) {
    return (
      <div className={styles.page}>
        <PageError
          title="Could not load recipe"
          message="This recipe may not exist or cannot be edited."
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={styles.backBtn}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className={styles.heading}>
            {isEdit ? "Edit Recipe" : "Create Recipe"}
          </h1>
          <p className={styles.subtitle}>
            {isEdit
              ? "Updating will replace all ingredients and recalculate nutrition."
              : "Combine foods and specify serving yield. Spotter will calculate the nutrition."}
          </p>
        </div>
      </header>

      <main className={styles.content}>
        <RecipeForm
          initialRecipe={isEdit ? recipe : undefined}
          isEdit={isEdit}
          onCancel={() => navigate(-1)}
        />
      </main>
    </div>
  );
}

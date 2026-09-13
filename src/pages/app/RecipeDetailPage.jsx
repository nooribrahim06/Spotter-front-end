import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRecipeDetails } from "../../features/nutrition/hooks/useRecipes.js";
import RecipeDetailView from "../../features/nutrition/components/RecipeDetailView.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import PageError from "../../components/ui/PageError.jsx";
import styles from "./RecipeDetailPage.module.css";

/**
 * Dedicated read-only page for inspecting a recipe.
 */
export default function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();

  const { data: recipe, isLoading, isError, error, refetch } = useRecipeDetails(recipeId);

  useEffect(() => {
    if (recipe?.nameEn) {
      document.title = `${recipe.nameEn} — Spotter`;
    } else {
      document.title = "Recipe Details — Spotter";
    }
  }, [recipe?.nameEn]);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.headerSkeleton}>
          <Skeleton height="36px" width="160px" borderRadius="8px" />
          <Skeleton height="50px" width="70%" borderRadius="12px" />
        </div>
        <div className={styles.bodySkeleton}>
          <Skeleton height="140px" borderRadius="16px" />
          <Skeleton height="200px" borderRadius="16px" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.page}>
        <PageError
          title="Could not find recipe"
          message="This recipe may be private or no longer available."
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.navBar}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={styles.backBtn}
          aria-label="Go back"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>
      </div>

      <main className={styles.content}>
        <RecipeDetailView recipe={recipe} />
      </main>
    </div>
  );
}

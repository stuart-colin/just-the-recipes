import { useState, useEffect } from 'react';
import { listenToAllRecipesFromFirestore } from '@/lib/firebaseRecipeService';
import { Recipe } from '@/types'; // Assuming types are in src/types/index.ts

export function useRecipesListener() {
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [isLoadingMainRecipes, setIsLoadingMainRecipes] = useState(true);
  const [mainRecipesError, setMainRecipesError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingMainRecipes(true);
    setMainRecipesError(null);
    let unsubscribe: () => void = () => { }; // Initialize with a no-op function

    try {
      unsubscribe = listenToAllRecipesFromFirestore(
        (updatedRecipes, error) => {
          if (error) {
            console.error("useRecipesListener: Error from recipes listener:", error);
            setMainRecipesError(`Failed to load recipes. Details: ${error.message}`);
            setAllRecipes([]);
          } else if (updatedRecipes) {
            setAllRecipes(updatedRecipes as Recipe[]);
            setMainRecipesError(null);
          }
          setIsLoadingMainRecipes(false);
        }
      );
    } catch (setupError: unknown) {
      console.error("useRecipesListener: Failed to set up recipes listener:", setupError);
      const errorMessage = setupError instanceof Error ? setupError.message : String(setupError);
      setMainRecipesError(`Failed to initialize recipe display. Error: ${errorMessage}`);
      setAllRecipes([]);
      setIsLoadingMainRecipes(false);
    }
    return () => unsubscribe();
  }, []);

  return { allRecipes, isLoadingMainRecipes, mainRecipesError };
}

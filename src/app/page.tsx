import { fetchAllRecipesFromGCS } from '../lib/gcsService';
import HomePageClient from './HomePageClient'; // The Client Component we just created

// Define a more specific Recipe type if you have one
interface Recipe {
  id: string;
  [key: string]: any;
}

export default async function Page() {
  let recipes: Recipe[] = [];
  let error: string | null = null;

  try {
    // Fetching data directly in the Server Component
    const fetchedRecipes = await fetchAllRecipesFromGCS();
    recipes = fetchedRecipes.filter((recipe: any) => recipe != null) as Recipe[];
  } catch (e: any) {
    console.error("App Router Page: Error during recipe fetching process:", e.message, e.stack);
    error = "Failed to load recipes. Please try again later.";
    // Consider using Next.js error handling (e.g., error.tsx or notFound()) for more robust error UI
  }

  return (
    <HomePageClient initialRecipes={recipes} fetchError={error} />
  );
}
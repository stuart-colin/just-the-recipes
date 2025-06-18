import HomePageClient from './HomePageClient'; // The Client Component we just created
import { fetchAllRecipesFromFirestore } from '../lib/firebaseRecipeService'; // Import new service

// Define a more specific Recipe type, consistent with HomePageClient.tsx
interface Recipe {
  id: string;
  title?: string;
  author?: string;
  ingredients?: Record<string, string[]>;
  categories?: string[];
  name?: string;
  images?: { main?: string;[key: string]: string | undefined };
  description?: string;
  // Add other common recipe fields as needed
}

export default async function Page() {
  let recipes: Recipe[] = [];
  let error: string | null = null;

  try {
    // Fetching data directly in the Server Component
    const fetchedRecipes = await fetchAllRecipesFromFirestore(); // Use Firestore fetching
    // Ensure recipe is not null and is an object before treating it as Recipe
    recipes = fetchedRecipes.filter((recipe: unknown): recipe is Recipe => recipe != null && typeof recipe === 'object');
  } catch (e: unknown) {
    error = "Failed to load recipes. Please try again later.";
    if (e instanceof Error) {
      console.error("App Router Page: Error during recipe fetching process:", e.message, e.stack);
    } else {
      console.error("App Router Page: An unknown error occurred during recipe fetching:", e);
    }
    // Consider using Next.js error handling (e.g., error.tsx or notFound()) for more robust error UI
  }

  return (
    <HomePageClient initialRecipes={recipes} fetchError={error} />
  );
}
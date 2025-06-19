import { fetchRecipeBySlugFromFirestore } from '@/lib/firebaseRecipeService';
import RecipeDetail from '@/components/RecipeDetail';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Recipe } from '@/types'; // Import your Recipe type

interface RecipePageProps {
  params: {
    slug: string;
  };
  searchParams: { [key: string]: string | string[] | undefined };
}

// This function can be used for Static Site Generation if you have a known set of slugs
// export async function generateStaticParams() {
//   // Fetch all slugs from Firestore or another source
//   // const recipes = await fetchAllRecipeSlugs(); // Implement this function
//   // return recipes.map((recipe) => ({ slug: recipe.slug }));
//   return []; // Return empty for now, or implement slug fetching
// }

export default async function RecipePage({ params }: RecipePageProps) {
  const { slug } = params;
  let recipe: Recipe | null = null;

  if (slug) {
    recipe = await fetchRecipeBySlugFromFirestore(slug);
  }

  if (!recipe) {
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Recipe Not Found</h1>
        <p className="mb-6">Sorry, we couldn&apos;t find the recipe you're looking for.</p>
        <Button asChild variant="outline">
          <Link href="/">Go Back to All Recipes</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/">&larr; All Recipes</Link>
        </Button>
      </div>
      {/* Pass null for onClose as the "X" button's behavior changes on a dedicated page */}
      <RecipeDetail selectedRecipe={recipe} onClose={null} />
    </main>
  );
}
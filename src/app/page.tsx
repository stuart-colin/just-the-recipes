// Remove force-dynamic as recipes will be fetched client-side
// export const dynamic = 'force-dynamic';

import HomePageClient from './HomePageClient'; // The Client Component we just created
// Main recipes will be fetched by HomePageClient
// import { fetchAllRecipesFromFirestore } from '../lib/firebaseRecipeService';
// Recipe type would be imported from a shared types file
// import { Recipe } from '@/types';

export default async function Page() {
  // The main recipes list will now be fetched and managed by HomePageClient.
  // You might still fetch other initial data here if needed, e.g., for "Recipes to Make"
  // or other non-recipe related content. For this example, we assume only recipes were fetched here.

  // If you still fetch `recipesToMake` here, that logic would remain.
  // For example:
  // const initialRecipesToMake = await getRecipesToMakeFromFirestore();
  // const recipesToMakeError = null; // or handle errors from getRecipesToMakeFromFirestore

  return (
    <HomePageClient /* Pass any other necessary initial props, but not initialRecipes or fetchError for main list */ />
  );
}
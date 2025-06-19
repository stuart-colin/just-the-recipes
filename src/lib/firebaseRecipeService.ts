// Assuming firebaseRecipeService.ts exists and has other functions like listenToAllRecipesFromFirestore

import { db } from './firebase'; // Your Firebase config
import { collection, query, where, getDocs, limit, DocumentData, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Recipe } from '@/types'; // Your Recipe type
// import { slugify } from './utils'; // slugify might be used here if adding recipes, but not for fetching by existing slug

/**
 * Listens for real-time updates to all recipes in the Firestore collection.
 * @param callback - A function to be called with the updated recipes or an error.
 * @returns An unsubscribe function to detach the listener.
 */
export const listenToAllRecipesFromFirestore = (
  callback: (recipes: Recipe[], error?: Error) => void
): Unsubscribe => {
  const recipesCollectionRef = collection(db, 'recipes'); // Ensure 'recipes' is your collection name
  // Optionally, add orderBy if you want a default sort order, e.g., orderBy('title', 'asc')
  const q = query(recipesCollectionRef, orderBy('title'));

  const unsubscribe = onSnapshot(q,
    (querySnapshot) => {
      const recipes: Recipe[] = [];
      querySnapshot.forEach((doc) => {
        recipes.push({ id: doc.id, ...doc.data() } as Recipe);
      });
      callback(recipes, undefined); // Pass recipes, no error
    },
    (error) => {
      console.error("Error listening to recipes collection:", error);
      callback([], error); // Pass empty array and the error
    }
  );

  return unsubscribe; // Return the unsubscribe function
};

// Fetches all recipes once (e.g., for server-side rendering or specific use cases).
export const fetchAllRecipesFromFirestoreOnce = async (): Promise<Recipe[]> => {
  try {
    const recipesCollection = collection(db, 'recipes'); // Ensure this is your recipes collection name
    // Optionally, add orderBy if you want a default sort order
    const q = query(recipesCollection, orderBy('title')); // Example: order by title
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Recipe));
  } catch (error) {
    console.error("Error fetching all recipes from Firestore:", error);
    return []; // Return an empty array in case of error
  }
};

export const fetchRecipeBySlugFromFirestore = async (slug: string): Promise<Recipe | null> => {
  if (!slug) return null;
  try {
    const recipesRef = collection(db, 'recipes'); // Ensure this is your recipes collection name
    const q = query(recipesRef, where('slug', '==', slug), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const recipeDoc = querySnapshot.docs[0];
      return { id: recipeDoc.id, ...recipeDoc.data() } as Recipe;
    }
    return null;
  } catch (error) {
    console.error("Error fetching recipe by slug:", error);
    return null;
  }
};
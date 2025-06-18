// d:\Code Projects\just-the-recipes\src\lib\firebaseRecipeService.js
import { db } from './firebase'; // Your existing Firebase client-side initialization
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

const RECIPES_COLLECTION = 'recipes';

/**
 * Fetches all recipes from the Firestore 'recipes' collection.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of recipe objects.
 * @throws {Error} If fetching recipes fails.
 */
export async function fetchAllRecipesFromFirestore() {
  try {
    // console.log("Firestore Service: Fetching all recipes..."); // For debugging if needed
    const recipesCollectionRef = collection(db, RECIPES_COLLECTION);
    // Optional: Order recipes, e.g., by title or a 'createdAt' timestamp if you add one
    // const q = query(recipesCollectionRef, orderBy("title"));
    const querySnapshot = await getDocs(recipesCollectionRef); // Or getDocs(q) if using query
    const recipes = [];
    querySnapshot.forEach((doc) => {
      recipes.push({ id: doc.id, ...doc.data() });
    });
    // console.log(`Firestore Service: Successfully fetched ${recipes.length} recipes.`);
    return recipes;
  } catch (error) {
    console.error("Firestore Service: Error fetching all recipes:", error);
    throw new Error(`Failed to fetch recipes from Firestore: ${error.message}`);
  }
}

/**
 * Adds a new recipe to the Firestore 'recipes' collection.
 * This function is intended to be called from a secure backend (e.g., API route/Netlify Function).
 * @param {Object} recipeData - The recipe data object to save.
 * @returns {Promise<Object>} A promise that resolves to the newly added recipe object with its Firestore ID.
 * @throws {Error} If adding the recipe fails.
 */
export async function addRecipeToFirestore(recipeData) {
  try {
    // console.log("Firestore Service: Adding new recipe:", recipeData); // For debugging
    const recipesCollectionRef = collection(db, RECIPES_COLLECTION);

    // Add a server-side timestamp for when the recipe was created
    const recipeWithTimestamp = {
      ...recipeData,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(recipesCollectionRef, recipeWithTimestamp);
    return { id: docRef.id, ...recipeWithTimestamp };
  } catch (error) {
    console.error("Firestore Service: Error adding recipe:", error);
    throw new Error(`Failed to add recipe to Firestore: ${error.message}`);
  }
}
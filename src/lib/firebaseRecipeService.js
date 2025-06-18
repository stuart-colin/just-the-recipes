// d:\Code Projects\just-the-recipes\src\lib\firebaseRecipeService.js
import { db } from './firebase'; // Your existing Firebase client-side initialization
import { collection, getDocs, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';

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

/**
 * Listens for real-time updates to all recipes in the Firestore 'recipes' collection.
 * By default, orders them alphabetically by title.
 * @param {function(Array<Object>|null, Error|null): void} callback - A callback function that will be invoked
 *   with the array of recipe objects (or null on error) and an error object (or null on success).
 * @returns {() => void} An unsubscribe function to detach the listener.
 */
export function listenToAllRecipesFromFirestore(callback) {
  try {
    // console.log("Firestore Service: Setting up listener for all recipes..."); // For debugging
    const recipesCollectionRef = collection(db, RECIPES_COLLECTION);

    // Order recipes by title, alphabetically (ascending by default).
    // Ensure your recipe documents have a 'title' field.
    // Firestore may require an index on 'title' for this query.
    const q = query(recipesCollectionRef, orderBy("title"));
    // console.log("[firebaseRecipeService] Querying recipes ordered by title:", q); // Debug log removed

    const unsubscribe = onSnapshot(q,
      (querySnapshot) => {
        // console.log("[firebaseRecipeService] onSnapshot SUCCESS callback fired. Snapshot size:", querySnapshot.size); // Debug log removed
        const recipes = [];
        querySnapshot.forEach((doc) => {
          recipes.push({ id: doc.id, ...doc.data() });
        });
        // console.log(`[firebaseRecipeService] Listener received ${recipes.length} recipes:`, recipes); // Debug log removed
        callback(recipes, null);
      }, (error) => {
        console.error("[firebaseRecipeService] onSnapshot ERROR callback fired:", error); // Keep this for actual error reporting
        callback(null, error);
      });

    return unsubscribe;
  } catch (error) {
    // This catch is for synchronous errors during setup, not for listener errors.
    console.error("Firestore Service: Failed to set up recipes listener:", error);
    // Propagate the error so the caller knows setup failed.
    // The listener itself will call the callback with an error if it fails later.
    throw new Error(`Failed to set up recipes listener: ${error.message}`);
  }
}
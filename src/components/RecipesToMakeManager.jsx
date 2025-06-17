// Example: src/components/RecipesToMakeManager.jsx (Conceptual)
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase'; // Your Firebase config
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import AddRecipeToMakeForm from './AddRecipeToMakeForm';
import RecipesToMakeList from './RecipesToMakeList'; // Assuming this component is ready for async remove

const RECIPES_TO_MAKE_COLLECTION = 'recipesToMakeGlobal'; // Our shared collection

const RecipesToMakeManager = () => {
  const [recipesToMake, setRecipesToMake] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // For initial load
  const [isProcessingAdd, setIsProcessingAdd] = useState(false); // For add operation

  useEffect(() => {
    setIsLoading(true);
    // Set up a real-time listener
    const q = collection(db, RECIPES_TO_MAKE_COLLECTION);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setRecipesToMake(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching recipes to make: ", error);
      setIsLoading(false);
      // Handle error appropriately in UI
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  const handleAddRecipe = async (newRecipe) => {
    setIsProcessingAdd(true);
    try {
      // Check for duplicates (basic client-side check, can be enhanced)
      const duplicateQuery = query(
        collection(db, RECIPES_TO_MAKE_COLLECTION),
        where("title", "==", newRecipe.title),
        where("source", "==", newRecipe.source)
      );
      const querySnapshot = await getDocs(duplicateQuery);
      if (!querySnapshot.empty) {
        throw new Error('Recipe with this name and source already exists.');
      }

      await addDoc(collection(db, RECIPES_TO_MAKE_COLLECTION), {
        ...newRecipe,
        addedAt: serverTimestamp() // Optional: add a timestamp
      });
      // No need to manually update state, onSnapshot will do it
    } catch (error) {
      console.error("Error adding document: ", error);
      setIsProcessingAdd(false);
      throw error; // Re-throw to be caught by AddRecipeToMakeForm
    }
    setIsProcessingAdd(false);
  };

  const handleRemoveRecipe = async (recipeToRemove) => {
    // In Firestore, you need the document ID to delete.
    // The `recipeToRemove` object from RecipesToMakeList might just have title/source.
    // We need to find the corresponding document ID in our current `recipesToMake` state.
    const recipeDoc = recipesToMake.find(
      (r) => r.title === recipeToRemove.title && r.source === recipeToRemove.source
    );

    if (recipeDoc && recipeDoc.id) {
      try {
        await deleteDoc(doc(db, RECIPES_TO_MAKE_COLLECTION, recipeDoc.id));
        // Real-time listener will update the UI
      } catch (error) {
        console.error("Error removing document: ", error);
        // Handle error (e.g., show a notification)
      }
    } else {
      console.warn("Could not find recipe in local state to remove from Firebase:", recipeToRemove);
    }
  };

  if (isLoading) {
    return <p>Loading your recipes to make...</p>; // Or a spinner
  }

  return (
    <div>
      <AddRecipeToMakeForm onAddRecipe={handleAddRecipe} isProcessing={isProcessingAdd} />
      <RecipesToMakeList recipesToMake={recipesToMake} onRemoveRecipe={handleRemoveRecipe} />
    </div>
  );
};

export default RecipesToMakeManager;

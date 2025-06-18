import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { ToMakeRecipeItem } from '@/types'; // Assuming types are moved to src/types/index.ts

const RECIPES_TO_MAKE_COLLECTION = 'recipesToMakeGlobal';

export function useRecipesToMakeListener() {
  const [recipesToMake, setRecipesToMake] = useState<ToMakeRecipeItem[]>([]);
  const [isLoadingToMake, setIsLoadingToMake] = useState(true);
  // Optional: Add an error state for this listener if needed
  // const [recipesToMakeError, setRecipesToMakeError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoadingToMake(true);
    // setRecipesToMakeError(null);
    const q = query(collection(db, RECIPES_TO_MAKE_COLLECTION)); // Add orderBy('addedAt', 'desc') if you want

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: ToMakeRecipeItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ToMakeRecipeItem);
      });
      setRecipesToMake(items);
      setIsLoadingToMake(false);
    }, (error) => {
      console.error("useRecipesToMakeListener: Error fetching 'recipes to make' from Firestore: ", error);
      setIsLoadingToMake(false);
      // setRecipesToMakeError(`Failed to load 'to make' list. Details: ${error.message}`);
    });

    return () => unsubscribe();
  }, []);

  return { recipesToMake, isLoadingToMake };
}
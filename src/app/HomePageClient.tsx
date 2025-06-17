"use client"; // Mark as a Client Component

import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import RecipeDetail from '../components/RecipeDetail';
import RecipeList from '../components/RecipeList';
import Link from 'next/link';
import { Button } from "@/components/ui/button"; // Import Button
import { ClipboardList, Plus } from 'lucide-react'; // Import ClipboardList and Plus icons
import RecipesToMakeList from '../components/RecipesToMakeList';
import AddRecipeToMakeForm from '../components/AddRecipeToMakeForm';
// import { getRecipesToMake, addRecipeToMake, removeRecipeFromToMake } from '../lib/toMakeService'; // Will be replaced by Firebase logic
import { db } from '@/lib/firebase'; // Import Firebase db instance
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp // Import Timestamp for type checking
} from 'firebase/firestore';
import AddRecipeDialogContent from '../components/AddRecipeDialogContent'; // Import the new dialog content
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Import Dialog components

// Define a more specific Recipe type
interface Recipe {
  id: string;
  title?: string;
  author?: string;
  ingredients?: Record<string, string[]>;
  categories?: string[];
  name?: string; // Optional: if 'name' is used as an alternative to 'title'
  images?: { main?: string;[key: string]: string | undefined }; // Allows for a main image and other potential image keys
  description?: string;
  source?: string; // For external recipes in "To Make" list
  // Add other common recipe fields as needed (e.g., prepTime, cookTime, servings, instructions)
}

// Define a specific type for items in the "Recipes to Make" list
interface ToMakeRecipeItem {
  id?: string; // Firestore document ID
  title?: string;
  name?: string; // Optional: if 'name' is used as an alternative to 'title'
  source?: string; // Source URL is crucial for these items
  addedAt?: Timestamp | Date; // Firestore serverTimestamp
}

interface HomePageClientProps {
  initialRecipes: Recipe[];
  fetchError: string | null;
}

const RECIPES_TO_MAKE_COLLECTION = 'recipesToMakeGlobal'; // Firestore collection name

const HomePageClient: React.FC<HomePageClientProps> = ({ initialRecipes, fetchError }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipeOpenBeforeSearch, setRecipeOpenBeforeSearch] = useState<Recipe | null>(null);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false); // State for Add Recipe modal
  const [showToMakeModal, setShowToMakeModal] = useState(false); // State for modal visibility
  const [recipesToMake, setRecipesToMake] = useState<ToMakeRecipeItem[]>([]);
  const [isLoadingToMake, setIsLoadingToMake] = useState(true);
  const [isProcessingToMake, setIsProcessingToMake] = useState(false);
  const recipeDetailWrapperRef = useRef<HTMLDivElement>(null); // Ref for the new wrapper div

  const onRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setSearchTerm('');
    setRecipeOpenBeforeSearch(null);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (term) {
      if (selectedRecipe && !recipeOpenBeforeSearch) {
        setRecipeOpenBeforeSearch(selectedRecipe);
      }
      setSelectedRecipe(null);
    } else {
      setSelectedRecipe(recipeOpenBeforeSearch);
    }
  };

  const handleCloseRecipeDetail = () => {
    setSelectedRecipe(null);
    setRecipeOpenBeforeSearch(null);
  };

  // Load "to make" list from Firebase on component mount and listen for real-time updates
  useEffect(() => {
    setIsLoadingToMake(true);
    const q = query(collection(db, RECIPES_TO_MAKE_COLLECTION)); // Add orderBy('addedAt', 'desc') if you want

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: ToMakeRecipeItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as ToMakeRecipeItem);
      });
      setRecipesToMake(items);
      setIsLoadingToMake(false);
    }, (error) => {
      console.error("Error fetching 'recipes to make' from Firestore: ", error);
      setIsLoadingToMake(false);
      // Optionally set an error state to display to the user
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Scroll to RecipeDetail when a new recipe is selected and search is not active
    if (selectedRecipe && !searchTerm && recipeDetailWrapperRef.current) {
      recipeDetailWrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedRecipe, searchTerm]); // Rerun effect when selectedRecipe or searchTerm changes

  const handleAddRecipeToFirebase = async (recipeData: { title: string, source: string }) => {
    setIsProcessingToMake(true);
    try {
      // Duplicate check against Firestore
      const q = query(
        collection(db, RECIPES_TO_MAKE_COLLECTION),
        where("title", "==", recipeData.title),
        where("source", "==", recipeData.source)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        throw new Error('This recipe is already in your "To Make" list.');
      }

      await addDoc(collection(db, RECIPES_TO_MAKE_COLLECTION), {
        ...recipeData,
        addedAt: serverTimestamp()
      });
      // Real-time listener (onSnapshot) will update the UI.
      // Optionally, close the modal or provide other success feedback here.
    } catch (error: unknown) {
      console.error("Error adding recipe to Firestore: ", error);
      setIsProcessingToMake(false);
      throw error; // Re-throw to be caught by AddRecipeToMakeForm for UI error display
    }
    setIsProcessingToMake(false);
  };

  const handleRemoveRecipeFromFirebase = async (recipeId: string) => {
    if (!recipeId) {
      console.error("Cannot remove recipe: ID is missing.");
      return;
    }
    // Consider adding a processing state specific to removal if needed for individual items
    try {
      await deleteDoc(doc(db, RECIPES_TO_MAKE_COLLECTION, recipeId));
      // Real-time listener (onSnapshot) will update the UI.
    } catch (error) {
      console.error("Error removing recipe from Firestore: ", error);
      // Optionally set an error state to display to the user
    }
  };

  const filteredRecipes = initialRecipes.filter(recipe => {
    if (!recipe) return false;
    const term = searchTerm.toLowerCase();
    const titleMatch = recipe.title?.toLowerCase().includes(term);
    const authorMatch = recipe.author?.toLowerCase().includes(term);
    const ingredientsMatch = recipe.ingredients && Object.values(recipe.ingredients)
      .flat()
      .some((ingredient: string) => typeof ingredient === 'string' && ingredient.toLowerCase().includes(term));
    const categoriesMatch = recipe.categories && recipe.categories.some((category: string) => category.toLowerCase().includes(term));
    return titleMatch || authorMatch || ingredientsMatch || categoriesMatch;
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-12">
        <header className="text-center">
          <h1
            className="text-5xl mb-2 font-bold"
            style={{
              color: '#49d0ae',
              fontFamily: "var(--font-cabin-sketch), sans-serif",
            }}
          >
            <Link href="/">Just the Recipes.</Link>
          </h1>
          <p className="text-gray-600 font-sans italic">
            All of the marshmallow, none of the fluff.
          </p>
        </header>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-xl mx-auto">
          <section className="w-full md:flex-grow"> {/* Search bar takes available space */}
            <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
          </section>
          <div className="flex gap-2"> {/* Group for action buttons */}
            {/* Trigger button for the "To Make" modal */}
            <Dialog open={showToMakeModal} onOpenChange={setShowToMakeModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open 'Recipes to Make' list">
                  <ClipboardList className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Recipes to Make</DialogTitle>
                </DialogHeader>
                <AddRecipeToMakeForm
                  onAddRecipe={handleAddRecipeToFirebase}
                  isProcessing={isProcessingToMake}
                />
                {isLoadingToMake && <p className="text-center py-4">Loading list...</p>}
                {!isLoadingToMake && recipesToMake.length === 0 && <p className="text-center text-muted-foreground py-4">{'Your "Recipes to Make" list is empty.'}</p>}
                {!isLoadingToMake && recipesToMake.length > 0 && <RecipesToMakeList recipesToMake={recipesToMake} onRemoveRecipe={handleRemoveRecipeFromFirebase} />}
              </DialogContent>
            </Dialog>

            {/* Trigger button for the "Add Recipe" modal */}
            <Dialog open={showAddRecipeModal} onOpenChange={setShowAddRecipeModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Add new recipe">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-7xl max-h-[90vh] overflow-y-auto"> {/* Made wider */}
                <DialogHeader>
                  <DialogTitle>Add New Recipe</DialogTitle>
                </DialogHeader>
                <AddRecipeDialogContent onClose={() => setShowAddRecipeModal(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {fetchError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{fetchError}</span>
          </div>
        )}

        {!fetchError && selectedRecipe && !searchTerm && (
          <div ref={recipeDetailWrapperRef}> {/* Attach ref to this new wrapper div */}
            {/* Add top padding to the section to create the gap. Adjust pt-5 (1.25rem) as needed. */}
            <section className="pt-5"> {/* Example: Tailwind's pt-5 for padding-top */}
              <RecipeDetail selectedRecipe={selectedRecipe} onClose={handleCloseRecipeDetail} />
            </section>
          </div>
        )}
        {/* RecipeList is only shown when no recipe is selected OR when searching */}
        {/* The To Make list and form are now in the modal */}
        {!fetchError && (!selectedRecipe || searchTerm) && <RecipeList onRecipeSelect={onRecipeSelect} recipes={filteredRecipes} />}
      </div>
    </main>
  );
};

export default HomePageClient;
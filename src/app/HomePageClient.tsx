"use client"; // Mark as a Client Component

import React, { useState, useEffect, useRef, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import RecipeDetail from '../components/RecipeDetail';
import RecipeList from '../components/RecipeList';
import Link from 'next/link';
import { Button } from "@/components/ui/button"; // Import Button
import { ClipboardList, Plus } from 'lucide-react'; // Import ClipboardList and Plus icons
import AddRecipeToMakeForm from '../components/AddRecipeToMakeForm';
import { db } from '@/lib/firebase'; // Import Firebase db instance
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import AddRecipeDialogContent from '../components/AddRecipeDialogContent'; // Import the new dialog content
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'; // Import Dialog components

import { Recipe } from '@/types'; // Import types from shared location
import { useRecipesListener } from '@/hooks/useRecipesListener';
import { useRecipesToMakeListener } from '@/hooks/useRecipesToMakeListener';
import RecipesToMakeList from '../components/RecipesToMakeList';

const RECIPES_TO_MAKE_COLLECTION = 'recipesToMakeGlobal'; // Firestore collection name

const HomePageClient: React.FC = () => {
  const { allRecipes, isLoadingMainRecipes, mainRecipesError } = useRecipesListener();
  const { recipesToMake, isLoadingToMake } = useRecipesToMakeListener();

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipeOpenBeforeSearch, setRecipeOpenBeforeSearch] = useState<Recipe | null>(null);
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false); // State for Add Recipe modal
  const [showToMakeModal, setShowToMakeModal] = useState(false); // State for modal visibility
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

  const filteredRecipes = useMemo(() => {
    if (!searchTerm) {
      return allRecipes;
    }
    const term = searchTerm.toLowerCase();
    return allRecipes.filter((recipe: Recipe) => {
      if (!recipe) return false;
      const titleMatch = recipe.title?.toLowerCase().includes(term);
      const authorMatch = recipe.author?.toLowerCase().includes(term);

      // Type for individual ingredient item after flattening
      type IngredientItem = string | { name: string; quantity: number | string | null; unit?: string; description?: string };

      const ingredientsMatch = recipe.ingredients && Object.values(recipe.ingredients)
        .flat()
        .some((ingredient: IngredientItem) => {
          if (typeof ingredient === 'string') return ingredient.toLowerCase().includes(term);
          if (ingredient && typeof ingredient.name === 'string') return ingredient.name.toLowerCase().includes(term);
          // Optionally, you could also search in ingredient.description if it exists
          return false;
        });
      const categoriesMatch = recipe.categories && recipe.categories.some((category: string) => category.toLowerCase().includes(term));
      return titleMatch || authorMatch || ingredientsMatch || categoriesMatch;
    });
  }, [allRecipes, searchTerm]);

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

        {/* Loading and Error states for the main recipe list */}
        {isLoadingMainRecipes && (
          <div className="text-center py-10">
            <p>Loading your delicious recipes...</p>
            {/* You can add a spinner component here */}
          </div>
        )}

        {!isLoadingMainRecipes && mainRecipesError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-center" role="alert">
            <strong className="font-bold">Oops! Something went wrong.</strong>
            <p>{mainRecipesError}</p>
          </div>
        )}

        {!isLoadingMainRecipes && !mainRecipesError && (
          <>
            {selectedRecipe && !searchTerm && (
              <div ref={recipeDetailWrapperRef}>
                <section className="pt-5">
                  <RecipeDetail selectedRecipe={selectedRecipe} onClose={handleCloseRecipeDetail} />
                </section>
              </div>
            )}
            {(!selectedRecipe || searchTerm) && (
              filteredRecipes.length > 0 ? (
                <RecipeList onRecipeSelect={onRecipeSelect} recipes={filteredRecipes} />
              ) : (
                <div className="text-center py-10 text-muted-foreground">{searchTerm ? "No recipes match your search." : "No recipes yet. Why not add one?"}</div>
              )
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default HomePageClient;
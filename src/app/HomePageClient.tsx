"use client"; // Mark as a Client Component

import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import RecipeDetail from '../components/RecipeDetail';
import RecipeList from '../components/RecipeList';
import Link from 'next/link';
import { Button } from "@/components/ui/button"; // Import Button
import { ClipboardList } from 'lucide-react'; // Import ClipboardList icon
import RecipesToMakeList from '../components/RecipesToMakeList';
import AddRecipeToMakeForm from '../components/AddRecipeToMakeForm';
import { getRecipesToMake, addRecipeToMake, removeRecipeFromToMake } from '../lib/toMakeService';
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
  title?: string;
  name?: string; // Optional: if 'name' is used as an alternative to 'title'
  source?: string; // Source URL is crucial for these items
}

interface HomePageClientProps {
  initialRecipes: Recipe[];
  fetchError: string | null;
}

const HomePageClient: React.FC<HomePageClientProps> = ({ initialRecipes, fetchError }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipeOpenBeforeSearch, setRecipeOpenBeforeSearch] = useState<Recipe | null>(null);
  const [showToMakeModal, setShowToMakeModal] = useState(false); // State for modal visibility
  const [recipesToMake, setRecipesToMake] = useState<ToMakeRecipeItem[]>([]);
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

  // Load "to make" list from localStorage on component mount
  useEffect(() => {
    // getRecipesToMake() returns items matching ToMakeRecipeItem structure
    setRecipesToMake(getRecipesToMake() as ToMakeRecipeItem[]);
  }, []);

  useEffect(() => {
    // Scroll to RecipeDetail when a new recipe is selected and search is not active
    if (selectedRecipe && !searchTerm && recipeDetailWrapperRef.current) {
      recipeDetailWrapperRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedRecipe, searchTerm]); // Rerun effect when selectedRecipe or searchTerm changes

  const handleToggleToMakeRecipe = (recipeInfo: ToMakeRecipeItem) => {
    const recipeTitle = recipeInfo.title || recipeInfo.name;
    if (!recipeTitle || !recipeInfo.source) {
      console.warn("Cannot toggle recipe without title/name and source from 'To Make' list.", recipeInfo);
      return false; // Indicate failure
    }
    const currentList: ToMakeRecipeItem[] = getRecipesToMake(); // Explicitly type currentList or type 'r' below
    let success;
    if (currentList.some((r: ToMakeRecipeItem) => (r.title || r.name) === recipeTitle && r.source === recipeInfo.source)) {
      removeRecipeFromToMake(recipeTitle, recipeInfo.source!); // Use non-null assertion
      console.log(`Removed "${recipeTitle}" from 'To Make' list.`);
      success = true; // Assuming remove always succeeds if item was there
    } else {
      // Pass only necessary info, ensuring 'name' is also considered if 'title' is absent
      success = addRecipeToMake({ title: recipeTitle, source: recipeInfo.source!, name: recipeInfo.name });
      console.log(`Attempted to add "${recipeTitle}" to 'To Make' list. Success: ${success}`);
    }
    setRecipesToMake(getRecipesToMake() as ToMakeRecipeItem[]); // Update state to re-render list from storage
    // Optionally close modal on successful add: if (success && !currentList.some(...)) setShowToMakeModal(false);
    return success;
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
          {/* Trigger button for the "To Make" modal */}
          <Dialog open={showToMakeModal} onOpenChange={setShowToMakeModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open 'Recipes to Make' list">
                <ClipboardList className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto"> {/* Adjust max-width and add scrolling */}
              <DialogHeader>
                <DialogTitle>Recipes to Make</DialogTitle>
              </DialogHeader>
              {/* Render the form and list inside the modal */}
              <AddRecipeToMakeForm onAddRecipe={handleToggleToMakeRecipe} />
              <RecipesToMakeList recipesToMake={recipesToMake} onRemoveRecipe={handleToggleToMakeRecipe} />
            </DialogContent>
          </Dialog>
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
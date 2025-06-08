"use client"; // Mark as a Client Component

import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import RecipeDetail from '../components/RecipeDetail';
import RecipeList from '../components/RecipeList';
import Link from 'next/link';

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
  // Add other common recipe fields as needed (e.g., prepTime, cookTime, servings, instructions)
}

interface HomePageClientProps {
  initialRecipes: Recipe[];
  fetchError: string | null;
}

const HomePageClient: React.FC<HomePageClientProps> = ({ initialRecipes, fetchError }) => {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [recipeOpenBeforeSearch, setRecipeOpenBeforeSearch] = useState<Recipe | null>(null);

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
              fontFamily: "var(--font-cabin-sketch), cursive", // Use the CSS variable
            }}
          >
            <Link href="/" legacyBehavior><a>Just the Recipes.</a></Link>
          </h1>
          <p className="text-gray-600 font-sans italic">
            All of the marshmallow, none of the fluff.
          </p>
        </header>

        <section className="w-full max-w-xl mx-auto">
          <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
        </section>

        {fetchError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{fetchError}</span>
          </div>
        )}

        {!fetchError && selectedRecipe && !searchTerm && <RecipeDetail selectedRecipe={selectedRecipe} onClose={handleCloseRecipeDetail} />}
        {!fetchError && (!selectedRecipe || searchTerm) && <RecipeList onRecipeSelect={onRecipeSelect} recipes={filteredRecipes} />}
      </div>
    </main>
  );
};

export default HomePageClient;
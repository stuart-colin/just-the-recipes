import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import RecipeDetail from '../components/RecipeDetail';
import RecipeList from '../components/RecipeList';
import Link from 'next/link';
import { fetchAllRecipesFromGCS } from '../lib/gcsService'; // Assuming you create this file
// import Filters from '../components/Filters';
// import SideBar from '../components/SideBar';

export async function getServerSideProps() {
  let recipes = [];
  let error = null;

  try {
    recipes = await fetchAllRecipesFromGCS();
  } catch (e) {
    console.log('test')
    console.error("getServerSideProps: Error during recipe fetching process:", e.message, e.stack);
    error = "Failed to load recipes. Please try again later.";
  }

  return {
    props: {
      // Filter out any null or undefined items from the recipes array
      initialRecipes: recipes.filter(recipe => recipe != null),
      fetchError: error,
    },
  };
}

const HomePage = ({ initialRecipes, fetchError }) => {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const onRecipeSelect = (recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleCloseRecipeDetail = () => {
    setSelectedRecipe(null);
  };

  const filteredRecipes = initialRecipes.filter(recipe => {
    if (!recipe) return false;
    const term = searchTerm.toLowerCase();
    const titleMatch = recipe.title?.toLowerCase().includes(term);
    const authorMatch = recipe.author?.toLowerCase().includes(term);
    // Basic ingredient search: checks if any ingredient string contains the term
    // This assumes ingredients are structured as { "Component": ["ingredient string 1", "ingredient string 2"] }
    const ingredientsMatch = recipe.ingredients && Object.values(recipe.ingredients)
      .flat()
      .some(ingredient => typeof ingredient === 'string' && ingredient.toLowerCase().includes(term));

    // More sophisticated ingredient search might check item.name if ingredients are objects
    const categoriesMatch = recipe.categories && recipe.categories.some(category => category.toLowerCase().includes(term));

    return titleMatch || authorMatch || ingredientsMatch || categoriesMatch;
  });

  return (
    <main className="container mx-auto px-4 py-8">
      {/* <div>
        <SideBar />
      </div> */}
      <div className="flex flex-col space-y-12"> {/* Main vertical spacing between sections */}
        {/* Header Section */}
        <header className="text-center">
          <h1
            className="text-5xl mb-2 font-bold"
            style={{
              color: '#49d0ae',
              fontFamily: "Cabin Sketch, sans serif",
            }}
          >
            <Link href="/" legacyBehavior>
              <a>
                Just the Recipes.
              </a>
            </Link>
          </h1>
          <p className="text-gray-600 font-sans italic"> {/* Kept original margins */}
            All of the marshmallow, none of the fluff.
          </p>
        </header>

        {/* SearchBar Section - Placed within a section for semantic structure and potential future styling */}
        <section className="w-full max-w-xl mx-auto"> {/* Centered and max-width for search bar */}
          <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
        </section>

        {fetchError &&
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{fetchError}</span>
            </div>
          </div>
        }

        {/* RecipeDetail Section */}
        {!fetchError &&
          <section>
            <RecipeDetail selectedRecipe={selectedRecipe} onClose={handleCloseRecipeDetail} />
          </section>
        }

        {/* <div className="ui basic segment">{/* <Filters /> * /}</div> */} {/* Filters placeholder, can be removed or styled */}

        {/* RecipeList Section */}
        {!fetchError &&
          <section>
            <RecipeList
              onRecipeSelect={onRecipeSelect}
              recipes={filteredRecipes}
            />
          </section>
        }
      </div>
    </main>
  );
};

export default HomePage;

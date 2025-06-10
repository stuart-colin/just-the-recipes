const TO_MAKE_STORAGE_KEY = 'recipesToMake';

export const getRecipesToMake = () => {
  if (typeof window === 'undefined') {
    return [];
  }
  const storedRecipes = localStorage.getItem(TO_MAKE_STORAGE_KEY);
  return storedRecipes ? JSON.parse(storedRecipes) : [];
};

// Recipe to add should ideally have 'title' (or 'name') and 'source'
export const addRecipeToMake = (recipe) => {
  if (typeof window === 'undefined' || !recipe || !(recipe.title || recipe.name) || !recipe.source) {
    console.warn("Cannot add recipe without title/name and source to 'To Make' list.", recipe);
    return false;
  }
  const recipes = getRecipesToMake();
  const recipeTitle = recipe.title || recipe.name;
  // Prevent duplicates based on title and source
  if (!recipes.some(r => (r.title || r.name) === recipeTitle && r.source === recipe.source)) {
    // Store only necessary info to keep localStorage light
    recipes.push({ title: recipeTitle, source: recipe.source, name: recipe.name });
    localStorage.setItem(TO_MAKE_STORAGE_KEY, JSON.stringify(recipes));
    return true;
  }
  return false; // Already exists
};

export const removeRecipeFromToMake = (recipeTitle, recipeSource) => {
  if (typeof window === 'undefined') {
    return;
  }
  let recipes = getRecipesToMake();
  recipes = recipes.filter(r => !((r.title || r.name) === recipeTitle && r.source === recipeSource));
  localStorage.setItem(TO_MAKE_STORAGE_KEY, JSON.stringify(recipes));
};

export const isRecipeInToMakeList = (recipeTitle, recipeSource) => {
  if (typeof window === 'undefined') {
    return false;
  }
  const recipes = getRecipesToMake();
  return recipes.some(r => (r.title || r.name) === recipeTitle && r.source === recipeSource);
};
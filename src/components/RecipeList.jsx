import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // Adjust path if your ui components are elsewhere
import StarRating from './StarRating'; // Import the StarRating component

const RecipeList = ({ recipes: recipeItems, onRecipeSelect }) => { // Destructure props
  const renderedRecipes = recipeItems.map((recipe) => {
    return (
      <Card
        key={recipe.title}
        className="cursor-pointer hover:shadow-lg transition-shadow gap-0 p-0"
        onClick={() => onRecipeSelect(recipe)}
      >
        <CardHeader className="p-0"> {/* Remove padding if image is edge-to-edge */}
          {recipe?.images?.main && (
            <img
              alt={recipe.title || recipe.name || 'Recipe Image'}
              src={recipe.images.main}
              className="w-full h-36 object-cover rounded-t-lg"
            />
          )}
        </CardHeader>
        <CardContent className="p-3">
          <CardTitle className="text-xl font-semibold mb-1">{recipe.title || recipe.name || 'Untitled Recipe'}</CardTitle>
          <div className="flex items-center justify-between mb-2"> {/* Container for author and rating */}
            {recipe?.author && (
              <CardDescription className="text-sm text-muted-foreground">
                By: {recipe.author}
              </CardDescription>
            )}
            {recipe?.rating && (recipe.rating.average > 0 || recipe.rating.votes > 0) && ( // Show rating if available and meaningful
              (<StarRating average={recipe.rating.average} votes={recipe.rating.votes} />)
            )}
          </div>
          {recipe?.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
              {recipe.description}
            </p>
          )}
        </CardContent>
        {/* Footer: Renders if there's time info OR categories */}
        {(recipe?.prep_time || recipe?.cook_time || recipe?.total_time || (recipe.categories && recipe.categories.length > 0)) && (
          <CardFooter className="p-3 pt-0 text-xs flex flex-col items-start"> {/* Ensure footer content stacks vertically and aligns left */}
            {(recipe?.prep_time || recipe?.cook_time || recipe?.total_time) && (
              <div className="text-muted-foreground mb-3">
                <span>
                  {recipe?.prep_time && `Prep: ${recipe.prep_time}`}
                  {recipe?.cook_time && `${recipe?.prep_time ? ' | ' : ''}Cook: ${recipe.cook_time}`}
                  {recipe?.total_time && `${(recipe?.prep_time || recipe?.cook_time) ? ' | ' : ''}Total: ${recipe.total_time}`}
                </span>
              </div>
            )}
            {recipe.categories && recipe.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {recipe.categories.map((category) => (
                  <span key={category} className="px-1.5 py-0.5 text-[10px] leading-none bg-secondary text-secondary-foreground rounded-sm">
                    {category}
                  </span>
                ))}
              </div>
            )}
          </CardFooter>
        )}
      </Card>
    );
  });

  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-3">{renderedRecipes}</div>;
};

export default RecipeList;

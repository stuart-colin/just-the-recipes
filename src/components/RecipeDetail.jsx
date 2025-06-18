import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // Adjust path if your ui components are elsewhere
import StarRating from './StarRating';
import RecipeMetaDetails from './RecipeMetaDetails'; // Import the new component
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react'; // Import X icon

const RecipeDetail = ({ selectedRecipe, onClose }) => {
  if (!selectedRecipe) {
    return <div></div>;
  }

  // Destructure details according to the new flexible JSON format
  const {
    title,
    author, // Assuming author is a direct string
    rating,
    images, // Assuming an 'images' object with a 'main' property
    ingredients, // Assuming an object like { "Component 1": [], "Component 2": [] }
    instructions, // Assuming an object like { "Step 1": [], "Step 2": [] }
    source,
    prep_time,
    cook_time,
    total_time,
    servings: initialServingsFromRecipe, // Renamed to avoid conflict with state
    notes
  } = selectedRecipe;

  const originalServings = initialServingsFromRecipe || 1; // Base for scaling
  const [adjustedServings, setAdjustedServings] = useState(originalServings);

  useEffect(() => {
    setAdjustedServings(initialServingsFromRecipe || 1);
  }, [initialServingsFromRecipe]);

  const handleDecrementServings = () => {
    setAdjustedServings(prev => Math.max(1, prev - 1));
  };

  const handleIncrementServings = () => {
    setAdjustedServings(prev => prev + 1);
  };

  const handleResetServings = () => {
    setAdjustedServings(originalServings);
  };

  const formatQuantity = (quantity) => {
    if (typeof quantity !== 'number' || isNaN(quantity)) {
      return quantity; // Return as is if not a valid number (e.g., "a pinch")
    }

    // Handle numbers that are essentially integers (within a small tolerance)
    const epsilon = 0.001; // Tolerance for floating point inaccuracies
    if (Math.abs(quantity - Math.round(quantity)) < epsilon) {
      return Math.round(quantity).toString();
    }

    let integerPart = Math.floor(quantity);
    let decimalPart = quantity - integerPart;

    // Define common culinary fractions with their Unicode representations
    const fractions = [
      { value: 1 / 8, str: "⅛" }, // 0.125
      { value: 1 / 4, str: "¼" }, // 0.25
      { value: 1 / 3, str: "⅓" }, // 0.333...
      { value: 3 / 8, str: "⅜" }, // 0.375
      { value: 1 / 2, str: "½" }, // 0.5
      { value: 5 / 8, str: "⅝" }, // 0.625
      { value: 2 / 3, str: "⅔" }, // 0.666...
      { value: 3 / 4, str: "¾" }, // 0.75
      { value: 7 / 8, str: "⅞" }, // 0.875
    ];

    // If decimal part is very small (closer to 0 than to 1/8), treat as no fraction
    // Threshold is half of 1/8, which is 1/16 or 0.0625
    if (decimalPart < 0.0625) {
      return integerPart.toString();
    }

    // If decimal part is very close to 1 (closer to 1 than to 7/8), round up
    // Threshold is 1 - 0.0625 = 0.9375
    if (decimalPart > 0.9375) {
      return (integerPart + 1).toString();
    }

    // Find the best matching fraction
    let bestMatch = { diff: Infinity, str: "" };
    for (const frac of fractions) {
      const diff = Math.abs(decimalPart - frac.value);
      if (diff < bestMatch.diff) {
        bestMatch = { diff, str: frac.str };
      }
    }

    const fractionStr = bestMatch.str;

    if (integerPart === 0) {
      return fractionStr; // e.g., "½", "¾"
    } else {
      return `${integerPart}${fractionStr}`; // e.g., "1½", "2¾" (Unicode fractions often look best without a space)
    }
  };

  // Helper function to format the content of a single list item
  const formatListItemContent = (item, isIngredientList) => {
    let content;
    if (typeof item === 'object' && item !== null) {
      // Handle ingredient objects: {name, quantity, unit, description}
      if (item.name && typeof item.quantity !== 'undefined') {
        let currentQuantity = item.quantity;
        if (isIngredientList && originalServings > 0 && typeof item.quantity === 'number') {
          const scalingFactor = adjustedServings / originalServings;
          currentQuantity = item.quantity * scalingFactor;
        }
        const formattedDisplayQuantity = formatQuantity(currentQuantity);
        content = `${formattedDisplayQuantity} ${item.unit || ''} ${item.name}${item.description ? `, ${item.description}` : ''}`;
      }
      // Handle instruction objects if they have a specific structure, e.g., item.text
      else if (item.text && typeof item.text === 'string') {
        content = item.text;
      }
      // Fallback for other objects: display name or stringify for debugging
      else if (item.name && typeof item.name === 'string') {
        content = item.name;
      } else {
        content = JSON.stringify(item); // Or a more user-friendly message
        // console.warn('Unhandled object structure in list item:', item); // Debug log removed
      }
    } else if (typeof item === 'string') {
      content = item;
    } else {
      content = 'Invalid item data';
    }
    return content;
  };

  // Helper function to render lists grouped by components/steps
  const renderGroupedList = (items, listType = 'ul', groupKeyPrefix) => {
    if (!items || typeof items !== 'object' || Object.keys(items).length === 0) {
      return <p>Information not available.</p>;
    }
    const isIngredientList = groupKeyPrefix === 'ingredient';

    return Object.entries(items).map(([componentName, itemList]) => {
      const listItems = Array.isArray(itemList)
        ? itemList.map((item, index) => (
          <li key={`${groupKeyPrefix}-${componentName}-item-${index}`}>
            {formatListItemContent(item, isIngredientList)}
          </li>
        ))
        : null;

      return (
        <div key={`${groupKeyPrefix}-${componentName}`} className="mb-4">
          <h4 className="text-md font-semibold mb-1">{componentName}</h4>
          {listType === 'ul' ? (
            <ul className="list-disc list-inside space-y-1">{listItems}</ul>
          ) : (
            <ol className="list-decimal list-inside space-y-1">{listItems}</ol>
          )}
        </div>
      );
    });
  };

  const renderedIngredients = renderGroupedList(ingredients, 'ul', 'ingredient');
  const renderedInstructions = renderGroupedList(instructions, 'ol', 'instruction');
  const mainImage = images?.main;

  // Get secondary images from the 'gallery' array
  const secondaryImages = (images?.gallery && Array.isArray(images.gallery))
    ? images.gallery
      .filter(url => typeof url === 'string' && url.trim() !== '') // Ensure each item is a non-empty string URL
      .map((url, index) => ({ key: `gallery-${index}`, url })) // Map to an array of objects { key: 'gallery-0', url: 'path/to/img.jpg' }
    : [];


  return (
    <Card className="w-full relative"> {/* Added relative positioning for the close button */}
      <CardHeader>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8" // Positioned top-right
            onClick={onClose}
            aria-label="Close recipe details"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
        <CardTitle className="text-3xl font-bold">{title || selectedRecipe.name || 'Untitled Recipe'}</CardTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {rating && <StarRating average={rating.average} votes={rating.votes} />}
            {author && (
              <CardDescription className="text-lg ml-2">By: {author}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Moved and restyled Details section */}
        <RecipeMetaDetails
          prep_time={prep_time}
          cook_time={cook_time}
          total_time={total_time}
          initialServingsFromRecipe={initialServingsFromRecipe}
          adjustedServings={adjustedServings}
          originalServings={originalServings}
          onDecrementServings={handleDecrementServings}
          onIncrementServings={handleIncrementServings}
          onResetServings={handleResetServings}
        />

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col gap-4"> {/* Add flex and gap for stacking images */}
            {mainImage && (
              <img
                alt={title || selectedRecipe.name || 'Recipe Image'}
                src={mainImage}
                className="w-full h-auto rounded-lg object-cover aspect-square"
              />
            )}
            {/* Render secondary images */}
            {secondaryImages.map(({ key, url }) => (
              <img
                key={key} // Use the key from the object (e.g., "step1") as the key prop
                alt={`${title || selectedRecipe.name || 'Recipe'} - ${key} image`} // More descriptive alt text
                src={url}
                className="w-full h-auto rounded-lg object-cover" // Styling for secondary images
              />
            ))}

          </div>
          <div className="md:col-span-2 grid gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Ingredients</h3>
              {renderedIngredients}
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Preparation</h3>
              {renderedInstructions}
            </div>
            {notes && notes.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-md font-semibold mb-1">Notes</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {notes.map((note, index) => (
                    <li key={`note-${index}`}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground justify-end">
        {source ? (
          <>
            This recipe was originally found{' '}
            <Link
              href={source}
              className="text-primary hover:underline ml-1"
              target="_blank"
              rel="noopener noreferrer">
              here
            </Link>
            .
          </>
        ) : (
          "Source information not available."
        )}
      </CardFooter>
    </Card>
  );
};

export default RecipeDetail;

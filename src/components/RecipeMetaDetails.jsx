import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw, Plus, Minus } from 'lucide-react';

const RecipeMetaDetails = ({
  prep_time,
  cook_time,
  total_time,
  initialServingsFromRecipe,
  adjustedServings,
  originalServings,
  onDecrementServings,
  onIncrementServings,
  onResetServings,
}) => {
  if (!prep_time && !cook_time && !total_time && !initialServingsFromRecipe) {
    return null; // Don't render anything if no details are available
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 mb-6 pb-4 border-b">
      {initialServingsFromRecipe && (
        <div className="text-sm flex items-center gap-2">
          <span className="font-semibold text-muted-foreground">Servings: </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={onDecrementServings}
            disabled={adjustedServings <= 1}
            aria-label="Decrease servings"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-[2ch] text-center font-medium">{adjustedServings}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={onIncrementServings}
            aria-label="Increase servings"
          >
            <Plus className="h-4 w-4" />
          </Button>
          {adjustedServings !== originalServings && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onResetServings}
              aria-label="Reset servings"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
      {prep_time && (
        <div className="text-sm">
          <span className="font-semibold text-muted-foreground">Prep Time: </span>
          <span>{prep_time}</span>
        </div>
      )}
      {cook_time && (
        <div className="text-sm">
          <span className="font-semibold text-muted-foreground">Cook Time: </span>
          <span>{cook_time}</span>
        </div>
      )}
      {total_time && (
        <div className="text-sm">
          <span className="font-semibold text-muted-foreground">Total Time: </span>
          <span>{total_time}</span>
        </div>
      )}
    </div>
  );
};

export default RecipeMetaDetails;
import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const RecipesToMakeList = ({ recipesToMake, onRemoveRecipe }) => {
  if (!recipesToMake || recipesToMake.length === 0) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recipes to Make</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your list is empty. Add some recipes you'd like to try!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Recipes to Make</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {recipesToMake.map((recipe, index) => (
            <li key={recipe.id || `${(recipe.title || recipe.name)}-${index}`} className="flex justify-between items-center p-2 rounded hover:bg-muted/50">
              <Link href={recipe.source} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm truncate" title={recipe.title || recipe.name}>
                {recipe.title || recipe.name || 'Untitled Recipe'}
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                onClick={() => onRemoveRecipe(recipe.id)} // Pass the Firestore document ID
                aria-label={`Remove ${recipe.title || recipe.name} from list`}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default RecipesToMakeList;
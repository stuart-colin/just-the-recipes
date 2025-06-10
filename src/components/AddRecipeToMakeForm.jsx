import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const AddRecipeToMakeForm = ({ onAddRecipe }) => {
  const [recipeName, setRecipeName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors

    if (!recipeName.trim() || !sourceUrl.trim()) {
      setError('Please enter both a recipe name and a source URL.');
      return;
    }

    // Basic URL validation (can be enhanced)
    try {
      new URL(sourceUrl);
    } catch (e) {
      setError('Please enter a valid URL for the source.');
      return;
    }

    // Call the handler passed from the parent
    const success = onAddRecipe({ title: recipeName.trim(), source: sourceUrl.trim() });

    if (success) {
      // Clear form on success
      setRecipeName('');
      setSourceUrl('');
    } else {
      setError('Recipe with this name and source already exists in your list.');
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Add a Recipe to Make</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">Bookmark a recipe from anywhere on the web.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="recipeName">Recipe Name</Label>
            <Input id="recipeName" type="text" value={recipeName} onChange={(e) => setRecipeName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sourceUrl">Source URL</Label>
            <Input id="sourceUrl" type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Add to List</Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddRecipeToMakeForm;
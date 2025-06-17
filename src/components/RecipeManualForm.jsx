import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, XCircle } from 'lucide-react';
import { useDynamicList } from '@/lib/useDynamicList'; // Assuming the hook is in lib
import InlineEditable from './InlineEditable'; // Import the new component

const initialRecipeState = {
  title: '',
  author: '',
  source: '',
  servings: null,
  serving_size: '',
  calories_per_serving: null,
  prep_time: '',
  cook_time: '',
  inactive_time: '',
  total_time: '',
  rating: { average: '', votes: '' },
  categories: [],
  images: { main: '', gallery: [] },
  ingredients: [
    { id: `ingredient-group-${Date.now()}`, name: 'Main Ingredients', items: [{ name: '', quantity: null, unit: '', description: '' }] }
  ],
  instructions: [
    { id: `instruction-group-${Date.now()}`, name: 'Main Steps', steps: [''] }
  ],
  notes: [],
};


const RecipeManualForm = ({ onSubmit }) => {
  const [recipeData, setRecipeData] = useState(initialRecipeState);

  // Use custom hooks for simple dynamic lists
  const { list: categories, newItem: newCategory, setNewItem: setNewCategory, addItem: addCategory, removeItem: removeCategory, updateList: updateCategoriesList } = useDynamicList(initialRecipeState.categories);
  const { list: galleryImages, newItem: newGalleryImage, setNewItem: setNewGalleryImage, addItem: addGalleryImage, removeItem: removeGalleryImage, updateList: updateGalleryImagesList } = useDynamicList(initialRecipeState.images.gallery);
  const { list: notes, newItem: newNote, setNewItem: setNewNote, addItem: addNote, removeItem: removeNote, updateList: updateNotesList } = useDynamicList(initialRecipeState.notes);

  // Generic handler for simple top-level fields updated by InlineEditable
  const handleFieldSave = (name, value) => {
    if (name === 'servings' || name === 'calories_per_serving') {
      const numValue = parseFloat(value);
      setRecipeData(prev => ({
        ...prev,
        [name]: value === '' ? null : (isNaN(numValue) ? null : numValue)
      }));
    } else {
      setRecipeData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Specific save handler for nested fields like rating or images.main
  const handleNestedFieldSave = (parentKey, childKey, value) => {
    // Add number parsing for rating fields if needed
    setRecipeData(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value,
      },
    }));
  };


  // --- Ingredients ---
  const [newIngredientGroupName, setNewIngredientGroupName] = useState('');

  const handleAddIngredientGroup = () => {
    const trimmedGroupName = newIngredientGroupName.trim();
    const currentIngredients = Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [];
    if (trimmedGroupName && !currentIngredients.find(group => group.name === trimmedGroupName)) {
      const newGroupId = `ingredient-group-${Date.now()}-${currentIngredients.length}`;
      setRecipeData(prev => ({
        ...prev,
        ingredients: [
          ...(Array.isArray(prev.ingredients) ? prev.ingredients : []),
          { id: newGroupId, name: trimmedGroupName, items: [{ name: '', quantity: null, unit: '', description: '' }] },
        ],
      }));
      setNewIngredientGroupName('');
    } else if (currentIngredients.find(group => group.name === trimmedGroupName)) {
      alert("Ingredient group name already exists.");
    }
  };

  const handleRemoveIngredientGroup = (groupIdToRemove) => {
    setRecipeData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(group => group.id !== groupIdToRemove),
    }));
  };

  const handleIngredientGroupNameChange = (groupIdToChange, oldNameIgnored, newName) => {
    const trimmedNewName = newName.trim();
    if (trimmedNewName) {
      const nameExistsInOtherGroup = recipeData.ingredients.some(
        group => group.id !== groupIdToChange && group.name === trimmedNewName
      );
      if (nameExistsInOtherGroup) {
        alert("New ingredient group name already exists.");
        return;
      }
      setRecipeData(prev => ({
        ...prev,
        ingredients: prev.ingredients.map(group =>
          group.id === groupIdToChange ? { ...group, name: trimmedNewName } : group
        ),
      }));
    }
  };

  const handleAddIngredientItem = (groupId) => {
    setRecipeData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(group =>
        group.id === groupId
          ? { ...group, items: [...group.items, { name: '', quantity: null, unit: '', description: '' }] }
          : group
      ),
    }));
  };

  const handleRemoveIngredientItem = (groupId, itemIndexToRemove) => {
    setRecipeData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(group =>
        group.id === groupId
          ? { ...group, items: group.items.filter((_, i) => i !== itemIndexToRemove) }
          : group
      ),
    }));
  };

  const handleIngredientItemChange = (groupId, itemIndex, field, value) => {
    setRecipeData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(group => {
        if (group.id === groupId) {
          const updatedItems = group.items.map((item, idx) => {
            if (idx === itemIndex) {
              if (field === 'quantity') {
                const numValue = parseFloat(value);
                return { ...item, [field]: value === '' ? null : (isNaN(numValue) ? null : numValue) };
              }
              return { ...item, [field]: value };
            }
            return item;
          });
          return { ...group, items: updatedItems };
        }
        return group;
      }),
    }));
  };

  // --- Instructions ---
  const [newInstructionGroupName, setNewInstructionGroupName] = useState('');

  const handleAddInstructionGroup = () => {
    const trimmedGroupName = newInstructionGroupName.trim();
    const currentInstructions = Array.isArray(recipeData.instructions) ? recipeData.instructions : [];
    if (trimmedGroupName && !currentInstructions.find(group => group.name === trimmedGroupName)) {
      const newGroupId = `instr-group-${Date.now()}-${currentInstructions.length}`;
      setRecipeData(prev => ({
        ...prev,
        instructions: [
          ...(Array.isArray(prev.instructions) ? prev.instructions : []),
          { id: newGroupId, name: trimmedGroupName, steps: [''] },
        ]
      }));
      setNewInstructionGroupName('');
    } else if (currentInstructions.find(group => group.name === trimmedGroupName)) {
      alert("Instruction group name already exists.");
    }
  };

  const handleRemoveInstructionGroup = (groupIdToRemove) => {
    setRecipeData(prev => ({
      ...prev,
      instructions: prev.instructions.filter(group => group.id !== groupIdToRemove),
    }));
  };

  const handleInstructionGroupNameChange = (groupIdToChange, oldNameIgnored, newName) => {
    const trimmedNewName = newName.trim();
    if (trimmedNewName) {
      const nameExistsInOtherGroup = recipeData.instructions.some(
        group => group.id !== groupIdToChange && group.name === trimmedNewName
      );
      if (nameExistsInOtherGroup) {
        alert("New instruction group name already exists.");
        return;
      }
      setRecipeData(prev => ({
        ...prev,
        instructions: prev.instructions.map(group =>
          group.id === groupIdToChange ? { ...group, name: trimmedNewName } : group
        ),
      }));
    }
  };

  const handleAddInstructionStep = (groupId) => {
    setRecipeData(prev => ({
      ...prev,
      instructions: prev.instructions.map(group =>
        group.id === groupId ? { ...group, steps: [...group.steps, ''] } : group
      ),
    }));
  };

  const handleRemoveInstructionStep = (groupId, stepIndexToRemove) => {
    setRecipeData(prev => ({
      ...prev,
      instructions: prev.instructions.map(group =>
        group.id === groupId ? { ...group, steps: group.steps.filter((_, i) => i !== stepIndexToRemove) } : group
      ),
    }));
  };

  const handleInstructionStepChange = (groupId, stepIndex, value) => {
    setRecipeData(prev => ({
      ...prev,
      instructions: prev.instructions.map(group => {
        if (group.id === groupId) {
          const updatedSteps = [...group.steps];
          updatedSteps[stepIndex] = value;
          return { ...group, steps: updatedSteps };
        }
        return group;
      }),
    }));
  };

  const handleFullSubmit = async (e) => {
    e.preventDefault();
    if (!recipeData.title.trim()) {
      alert("Recipe title is required.");
      return;
    }

    const ingredientsForSubmission = {};
    (Array.isArray(recipeData.ingredients) ? recipeData.ingredients : []).forEach(group => {
      if (group.name.trim()) {
        const nonEmptyItems = group.items.filter(
          item => item.name?.trim() || (item.quantity !== null && item.quantity?.toString().trim()) || item.unit?.trim() || item.description?.trim()
        );
        if (nonEmptyItems.length > 0) {
          ingredientsForSubmission[group.name.trim()] = nonEmptyItems;
        }
      }
    });

    const instructionsForSubmission = {};
    (Array.isArray(recipeData.instructions) ? recipeData.instructions : []).forEach(group => {
      if (group.name.trim()) {
        const nonEmptySteps = group.steps.filter(step => step.trim());
        if (nonEmptySteps.length > 0) {
          instructionsForSubmission[group.name.trim()] = nonEmptySteps;
        }
      }
    });

    const finalRecipeData = {
      ...recipeData,
      categories: categories,
      images: { ...recipeData.images, gallery: galleryImages },
      notes: notes,
      ingredients: ingredientsForSubmission,
      instructions: instructionsForSubmission
    };

    const success = await onSubmit(finalRecipeData);
    if (success) {
      setRecipeData(initialRecipeState);
      updateCategoriesList(initialRecipeState.categories);
      updateGalleryImagesList(initialRecipeState.images.gallery);
      updateNotesList(initialRecipeState.notes);
    }
  };

  return (
    <form onSubmit={handleFullSubmit} className="space-y-6 text-sm">
      <div className="border rounded-lg p-4">
        <div className="mb-4 pb-4 border-b">
          <h2 className="text-3xl font-bold mb-1">
            <InlineEditable
              value={recipeData.title}
              onSave={(value) => handleFieldSave('title', value)}
              placeholder="Recipe Title"
              inputClassName="text-3xl font-bold"
              displayClassName="text-3xl font-bold"
            />
          </h2>
          <div className="text-lg text-muted-foreground">
            By: <InlineEditable
              value={recipeData.author}
              onSave={(value) => handleFieldSave('author', value)}
              placeholder="Author Name"
              inputClassName="text-lg"
              displayClassName="text-lg"
            />
          </div>
          <div className="mt-1 text-sm">
            Rating: <InlineEditable value={recipeData.rating.average} onSave={(v) => handleNestedFieldSave('rating', 'average', v)} placeholder="Avg" inputType="number" inputClassName="w-16 text-sm" displayClassName="text-sm" />
            {' / '}
            <InlineEditable value={recipeData.rating.votes} onSave={(v) => handleNestedFieldSave('rating', 'votes', v)} placeholder="Votes" inputType="number" inputClassName="w-16 text-sm" displayClassName="text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 pb-4 border-b">
          <div className="text-sm">
            <span className="font-semibold text-muted-foreground">Servings: </span>
            <InlineEditable value={recipeData.servings} onSave={(v) => handleFieldSave('servings', v)} placeholder="e.g. 4" inputType="number" inputClassName="w-16 text-sm" displayClassName="text-sm" />
          </div>
          <div className="text-sm">
            <span className="font-semibold text-muted-foreground">Serving Size: </span>
            <InlineEditable value={recipeData.serving_size} onSave={(v) => handleFieldSave('serving_size', v)} placeholder="e.g. 1 cup" inputClassName="text-sm" displayClassName="text-sm" />
          </div>
          <div className="text-sm">
            <span className="font-semibold text-muted-foreground">Calories/Serving: </span>
            <InlineEditable value={recipeData.calories_per_serving} onSave={(v) => handleFieldSave('calories_per_serving', v)} placeholder="e.g. 250" inputType="number" inputClassName="w-20 text-sm" displayClassName="text-sm" />
          </div>
          <div className="text-sm">
            <span className="font-semibold text-muted-foreground">Prep Time: </span>
            <InlineEditable value={recipeData.prep_time} onSave={(v) => handleFieldSave('prep_time', v)} placeholder="e.g. 15 mins" inputClassName="text-sm" displayClassName="text-sm" />
          </div>
          <div className="text-sm">
            <span className="font-semibold text-muted-foreground">Cook Time: </span>
            <InlineEditable value={recipeData.cook_time} onSave={(v) => handleFieldSave('cook_time', v)} placeholder="e.g. 30 mins" inputClassName="text-sm" displayClassName="text-sm" />
          </div>
          <div className="text-sm">
            <span className="font-semibold text-muted-foreground">Inactive Time: </span>
            <InlineEditable value={recipeData.inactive_time} onSave={(v) => handleFieldSave('inactive_time', v)} placeholder="e.g. 1 hr" inputClassName="text-sm" displayClassName="text-sm" />
          </div>
          <div className="text-sm">
            <span className="font-semibold text-muted-foreground">Total Time: </span>
            <InlineEditable value={recipeData.total_time} onSave={(v) => handleFieldSave('total_time', v)} placeholder="e.g. 45 mins" inputClassName="text-sm" displayClassName="text-sm" />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div>
              {/* <Label className="font-semibold text-muted-foreground block mb-1">Main Image URL</Label> */}
              {recipeData.images.main ? (
                <img src={recipeData.images.main} alt="Main recipe" className="w-full h-auto rounded-lg object-cover aspect-square mb-2" />
              ) : (
                <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground mb-2">
                  <span>Add Main Image</span>
                </div>
              )}
              <InlineEditable
                value={recipeData.images.main}
                onSave={(value) => handleNestedFieldSave('images', 'main', value)}
                placeholder="Enter Main Image URL"
                inputType="url"
                inputClassName="w-full text-xs"
                displayClassName="text-xs"
              />
            </div>
            <div>
              <Label className="font-semibold text-muted-foreground block mb-1">Gallery Image URLs</Label>
              {galleryImages.map((imgUrl, index) => (
                <div key={`gallery-${index}`} className="flex items-center gap-2 mb-2">
                  <span className="text-xs truncate flex-grow" title={imgUrl}>{imgUrl || "Empty URL"}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeGalleryImage(index)} aria-label="Remove gallery image">
                    <XCircle className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input placeholder="New gallery image URL" type="url" value={newGalleryImage} onChange={(e) => setNewGalleryImage(e.target.value)} className="text-sm h-9" />
                <Button type="button" onClick={addGalleryImage} size="icon" variant="ghost" aria-label="Add gallery image"><PlusCircle className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Ingredients</h3>
              {(Array.isArray(recipeData.ingredients) ? recipeData.ingredients : []).map((group) => (
                <div key={group.id} className="flex items-center gap-2 mb-4"> {/* Changed items-start to items-center */}
                  <div className="flex-grow p-3 border rounded-md bg-muted/5"> {/* Group content with border */}
                    <InlineEditable
                      value={group.name}
                      onSave={(newName) => handleIngredientGroupNameChange(group.id, group.name, newName)}
                      placeholder="Group Name"
                      inputClassName="font-semibold text-md"
                      displayClassName="font-semibold text-md mb-2 block"
                    />
                    {group.items.map((item, itemIndex) => (
                      <div key={`item-${group.id}-${itemIndex}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-1 items-center text-sm">
                        <div className="sm:col-span-1">
                          <InlineEditable value={item.quantity} onSave={(v) => handleIngredientItemChange(group.id, itemIndex, 'quantity', v)} placeholder="Qty" inputType="number" inputClassName="w-full text-sm h-7" displayClassName="text-sm" />
                        </div>
                        <div className="sm:col-span-2">
                          <InlineEditable value={item.unit} onSave={(v) => handleIngredientItemChange(group.id, itemIndex, 'unit', v)} placeholder="Unit" inputClassName="w-full text-sm h-7" displayClassName="text-sm" />
                        </div>
                        <div className="sm:col-span-5">
                          <InlineEditable value={item.name} onSave={(v) => handleIngredientItemChange(group.id, itemIndex, 'name', v)} placeholder="Ingredient Name" inputClassName="w-full text-sm h-7" displayClassName="text-sm" />
                        </div>
                        <div className="sm:col-span-3">
                          <InlineEditable value={item.description} onSave={(v) => handleIngredientItemChange(group.id, itemIndex, 'description', v)} placeholder="Description" inputClassName="w-full text-sm h-7" displayClassName="text-sm" />
                        </div>
                        <div className="sm:col-span-1 flex justify-end">
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngredientItem(group.id, itemIndex)} aria-label="Remove ingredient item" className="h-6 w-6">
                            <XCircle className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleAddIngredientItem(group.id)} className="mt-2" aria-label="Add ingredient">
                      <PlusCircle className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Remove Group Button - now a sibling to the bordered group content */}
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngredientGroup(group.id)} aria-label="Remove ingredient group" className="flex-shrink-0"> {/* Removed mt-1 */}
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <Input placeholder="New Ingredient Group Name" value={newIngredientGroupName} onChange={(e) => setNewIngredientGroupName(e.target.value)} className="h-9 text-sm flex-grow" />
                <Button type="button" onClick={handleAddIngredientGroup} size="icon" variant="ghost" aria-label="Add ingredient group"><PlusCircle className="h-4 w-4" /></Button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Preparation</h3>
              {(Array.isArray(recipeData.instructions) ? recipeData.instructions : []).map((group) => (
                <div key={group.id} className="flex items-center gap-2 mb-4"> {/* Changed items-start to items-center */}
                  <div className="flex-grow p-3 border rounded-md bg-muted/5"> {/* Group content with border */}
                    <InlineEditable
                      value={group.name}
                      onSave={(newName) => handleInstructionGroupNameChange(group.id, group.name, newName)}
                      placeholder="Instruction Group Name"
                      inputClassName="font-semibold text-md"
                      displayClassName="font-semibold text-md mb-2 block"
                    />
                    {group.steps.map((step, stepIndex) => (
                      <div key={`step-${group.id}-${stepIndex}`} className="flex items-center gap-2 mb-1">
                        <div className="flex-grow">
                          <InlineEditable
                            value={step}
                            onSave={(v) => handleInstructionStepChange(group.id, stepIndex, v)}
                            placeholder={`Step ${stepIndex + 1}`}
                            inputType="textarea"
                            inputClassName="w-full text-sm"
                            displayClassName="text-sm w-full"
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInstructionStep(group.id, stepIndex)} aria-label="Remove step" className="h-6 w-6 self-start">
                          <XCircle className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button type="button" size="icon" variant="ghost" onClick={() => handleAddInstructionStep(group.id)} className="mt-2" aria-label="Add step">
                      <PlusCircle className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Remove Group Button - now a sibling to the bordered group content */}
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInstructionGroup(group.id)} aria-label="Remove instruction group" className="flex-shrink-0"> {/* Removed mt-1 */}
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <Input placeholder="New Instruction Group Name" value={newInstructionGroupName} onChange={(e) => setNewInstructionGroupName(e.target.value)} className="h-9 text-sm flex-grow" />
                <Button type="button" onClick={handleAddInstructionGroup} size="icon" variant="ghost" aria-label="Add instruction group"><PlusCircle className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Label className="font-semibold text-muted-foreground block mb-1">Categories</Label>
              {categories.map((cat, index) => (
                <div key={`cat-${index}`} className="flex items-center gap-2 mb-1 text-xs">
                  <span className="truncate flex-grow">{cat}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(index)} aria-label="Remove category" className="h-4 w-4">
                    <XCircle className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input placeholder="New category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="text-sm h-9" />
                <Button type="button" onClick={addCategory} size="icon" variant="ghost" aria-label="Add category"><PlusCircle className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <Label className="font-semibold text-muted-foreground block mb-1">Notes</Label>
              {notes.map((note, index) => (
                <div key={`note-${index}`} className="flex items-center gap-2 mb-1 text-xs">
                  <span className="truncate flex-grow">{note}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeNote(index)} aria-label="Remove note" className="h-4 w-4">
                    <XCircle className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Input placeholder="New note" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="text-sm h-9" /> {/* Changed from Textarea to Input */}
                <Button type="button" onClick={addNote} size="icon" variant="ghost" aria-label="Add note"><PlusCircle className="h-4 w-4" /></Button>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
          Source URL: <InlineEditable
            value={recipeData.source}
            onSave={(value) => handleFieldSave('source', value)}
            placeholder="Enter Source URL"
            inputType="url"
            inputClassName="w-full text-sm"
            displayClassName="text-primary hover:underline"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">Submit Recipe</Button>
    </form>
  );
};

export default RecipeManualForm;

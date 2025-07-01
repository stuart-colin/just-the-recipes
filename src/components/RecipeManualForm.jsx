import React, { useState, useReducer } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, XCircle } from 'lucide-react';
import { useDynamicList } from '@/hooks/useDynamicList'; // Assuming the hook is in lib
import { slugify } from '@/lib/utils'; // Import slugify
import InlineEditable from './InlineEditable';
import RecipeSectionGroup from './RecipeSectionGroup';

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
    { id: `ingredient-group-${Date.now()}`, title: 'Main Ingredients', items: [{ name: '', quantity: null, unit: '', description: '' }] }
  ],
  instructions: [
    { id: `preparation-group-${Date.now()}`, title: 'Main Steps', steps: [''] }
  ],
  notes: [],
};

// Reducer function to manage recipeData state
const recipeReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_FIELD': {
      const { name, value } = action.payload;
      if (name === 'servings' || name === 'calories_per_serving') {
        const numValue = parseFloat(value);
        return { ...state, [name]: value === '' ? null : (isNaN(numValue) ? null : numValue) };
      }
      return { ...state, [name]: value };
    }
    case 'UPDATE_NESTED_FIELD': {
      const { parentKey, childKey, value } = action.payload;
      return {
        ...state,
        [parentKey]: {
          ...state[parentKey],
          [childKey]: value,
        },
      };
    }
    case 'ADD_INGREDIENT_GROUP': {
      const { title, id } = action.payload;
      const currentIngredients = Array.isArray(state.ingredients) ? state.ingredients : [];
      return {
        ...state,
        ingredients: [...currentIngredients, { id, title, items: [{ name: '', quantity: null, unit: '', description: '' }] }],
      };
    }
    case 'REMOVE_INGREDIENT_GROUP':
      return { ...state, ingredients: state.ingredients.filter(group => group.id !== action.payload.groupId) };
    case 'UPDATE_INGREDIENT_GROUP_NAME': {
      const { groupId, newName } = action.payload;
      return {
        ...state,
        ingredients: state.ingredients.map(group => group.id === groupId ? { ...group, title: newName } : group),
      };
    }
    case 'ADD_INGREDIENT_ITEM': {
      const { groupId } = action.payload;
      return {
        ...state,
        ingredients: state.ingredients.map(group =>
          group.id === groupId
            ? { ...group, items: [...group.items, { name: '', quantity: null, unit: '', description: '' }] }
            : group
        ),
      };
    }
    case 'REMOVE_INGREDIENT_ITEM': {
      const { groupId, itemIndex } = action.payload;
      return {
        ...state,
        ingredients: state.ingredients.map(group =>
          group.id === groupId
            ? { ...group, items: group.items.filter((_, i) => i !== itemIndex) }
            : group
        ),
      };
    }
    case 'UPDATE_INGREDIENT_ITEM': {
      const { groupId, itemIndex, field, value } = action.payload;
      return {
        ...state,
        ingredients: state.ingredients.map(group => {
          if (group.id !== groupId) return group;
          const updatedItems = group.items.map((item, idx) => {
            if (idx !== itemIndex) return item;
            if (field === 'quantity') {
              const numValue = parseFloat(value);
              return { ...item, [field]: value === '' ? null : (isNaN(numValue) ? null : numValue) };
            }
            return { ...item, [field]: value };
          });
          return { ...group, items: updatedItems };
        }),
      };
    }
    case 'ADD_INSTRUCTION_GROUP': {
      const { title, id } = action.payload;
      const currentInstructions = Array.isArray(state.instructions) ? state.instructions : [];
      return { ...state, instructions: [...currentInstructions, { id, title, steps: [''] }] };
    }
    case 'REMOVE_INSTRUCTION_GROUP':
      return { ...state, instructions: state.instructions.filter(group => group.id !== action.payload.groupId) };
    case 'UPDATE_INSTRUCTION_GROUP_NAME': {
      const { groupId, newName } = action.payload;
      return {
        ...state,
        instructions: state.instructions.map(group => group.id === groupId ? { ...group, title: newName } : group),
      };
    }
    case 'ADD_INSTRUCTION_STEP': {
      const { groupId } = action.payload;
      return { ...state, instructions: state.instructions.map(group => group.id === groupId ? { ...group, steps: [...group.steps, ''] } : group) };
    }
    case 'REMOVE_INSTRUCTION_STEP': {
      const { groupId, stepIndex } = action.payload;
      return { ...state, instructions: state.instructions.map(group => group.id === groupId ? { ...group, steps: group.steps.filter((_, i) => i !== stepIndex) } : group) };
    }
    case 'UPDATE_INSTRUCTION_STEP': {
      const { groupId, stepIndex, value } = action.payload;
      return {
        ...state, instructions: state.instructions.map(group => {
          if (group.id !== groupId) return group;
          const updatedSteps = [...group.steps];
          updatedSteps[stepIndex] = value;
          return { ...group, steps: updatedSteps };
        })
      };
    }
    case 'RESET_FORM':
      return initialRecipeState;
    default:
      return state;
  }
};

const RecipeManualForm = ({ onSubmit }) => {
  const [recipeData, dispatch] = useReducer(recipeReducer, initialRecipeState);

  // Use custom hooks for simple dynamic lists
  const { list: categories, newItem: newCategory, setNewItem: setNewCategory, addItem: addCategory, removeItem: removeCategory, updateList: updateCategoriesList } = useDynamicList(initialRecipeState.categories);
  const { list: galleryImages, newItem: newGalleryImage, setNewItem: setNewGalleryImage, addItem: addGalleryImage, removeItem: removeGalleryImage, updateList: updateGalleryImagesList } = useDynamicList(initialRecipeState.images.gallery);
  const { list: notes, newItem: newNote, setNewItem: setNewNote, addItem: addNote, removeItem: removeNote, updateList: updateNotesList } = useDynamicList(initialRecipeState.notes);

  // Generic handler for simple top-level fields updated by InlineEditable
  const handleFieldSave = (name, value) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { name, value } });
  };

  // Specific save handler for nested fields like rating or images.main
  const handleNestedFieldSave = (parentKey, childKey, value) => {
    dispatch({ type: 'UPDATE_NESTED_FIELD', payload: { parentKey, childKey, value } });
  };


  // --- Ingredients ---
  const [newIngredientGroupName, setNewIngredientGroupName] = useState('');

  const handleAddIngredientGroup = () => {
    const trimmedGroupName = newIngredientGroupName.trim();
    const currentIngredients = Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [];
    if (trimmedGroupName && !currentIngredients.find(group => group.title === trimmedGroupName)) {
      const newGroupId = `ingredient-group-${Date.now()}-${currentIngredients.length}`;
      dispatch({ type: 'ADD_INGREDIENT_GROUP', payload: { title: trimmedGroupName, id: newGroupId } });
      setNewIngredientGroupName('');
    } else if (currentIngredients.find(group => group.title === trimmedGroupName)) {
      alert("Ingredient group name already exists.");
    }
  };

  const handleRemoveIngredientGroup = (groupIdToRemove) => {
    dispatch({ type: 'REMOVE_INGREDIENT_GROUP', payload: { groupId: groupIdToRemove } });
  };

  const handleIngredientGroupNameChange = (groupIdToChange, oldNameIgnored, newName) => {
    const trimmedNewName = newName.trim();
    if (trimmedNewName) {
      const nameExistsInOtherGroup = recipeData.ingredients.some(
        group => group.id !== groupIdToChange && group.title === trimmedNewName
      );
      if (nameExistsInOtherGroup) {
        alert("New ingredient group name already exists.");
        return;
      }
      dispatch({ type: 'UPDATE_INGREDIENT_GROUP_NAME', payload: { groupId: groupIdToChange, newName: trimmedNewName } });
    }
  };

  const handleAddIngredientItem = (groupId) => {
    dispatch({ type: 'ADD_INGREDIENT_ITEM', payload: { groupId } });
  };

  const handleRemoveIngredientItem = (groupId, itemIndexToRemove) => {
    dispatch({ type: 'REMOVE_INGREDIENT_ITEM', payload: { groupId, itemIndex: itemIndexToRemove } });
  };

  const handleIngredientItemChange = (groupId, itemIndex, field, value) => {
    dispatch({ type: 'UPDATE_INGREDIENT_ITEM', payload: { groupId, itemIndex, field, value } });
  };

  // --- Instructions ---
  const [newInstructionGroupNameState, setNewInstructionGroupNameState] = useState('');

  const handleAddInstructionGroup = () => {
    const trimmedGroupName = newInstructionGroupNameState.trim();
    const currentInstructions = Array.isArray(recipeData.instructions) ? recipeData.instructions : [];
    if (trimmedGroupName && !currentInstructions.find(group => group.title === trimmedGroupName)) {
      const newGroupId = `instr-group-${Date.now()}-${currentInstructions.length}`;
      dispatch({ type: 'ADD_INSTRUCTION_GROUP', payload: { title: trimmedGroupName, id: newGroupId } });
      setNewInstructionGroupNameState('');
    } else if (currentInstructions.find(group => group.title === trimmedGroupName)) {
      alert("Preparation group name already exists.");
    }
  };

  const handleRemoveInstructionGroup = (groupIdToRemove) => {
    dispatch({ type: 'REMOVE_INSTRUCTION_GROUP', payload: { groupId: groupIdToRemove } });
  };

  const handleInstructionGroupNameChange = (groupIdToChange, oldNameIgnored, newName) => {
    const trimmedNewName = newName.trim();
    if (trimmedNewName) {
      const nameExistsInOtherGroup = recipeData.instructions.some(
        group => group.id !== groupIdToChange && group.title === trimmedNewName
      );
      if (nameExistsInOtherGroup) {
        alert("New preparation group name already exists.");
        return;
      }
      dispatch({ type: 'UPDATE_INSTRUCTION_GROUP_NAME', payload: { groupId: groupIdToChange, newName: trimmedNewName } });
    }
  };

  const handleAddInstructionStep = (groupId) => {
    dispatch({ type: 'ADD_INSTRUCTION_STEP', payload: { groupId } });
  };

  const handleRemoveInstructionStep = (groupId, stepIndexToRemove) => {
    dispatch({ type: 'REMOVE_INSTRUCTION_STEP', payload: { groupId, stepIndex: stepIndexToRemove } });
  };

  const handleInstructionStepChange = (groupId, stepIndex, value) => {
    dispatch({ type: 'UPDATE_INSTRUCTION_STEP', payload: { groupId, stepIndex, value } });
  };

  const handleFullSubmit = async (e) => {
    e.preventDefault();
    if (!recipeData.title.trim()) {
      alert("Recipe title is required.");
      return;
    }

    // Filter out empty items and groups for ingredients
    const ingredientsForSubmission = (Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [])
      .map(group => ({
        ...group,
        items: group.items.filter(
          item => item.name?.trim() || (item.quantity !== null && item.quantity?.toString().trim()) || item.unit?.trim() || item.description?.trim()
        )
      }))
      .filter(group => group.title?.trim() && group.items.length > 0);

    // Filter out empty steps and groups for instructions
    const instructionsForSubmission = (Array.isArray(recipeData.instructions) ? recipeData.instructions : [])
      .map(group => ({
        ...group,
        steps: group.steps.filter(step => step.trim())
      }))
      .filter(group => group.title?.trim() && group.steps.length > 0);

    const finalRecipeData = {
      ...recipeData,
      categories: categories,
      images: { ...recipeData.images, gallery: galleryImages },
      notes: notes,
      // Use the cleaned-up arrays. The `id` field from the form state will be
      // naturally excluded since it's not part of the final submission object structure.
      ingredients: ingredientsForSubmission.map(({ id, ...rest }) => rest),
      instructions: instructionsForSubmission.map(({ id, ...rest }) => rest),
    };

    // Generate slug from the title
    const recipeWithSlug = { ...finalRecipeData, slug: slugify(finalRecipeData.title || '') };

    const success = await onSubmit(recipeWithSlug);
    if (success) {
      dispatch({ type: 'RESET_FORM' });
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
                <RecipeSectionGroup
                  key={group.id}
                  group={group}
                  onGroupNameChange={handleIngredientGroupNameChange}
                  onRemoveGroup={handleRemoveIngredientGroup}
                  onAddItem={handleAddIngredientItem}
                  addItemLabel="Add ingredient"
                  groupTitlePlaceholder="Group Name"
                  removeGroupAriaLabel="Remove ingredient group"
                >
                  {group.items.map((item, itemIndex) => (
                    <div key={`item-${group.id}-${itemIndex}`} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-1 items-center text-sm">
                      <div className="sm:col-span-1"><InlineEditable value={item.quantity} onSave={(v) => handleIngredientItemChange(group.id, itemIndex, 'quantity', v)} placeholder="Qty" inputType="number" inputClassName="w-full text-sm h-7" displayClassName="text-sm" /></div>
                      <div className="sm:col-span-2"><InlineEditable value={item.unit} onSave={(v) => handleIngredientItemChange(group.id, itemIndex, 'unit', v)} placeholder="Unit" inputClassName="w-full text-sm h-7" displayClassName="text-sm" /></div>
                      <div className="sm:col-span-5"><InlineEditable value={item.name} onSave={(v) => handleIngredientItemChange(group.id, itemIndex, 'name', v)} placeholder="Ingredient Name" inputClassName="w-full text-sm h-7" displayClassName="text-sm" /></div>
                      <div className="sm:col-span-3"><InlineEditable value={item.description} onSave={(v) => handleIngredientItemChange(group.id, itemIndex, 'description', v)} placeholder="Description" inputClassName="w-full text-sm h-7" displayClassName="text-sm" /></div>
                      <div className="sm:col-span-1 flex justify-end">
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveIngredientItem(group.id, itemIndex)} aria-label="Remove ingredient item" className="h-6 w-6">
                          <XCircle className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </RecipeSectionGroup>
              ))}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <Input placeholder="New Ingredient Group Name" value={newIngredientGroupName} onChange={(e) => setNewIngredientGroupName(e.target.value)} className="h-9 text-sm flex-grow" onKeyDown={(e) => e.key === 'Enter' && handleAddIngredientGroup()} />
                <Button type="button" onClick={handleAddIngredientGroup} size="icon" variant="ghost" aria-label="Add ingredient group"><PlusCircle className="h-4 w-4" /></Button>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Preparation</h3>
              {(Array.isArray(recipeData.instructions) ? recipeData.instructions : []).map((group) => (
                <RecipeSectionGroup
                  key={group.id}
                  group={group}
                  onGroupNameChange={handleInstructionGroupNameChange}
                  onRemoveGroup={handleRemoveInstructionGroup}
                  onAddItem={handleAddInstructionStep}
                  addItemLabel="Add step"
                  groupTitlePlaceholder="Preparation Group Name"
                  removeGroupAriaLabel="Remove preparation group"
                >
                  {group.steps.map((step, stepIndex) => (
                    <div key={`step-${group.id}-${stepIndex}`} className="flex items-center gap-2 mb-1">
                      <div className="flex-grow">
                        <InlineEditable value={step} onSave={(v) => handleInstructionStepChange(group.id, stepIndex, v)} placeholder={`Step ${stepIndex + 1}`} inputType="textarea" inputClassName="w-full text-sm" displayClassName="text-sm w-full" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveInstructionStep(group.id, stepIndex)} aria-label="Remove step" className="h-6 w-6 self-start">
                        <XCircle className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </RecipeSectionGroup>
              ))}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                <Input placeholder="New Preparation Group Name" value={newInstructionGroupNameState} onChange={(e) => setNewInstructionGroupNameState(e.target.value)} className="h-9 text-sm flex-grow" onKeyDown={(e) => e.key === 'Enter' && handleAddInstructionGroup()} />
                <Button type="button" onClick={handleAddInstructionGroup} size="icon" variant="ghost" aria-label="Add preparation group"><PlusCircle className="h-4 w-4" /></Button>
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

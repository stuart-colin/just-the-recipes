import { NextResponse } from 'next/server';
import { addRecipeToFirestore } from '@/lib/firebaseRecipeService'; // Import the new Firestore service function
import { slugify } from '@/lib/utils'; // This will now correctly resolve to utils.ts

// Note: This API route is currently open. For a production application,
// you would want to secure this endpoint, for example, by requiring
// authentication (e.g., Firebase Authentication for admin users) or
// a secure token mechanism.

export async function POST(request) {
  try {
    const recipeData = await request.json();
    // console.log("Received recipe data at API:", recipeData); // Removed for production

    // Basic validation (you should enhance this, e.g., with Zod)
    if (!recipeData.title) {
      return NextResponse.json({ message: 'Recipe title is required.' }, { status: 400 });
    }

    // The client-side forms (manual and upload) should already be generating a slug.
    // This server-side generation acts as a fallback and ensures it exists.
    // A more robust implementation could also check for slug uniqueness here.
    const recipeSlug = recipeData.slug || slugify(recipeData.title) || `recipe-${Date.now()}`;

    // Add the generated slug as a field to the recipe data
    const recipeToSave = { ...recipeData, slug: recipeSlug };
    // Clean up temporary property if it exists from older client versions
    delete recipeToSave._originalFilenameSlug;

    // Save to Firestore
    const savedRecipe = await addRecipeToFirestore(recipeToSave);
    console.log(`Successfully saved recipe to Firestore with ID: ${savedRecipe.id}`);

    // Return the saved recipe data (which now includes Firestore ID and createdAt timestamp)
    return NextResponse.json({ message: 'Recipe submitted and saved to Firestore successfully!', recipe: savedRecipe }, { status: 200 });

  } catch (error) {
    console.error('Error processing recipe submission (outer catch):', error);
    return NextResponse.json({ message: 'Error submitting recipe', error: error.message, details: error.stack }, { status: 500 });
  }
}
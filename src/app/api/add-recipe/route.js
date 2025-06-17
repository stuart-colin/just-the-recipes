import { NextResponse } from 'next/server';
import { getStorageClient } from '@/lib/gcsClient'; // Assuming gcsClient is in lib
import { slugify } from '@/lib/utils'; // This will now correctly resolve to utils.ts

const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
const GCS_WRITE_SCOPES = 'https://www.googleapis.com/auth/devstorage.read_write';
let storageWriterClient; // Cache the client

function getWriterClient() {
  if (!storageWriterClient) {
    storageWriterClient = getStorageClient(GCS_WRITE_SCOPES);
  }
  if (!storageWriterClient) {
    // This case should ideally be handled by getStorageClient returning null or throwing
    // For robustness, we check here too.
    console.error("[API Add Recipe] Failed to get writer storage client.");
    return null;
  }
  return storageWriterClient;
}

export async function POST(request) {
  try {
    const recipeData = await request.json();
    // console.log("Received recipe data at API:", recipeData); // Removed for production

    // Basic validation (you should enhance this, e.g., with Zod)
    if (!recipeData.title) {
      return NextResponse.json({ message: 'Recipe title is required.' }, { status: 400 });
    }

    let baseSlug;
    let idForRecipe;

    if (recipeData._originalFilenameSlug) {
      baseSlug = recipeData._originalFilenameSlug;
      // Remove the temporary property before saving
      delete recipeData._originalFilenameSlug;
    } else {
      baseSlug = slugify(recipeData.title);
    }

    if (!baseSlug) {
      return NextResponse.json({ message: 'Could not generate a valid slug for the recipe.' }, { status: 400 });
    }

    idForRecipe = baseSlug; // Use the derived slug as the ID
    const filename = `${baseSlug}.json`;

    // Add the generated slug as the ID to the recipe data itself
    const recipeDataWithId = { ...recipeData, id: idForRecipe };

    const storage = getWriterClient(); // Get the initialized client
    if (storage && GCS_BUCKET_NAME) { // Check if client and bucket name are available
      console.log(`Attempting to upload '${filename}' to GCS bucket: '${GCS_BUCKET_NAME}'`);
      try {
        const bucket = storage.bucket(GCS_BUCKET_NAME);
        const file = bucket.file(filename);
        await file.save(JSON.stringify(recipeDataWithId, null, 2), {
          contentType: 'application/json', // Explicitly set content type
          // You can add metadata here if needed, e.g.,
          // metadata: { cacheControl: 'public, max-age=31536000' },
        });
        console.log(`Successfully initiated save for '${filename}' to GCS bucket '${GCS_BUCKET_NAME}'.`);
        return NextResponse.json({ message: 'Recipe submitted and GCS upload initiated successfully!', recipeId: idForRecipe, filename: filename }, { status: 200 });
      } catch (gcsError) {
        console.error(`GCS Upload Error for '${filename}' to bucket '${GCS_BUCKET_NAME}':`, gcsError);
        return NextResponse.json({ message: 'Recipe submitted, but GCS upload failed.', error: gcsError.message, details: gcsError.stack }, { status: 500 });
      }
    } else {
      console.warn("GCS client not initialized or bucket name not set. Skipping GCS upload.");
      // Fallback behavior: return success without upload, including the generated slug
      return NextResponse.json({ message: 'Recipe submitted (GCS upload skipped)', recipeId: idForRecipe, data: recipeDataWithId }, { status: 200 });
    }
  } catch (error) {
    console.error('Error processing recipe submission (outer catch):', error);
    return NextResponse.json({ message: 'Error submitting recipe', error: error.message, details: error.stack }, { status: 500 });
  }
}
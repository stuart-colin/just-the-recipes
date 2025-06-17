// d:\Code Projects\just-the-recipes\src\lib\gcsService.js
import { getStorageClient } from './gcsClient'; // Import the centralized client

const GCS_READ_SCOPES = 'https://www.googleapis.com/auth/devstorage.read_only';
let storageReaderClient; // Cache the client

function getReaderClient() {
  if (!storageReaderClient) {
    storageReaderClient = getStorageClient(GCS_READ_SCOPES);
  }
  if (!storageReaderClient) {
    throw new Error("GCS Service: Failed to initialize reader storage client.");
  }
  return storageReaderClient;
}

async function listRecipeFiles(bucketName) {
  const storage = getReaderClient();
  const bucket = storage.bucket(bucketName);
  // console.log(`GCS Service: Listing files from bucket: ${bucketName}`); // Removed for production
  const [files] = await bucket.getFiles();
  // console.log("GCS Service: Successfully listed files using client."); // Removed for production
  // The structure of 'files' from client.getFiles() is an array of File objects.
  // We need to adapt it to match the previous structure { items: [{ name: '...' }] }
  // or adapt the consuming code. For now, let's adapt to the expected structure.
  return { items: files.map(file => ({ name: file.name })) };
}

async function fetchRecipeContent(bucketName, fileName) {
  const storage = getReaderClient();
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);
  try {
    const [content] = await file.download();
    return JSON.parse(content.toString());
  } catch (error) {
    console.warn(`GCS Service: Failed to fetch recipe content for ${fileName}: ${recipeResponse.status} ${await recipeResponse.text()}`);
    return null;
  }
}

export async function fetchAllRecipesFromGCS() {
  // console.log("GCS Service: fetchAllRecipesFromGCS called."); // Removed for production
  const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
  if (!GCS_BUCKET_NAME) {
    console.error("GCS Service: Server configuration error: GCS_BUCKET_NAME missing.");
    throw new Error("Server configuration error: GCS_BUCKET_NAME missing.");
  }

  let recipes = [];
  const listData = await listRecipeFiles(GCS_BUCKET_NAME);
  const recipeFiles = listData.items || [];
  // console.log(`GCS Service: Found ${recipeFiles.length} files in bucket.`); // Removed for production

  // Using Promise.all for concurrent fetching
  const recipePromises = recipeFiles
    .filter(file => file.name.endsWith('.json'))
    .map(file => {
      // console.log(`GCS Service: Preparing to fetch ${file.name}`); // Can be noisy
      return fetchRecipeContent(GCS_BUCKET_NAME, file.name)
        .catch(err => {
          // Catch individual fetch errors so one failed fetch doesn't stop all
          console.error(`GCS Service: Error fetching content for ${file.name}:`, err);
          return null; // Return null for this recipe, it will be filtered out later
        });
    });

  const settledRecipesData = await Promise.all(recipePromises);

  for (const recipeData of settledRecipesData) {
    if (recipeData) {
      if (Array.isArray(recipeData)) {
        // If a single JSON file contains an array of recipes
        recipes.push(...recipeData.filter(r => r != null));
      } else {
        // If a single JSON file contains a single recipe object
        recipes.push(recipeData);
      }
    }
  }
  // console.log(`GCS Service: Successfully processed ${recipes.length} recipes.`); // Removed for production
  return recipes;
}

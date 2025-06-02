// d:\Code Projects\just-the-recipes\src\lib\gcsService.js
import { GoogleAuth } from 'google-auth-library';

function getGcsCredentials() {
  const gcsKeyBase64 = process.env.GCS_KEY_BASE64;

  if (gcsKeyBase64) {
    // If GCS_KEY_BASE64 is provided (expected in Netlify/serverless)
    console.log("GCS Service: Using GCS_KEY_BASE64 for authentication.");
    try {
      const keyFileContent = Buffer.from(gcsKeyBase64, 'base64').toString('utf-8');
      return JSON.parse(keyFileContent);
    } catch (error) {
      console.error("GCS Service: Failed to parse GCS_KEY_BASE64:", error);
      // Throw a specific error or let it fall through to ADC attempt if desired,
      // but for serverless, this usually means a configuration error.
      throw new Error("Invalid GCS_KEY_BASE64 format. Ensure it's a valid Base64 encoded JSON key.");
    }
  } else {
    // If GCS_KEY_BASE64 is NOT provided, let GoogleAuth try ADC.
    // ADC will check for GOOGLE_APPLICATION_CREDENTIALS env var (pointing to a file path)
    // or other ADC mechanisms (like gcloud CLI auth or metadata server).
    // This path is typically for local development.
    console.log("GCS Service: GCS_KEY_BASE64 not set. Attempting Application Default Credentials (ADC).");
    return undefined; // Explicitly return undefined so GoogleAuth uses its default ADC flow
  }
}

async function getGcsAuthToken() {
  const credentials = getGcsCredentials(); // This will be an object or undefined

  const auth = new GoogleAuth({
    // If 'credentials' is an object, it's used.
    // If 'credentials' is undefined, GoogleAuth attempts ADC,
    // which includes checking GOOGLE_APPLICATION_CREDENTIALS env var for a file path.
    credentials,
    scopes: 'https://www.googleapis.com/auth/devstorage.read_only',
  });

  try {
    const client = await auth.getClient();
    const accessToken = (await client.getAccessToken()).token;
    if (!accessToken) {
      console.error('GCS Service: Failed to obtain GCS access token after client retrieval.');
      throw new Error('Failed to obtain GCS access token.');
    }
    console.log("GCS Service: Successfully obtained GCS access token.");
    return accessToken;
  } catch (error) {
    console.error('GCS Service: Error in getGcsAuthToken while getting client or token:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
}

async function listRecipeFiles(bucketName, accessToken) {
  const listUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o`;
  console.log(`GCS Service: Listing files from bucket: ${bucketName}`);
  const listResponse = await fetch(listUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!listResponse.ok) {
    const errorText = await listResponse.text();
    console.error(`GCS Service: Failed to list objects: ${listResponse.status}`, errorText);
    throw new Error(`Failed to list objects from GCS: ${listResponse.status}`);
  }
  console.log("GCS Service: Successfully listed files.");
  return await listResponse.json();
}

async function fetchRecipeContent(bucketName, fileName, accessToken) {
  const objectNameEncoded = encodeURIComponent(fileName);
  const downloadUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${objectNameEncoded}?alt=media`;
  // console.log(`GCS Service: Fetching content for ${fileName}`); // Can be noisy
  const recipeResponse = await fetch(downloadUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (recipeResponse.ok) {
    // console.log(`GCS Service: Successfully fetched content for ${fileName}`); // Can be noisy
    return await recipeResponse.json();
  } else {
    console.warn(`GCS Service: Failed to fetch recipe content for ${fileName}: ${recipeResponse.status} ${await recipeResponse.text()}`);
    return null;
  }
}

export async function fetchAllRecipesFromGCS() {
  console.log("GCS Service: fetchAllRecipesFromGCS called.");
  const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
  if (!GCS_BUCKET_NAME) {
    console.error("GCS Service: Server configuration error: GCS_BUCKET_NAME missing.");
    throw new Error("Server configuration error: GCS_BUCKET_NAME missing.");
  }

  let recipes = [];
  const accessToken = await getGcsAuthToken();
  const listData = await listRecipeFiles(GCS_BUCKET_NAME, accessToken);
  const recipeFiles = listData.items || [];
  console.log(`GCS Service: Found ${recipeFiles.length} files in bucket.`);

  // Using Promise.all for concurrent fetching
  const recipePromises = recipeFiles
    .filter(file => file.name.endsWith('.json'))
    .map(file => {
      // console.log(`GCS Service: Preparing to fetch ${file.name}`); // Can be noisy
      return fetchRecipeContent(GCS_BUCKET_NAME, file.name, accessToken)
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
  console.log(`GCS Service: Successfully processed ${recipes.length} recipes.`);
  return recipes;
}

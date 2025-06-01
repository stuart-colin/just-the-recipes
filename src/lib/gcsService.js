// d:\Code Projects\just-the-recipes\src\lib\gcsService.js
import { GoogleAuth } from 'google-auth-library';

async function getGcsAuthToken() {
  let auth;
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
    auth = new GoogleAuth({
      credentials,
      scopes: 'https://www.googleapis.com/auth/devstorage.read_only',
    });
  } else {
    auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/devstorage.read_only',
    });
  }
  const client = await auth.getClient();
  const accessToken = (await client.getAccessToken()).token;
  if (!accessToken) {
    throw new Error('Failed to obtain GCS access token.');
  }
  return accessToken;
}

async function listRecipeFiles(bucketName, accessToken) {
  const listUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o`;
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
  return await listResponse.json();
}

async function fetchRecipeContent(bucketName, fileName, accessToken) {
  const objectNameEncoded = encodeURIComponent(fileName);
  const downloadUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${objectNameEncoded}?alt=media`;
  const recipeResponse = await fetch(downloadUrl, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (recipeResponse.ok) {
    return await recipeResponse.json();
  } else {
    console.warn(`GCS Service: Failed to fetch recipe content for ${fileName}: ${recipeResponse.status} ${await recipeResponse.text()}`);
    return null; // Or throw an error, depending on how you want to handle partial failures
  }
}

export async function fetchAllRecipesFromGCS() {
  const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
  if (!GCS_BUCKET_NAME) {
    throw new Error("Server configuration error: GCS_BUCKET_NAME missing.");
  }

  let recipes = [];
  const accessToken = await getGcsAuthToken();
  const listData = await listRecipeFiles(GCS_BUCKET_NAME, accessToken);
  const recipeFiles = listData.items || [];

  for (const file of recipeFiles) {
    if (file.name.endsWith('.json')) {
      const recipeData = await fetchRecipeContent(GCS_BUCKET_NAME, file.name, accessToken);
      if (recipeData) {
        if (Array.isArray(recipeData)) {
          recipes.push(...recipeData.filter(r => r != null));
        } else {
          recipes.push(recipeData);
        }
      }
    }
  }
  return recipes;
}

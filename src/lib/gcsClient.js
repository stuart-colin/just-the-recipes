import { Storage } from '@google-cloud/storage';
import { GoogleAuth } from 'google-auth-library';

const GCS_KEY_BASE64 = process.env.GCS_KEY_BASE64;
// console.log(`[GCS Client Init] GCS_KEY_BASE64 is set: ${GCS_KEY_BASE64 ? 'Yes, length: ' + GCS_KEY_BASE64.length : 'No'}`); // Removed for production

let gcsCredentials;

if (GCS_KEY_BASE64) {
  // console.log("[GCS Client Init] Using GCS_KEY_BASE64 for authentication."); // Removed for production
  try {
    const credentialsJson = Buffer.from(GCS_KEY_BASE64, 'base64').toString('utf-8');
    const parsedCreds = JSON.parse(credentialsJson);
    // Basic check for essential fields in a service account key
    if (parsedCreds && parsedCreds.project_id && parsedCreds.client_email && parsedCreds.private_key) {
      gcsCredentials = parsedCreds;
    } else {
      console.error("[GCS Client Init] Parsed GCS_KEY_BASE64 is missing essential fields (project_id, client_email, private_key) or is invalid.");
      gcsCredentials = undefined; // Explicitly set to undefined to ensure ADC fallback
    }
  } catch (error) {
    console.error("[GCS Client Init] Failed to parse GCS_KEY_BASE64. Will attempt Application Default Credentials. Error:", error.message);
    gcsCredentials = undefined; // Ensure fallback to ADC
  }
} else {
  // console.log("[GCS Client Init] GCS_KEY_BASE64 not set. Attempting Application Default Credentials (ADC)."); // Removed for production
  // gcsCredentials remains undefined, GoogleAuth will use ADC
}

/**
 * Initializes and returns a Google Cloud Storage client.
 * @param {string | string[]} scopes - The OAuth2 scopes required for the client.
 * @returns {Storage | null} An initialized Storage client, or null if initialization fails.
 */
export function getStorageClient(scopes) {
  try {
    const auth = new GoogleAuth({
      credentials: gcsCredentials, // Will be an object or undefined (for ADC)
      scopes: scopes
    });
    const storage = new Storage({ auth });
    // console.log(`[GCS Client Init] Google Cloud Storage client initialized successfully for scopes: ${Array.isArray(scopes) ? scopes.join(', ') : scopes}`); // Removed for production
    return storage;
  } catch (error) {
    console.error("[GCS Client Init] Failed to initialize Google Cloud Storage client with GoogleAuth:", error);
    return null; // Return null or throw, depending on desired error handling
  }
}
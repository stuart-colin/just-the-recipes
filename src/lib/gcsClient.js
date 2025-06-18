import { Storage } from '@google-cloud/storage';
import { GoogleAuth } from 'google-auth-library';

const TEST_VAR_FROM_ENV = process.env.TEST_GCS_CLIENT_VAR;
console.log(`[GCS Client Init - TEST] Value of TEST_GCS_CLIENT_VAR: ${TEST_VAR_FROM_ENV}`);

const GCS_KEY_FROM_ENV = process.env.GCS_KEY_BASE64;

// Enhanced logging for GCS_KEY_BASE64 status
console.log(`[GCS Client Init] Raw value of process.env.GCS_KEY_BASE64 (type: ${typeof GCS_KEY_FROM_ENV}): ${GCS_KEY_FROM_ENV === undefined ? 'undefined' : (GCS_KEY_FROM_ENV === null ? 'null' : (GCS_KEY_FROM_ENV === '' ? '"" (empty string)' : `String of length ${GCS_KEY_FROM_ENV.length}, starts with "${String(GCS_KEY_FROM_ENV).substring(0, 10)}..."`))}`);

let gcsCredentials;

// Check if GCS_KEY_FROM_ENV is a non-empty string
if (GCS_KEY_FROM_ENV && typeof GCS_KEY_FROM_ENV === 'string' && GCS_KEY_FROM_ENV.length > 0) {
  console.log("[GCS Client Init] Attempting to use GCS_KEY_FROM_ENV for authentication.");
  try {
    const credentialsJson = Buffer.from(GCS_KEY_FROM_ENV, 'base64').toString('utf-8');
    const parsedCreds = JSON.parse(credentialsJson);
    // Basic check for essential fields in a service account key
    if (parsedCreds && parsedCreds.project_id && parsedCreds.client_email && parsedCreds.private_key) {
      gcsCredentials = parsedCreds;
    } else {
      console.error("[GCS Client Init] Parsed GCS_KEY_BASE64 is missing essential fields (project_id, client_email, private_key) or is invalid.");
      gcsCredentials = undefined; // Explicitly set to undefined to ensure ADC fallback
    }
  } catch (error) {
    console.error(`[GCS Client Init] Failed to parse GCS_KEY_FROM_ENV (value starting with "${String(GCS_KEY_FROM_ENV).substring(0, 10)}..."). Will attempt Application Default Credentials. Error:`, error.message);
    gcsCredentials = undefined; // Ensure fallback to ADC
  }
} else {
  console.log("[GCS Client Init] GCS_KEY_FROM_ENV is not set, is empty, or not a string. Attempting Application Default Credentials (ADC).");
  // gcsCredentials remains undefined, GoogleAuth will use ADC
}

/**
 * Initializes and returns a Google Cloud Storage client.
 * @param {string | string[]} scopes - The OAuth2 scopes required for the client.
 * @returns {Storage} An initialized Storage client.
 * @throws {Error} If the Storage client cannot be initialized.
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
    throw new Error(`[GCS Client Init] Failed to initialize Storage client: ${error.message}`);
  }
}
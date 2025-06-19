import { Timestamp } from 'firebase/firestore';

export interface Recipe {
  id: string;
  title?: string;
  author?: string;
  // Making ingredients more flexible to match RecipeManualForm's potential output
  ingredients?: Record<string, Array<{ name: string; quantity: number | string | null; unit?: string; description?: string } | string>>;
  categories?: string[];
  name?: string; // Optional: if 'name' is used as an alternative to 'title'
  images?: {
    main?: string;
    gallery?: string[];
    [key: string]: string | string[] | undefined;
  };
  description?: string;
  source?: string;
  prep_time?: string;
  cook_time?: string;
  total_time?: string;
  servings?: number | string | null; // Allow string for "e.g. 4-6"
  serving_size?: string;
  calories_per_serving?: number | null;
  rating?: { average?: string | number; votes?: string | number };
  notes?: string[];
  slug?: string;
  createdAt?: Timestamp | Date; // Added by Firestore service
}

export interface ToMakeRecipeItem {
  id?: string; // Firestore document ID
  title?: string;
  name?: string; // Optional: if 'name' is used as an alternative to 'title'
  source: string; // Source URL is crucial for these items
  addedAt?: Timestamp | Date; // Firestore serverTimestamp
}
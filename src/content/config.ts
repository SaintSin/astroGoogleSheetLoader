import { defineCollection, z } from 'astro:content';
import { googleSheetsLoader } from '../loaders/googleSheets';

// Use PUBLIC_ prefix for env vars to make them available via import.meta.env
// You can specify either sheetName or gid to target a specific sheet tab
const products = defineCollection({
  loader: googleSheetsLoader({
    sheetId: import.meta.env.PUBLIC_GOOGLE_SHEET_ID || '',
    apiKey: import.meta.env.PUBLIC_GOOGLE_SHEETS_API_KEY || 'YOUR_API_KEY_HERE',
    sheetName: import.meta.env.PUBLIC_GOOGLE_SHEET_NAME || 'Products', // Sheet tab name
    hasHeaders: true, // Optional: defaults to true
  }),
  // Optional: Define a schema for type-safety
  // This will validate the data from your Google Sheet
  schema: z.object({
    // Schema matching your actual Google Sheet column names
    Brand: z.string().default(''),
    ProductName: z.string().default(''),
    Description: z.string().default(''),
    Variant: z.string().default(''),

    Specifications: z.string().default(''), // Note: plural with 's'
    'Price (THB)': z.string().default(''), // Note: has parentheses and space
    Category: z.string().default(''),
    URL: z.string().default(''),
    ImageURL: z.string().default(''),
  }),
});
const reviews = defineCollection({
  loader: googleSheetsLoader({
    sheetId: '1Adr-D_r59daJs9mzP9r28z89nf6hIS3KjdCvR1f6sMc',
    apiKey: import.meta.env.PUBLIC_GOOGLE_SHEETS_API_KEY || '',
    sheetName: 'Sheet1', // Sheet tab name
    hasHeaders: true, // Set to true if first row contains column names
  }),
  // Optional: Define a schema for type-safety
  // This will validate the data from your Google Sheet
  schema: z.object({
    // Schema matching actual column names from the Google Sheet
    reviewer: z.string(),
    reviews: z.string(), // Column name is "reviews" (plural)
    rating: z.string(),
    data: z.coerce.date(), // Column name is "data" not "date"
    source: z.string(),
    reviewID: z.coerce.number(), // Use coerce to convert string to number
  }),
});
export const collections = {
  products,
  reviews,
};

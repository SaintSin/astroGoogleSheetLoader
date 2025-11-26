import type { Loader } from 'astro/loaders';

export interface GoogleSheetsLoaderOptions {
  /** Google Sheets document ID (from the URL) */
  sheetId: string;
  /** API Key for Google Sheets API */
  apiKey: string;
  /** Sheet name/tab (e.g., "Products") - defaults to first sheet if not provided */
  sheetName?: string;
  /** Sheet GID (alternative to sheetName) - the numeric ID of the sheet tab */
  gid?: string;
  /** Whether first row contains headers (default: true) */
  hasHeaders?: boolean;
}

/**
 * Content loader for Google Sheets
 *
 * @example
 * ```ts
 * import { googleSheetsLoader } from './loaders/googleSheets';
 *
 * const products = defineCollection({
 *   loader: googleSheetsLoader({
 *     sheetId: 'YOUR_SHEET_ID',
 *     apiKey: import.meta.env.GOOGLE_SHEETS_API_KEY,
 *     sheetName: 'Products'
 *   })
 * });
 * ```
 */
export function googleSheetsLoader(options: GoogleSheetsLoaderOptions): Loader {
  const { sheetId, apiKey, sheetName, hasHeaders = true } = options;

  return {
    name: 'google-sheets-loader',
    load: async ({ store, logger, parseData, generateDigest }) => {
      logger.info(`Loading data from Google Sheet: ${sheetId}`);

      // Construct the Google Sheets API URL
      const range = sheetName ? `${sheetName}!A:ZZ` : 'A:ZZ';
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch Google Sheet: ${response.statusText}`,
          );
        }

        const data = await response.json();
        const rows = data.values as string[][];

        if (!rows || rows.length === 0) {
          logger.warn('No data found in the sheet');
          return;
        }

        // Extract headers if present
        let headers: string[] = [];
        let dataRows: string[][] = rows;

        if (hasHeaders && rows.length > 0) {
          headers = rows[0];
          dataRows = rows.slice(1);
        } else {
          // Generate column names like A, B, C, etc.
          const maxColumns = Math.max(...rows.map((row) => row.length));
          headers = Array.from({ length: maxColumns }, (_, i) =>
            String.fromCharCode(65 + i),
          );
        }

        // Clear existing entries
        store.clear();

        // Convert rows to objects and store them
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];

          // Skip empty rows
          if (!row || row.every((cell) => !cell || cell.trim() === '')) {
            continue;
          }

          // Create an object from the row
          // Initialize all headers with empty strings first
          const entry: Record<string, any> = {};
          headers.forEach((header) => {
            entry[header] = '';
          });

          // Then populate with actual values
          headers.forEach((header, index) => {
            const value = row[index];
            if (value !== undefined && value !== null) {
              entry[header] = value;
            }
          });

          // Generate a unique ID for this row
          const id = `row-${i + 1}`;

          // Debug: log entry before parsing
          if (i === 0) {
            logger.info(`First entry before parsing: ${JSON.stringify(entry)}`);
          }

          // Parse data through schema to apply coercion/transformations
          const parsedEntry = await parseData({ id, data: entry });

          // Debug: log entry after parsing
          if (i === 0) {
            logger.info(
              `First entry after parsing: ${JSON.stringify(parsedEntry)}`,
            );
          }

          // Create a digest for change detection
          const digest = generateDigest(parsedEntry);

          // Store the parsed entry
          store.set({
            id,
            data: parsedEntry,
            digest,
          });
        }

        logger.info(`Loaded ${dataRows.length} rows from Google Sheet`);
      } catch (error) {
        logger.error(
          `Error loading Google Sheet: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw error;
      }
    },
  };
}

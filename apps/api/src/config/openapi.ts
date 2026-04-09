/**
 * openapi.ts
 *
 * Exports the pre-generated OpenAPI spec for use in the Express app.
 *
 * The spec is produced at BUILD TIME by running:
 *   tsx scripts/generate-openapi.ts
 *
 * That script reads JSDoc annotations from src/routes/*.ts (available
 * during build) and writes src/config/openapi-spec.json.
 * tsup then bundles the JSON inline, so the Vercel runtime never needs
 * to glob source files.
 *
 * For local dev, run the generate script once after adding new JSDoc
 * annotations, or set up a watch task.
 */
import specJson from "./openapi-spec.json";

// Re-export with a typed cast so callers don't have to deal with
// the JSON module's wide `unknown` / `object` inference.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const openApiSpec: Record<string, any> = specJson;

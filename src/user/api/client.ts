import { z } from 'zod';

/**
 * Standardized API Client providing End-to-End Type Safety.
 * Validates responses at runtime using Zod, guaranteeing that the 
 * frontend types strictly align with the actual data received.
 */
export async function typedFetch<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`API Error [${res.status}]: ${res.statusText}`);
  }

  const data = await res.json();
  
  try {
    // Runtime validation ensures data matches expected types
    return schema.parse(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error(`[API] Schema Validation Failed for ${url}:`, err.errors);
      throw new Error(`API Data Validation Error on ${url}`);
    }
    throw err;
  }
}

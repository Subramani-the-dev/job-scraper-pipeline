import { z } from 'zod';

export const formatZodIssues = (error: z.ZodError): string =>
  error.issues.map((issue) => `"${issue.path.join('.')}" ${issue.message}`).join('; ');

// Joins class names, skipping empty or missing ones.
export const cx = (...names: (string | undefined)[]): string => names.filter(Boolean).join(' ');

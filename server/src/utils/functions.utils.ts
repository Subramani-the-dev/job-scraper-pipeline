import { z } from 'zod';

export const formatZodIssues = (error: z.ZodError): string =>
  error.issues.map((issue) => `"${issue.path.join('.')}" ${issue.message}`).join('; ');

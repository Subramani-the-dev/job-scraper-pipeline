import { z } from 'zod';
import { LoginBody } from '@/interfaces/auth.interface';

export const loginSchema: z.ZodType<LoginBody> = z.object({
  password: z.string().min(1),
});

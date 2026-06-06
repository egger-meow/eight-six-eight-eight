import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string(),
  password: z.string().min(8).max(128),
});

export const ChangePasswordSchema = z.object({
  current_password: z.string().max(128),
  new_password: z.string().min(8).max(128),
});

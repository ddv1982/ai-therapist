import { z } from 'zod';
import { validateRequest } from '@/lib/utils/validation';

export function validateWithSchema<TSchema extends z.ZodSchema>(schema: TSchema, data: unknown) {
  return validateRequest(schema, data);
}



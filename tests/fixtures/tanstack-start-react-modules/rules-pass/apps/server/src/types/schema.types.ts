import { z } from 'zod';
export const schemaValue = z.string().refine((value) => value.length > 0);

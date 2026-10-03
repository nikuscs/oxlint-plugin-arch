import { z } from 'zod';

export const schemaMessage = z.object({ text: z.string() });

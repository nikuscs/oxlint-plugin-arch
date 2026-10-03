import { os } from '@orpc/server';

export const missingOutput = os.handler(() => 'hello');

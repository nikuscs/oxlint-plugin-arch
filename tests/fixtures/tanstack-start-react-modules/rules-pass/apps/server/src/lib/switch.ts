export const label = match(status).with('ready', () => 'Ready').otherwise(() => 'Pending');

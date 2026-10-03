import { createContext } from 'react';
import type { ChatPreview } from '../types/chat.types';

export const chatContext = createContext<ChatPreview | null>(null);

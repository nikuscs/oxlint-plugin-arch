import { createRootRoute } from '@tanstack/react-router';
import { ChatPage } from '../components/chats/chat-page';

export const Route = createRootRoute({ component: ChatPage });

import { apiFetch } from './client';
import { authOptionsFor } from './sessionAuth';
import { AuthSession } from '../types/auth';

export type Conversation = {
  id: string;
  experienceId: string;
  groupId: string;
  groupName: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderEmail: string;
  body: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type MessagePage = {
  items: ChatMessage[];
  nextBefore: string | null;
};

export async function openGroupConversation(session: AuthSession, experienceId: string, groupId: string) {
  return apiFetch<Conversation>(`/experiences/${experienceId}/groups/${groupId}/conversation`, {
    method: 'POST',
    ...authOptionsFor(session),
  });
}

export async function listMessages(session: AuthSession, conversationId: string) {
  const page = await apiFetch<MessagePage>(`/conversations/${conversationId}/messages?limit=30`, {
    ...authOptionsFor(session),
  });
  return page.items;
}

export async function sendMessage(session: AuthSession, conversationId: string, body: string) {
  return apiFetch<ChatMessage>(`/conversations/${conversationId}/messages`, {
    method: 'POST',
    ...authOptionsFor(session),
    body: JSON.stringify({ body }),
  });
}

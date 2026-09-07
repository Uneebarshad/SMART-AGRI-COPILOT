import {
  addConversationMessageRequest,
  createConversationRequest,
  deleteConversationRequest,
  fetchConversation,
  fetchConversationMessages,
  fetchConversations,
} from './api';

const normalizeMessage = (message) => ({
  id: message.id,
  role: message.role,
  content: message.content,
  createdAt: message.created_at,
  sources: message.sources ?? [],
  followUps: message.follow_ups ?? [],
});

const normalizeConversation = (conversation, messages = []) => ({
  id: conversation.id,
  title: conversation.title ?? '',
  createdAt: conversation.created_at,
  updatedAt: conversation.updated_at,
  updated_at: conversation.updated_at,
  preview: conversation.title ?? '',
  messages: messages.map(normalizeMessage),
});

export function createConversation(title = '') {
  return createConversationRequest(title ? { title } : {}).then((conversation) =>
    normalizeConversation(conversation),
  );
}

export function getConversations() {
  return fetchConversations().then((conversations) =>
    conversations.map((conversation) => normalizeConversation(conversation)),
  );
}

export function getConversation(id) {
  return Promise.all([fetchConversation(id), fetchConversationMessages(id)]).then(
    ([conversation, messages]) => normalizeConversation(conversation, messages),
  );
}

export function getMessages(id) {
  return fetchConversationMessages(id).then((messages) => messages.map(normalizeMessage));
}

export function addMessage(id, { role, content, sources, followUps }) {
  return addConversationMessageRequest(id, {
    role,
    content,
    sources,
    follow_ups: followUps,
  }).then(normalizeMessage);
}

export function deleteConversation(id) {
  return deleteConversationRequest(id).then(() => true);
}

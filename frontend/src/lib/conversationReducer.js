/**
 * Pure conversation reducer (frontend-spec.md §14.3): the only place assistant
 * message state transitions. Lives in `lib/` with no React or DOM imports so
 * it stays unit-testable and portable (§19 seam).
 *
 * State shape:
 * {
 *   conversationId: string | null,
 *   messages: [{ id, role: 'user' | 'assistant', content,
 *                status: 'sending' | 'sent' | 'failed',
 *                createdAt, sources?, followUps?, error? }],
 *   sendStatus: 'idle' | 'pending',
 * }
 */

export const initialConversationState = {
  conversationId: null,
  messages: [],
  sendStatus: 'idle',
};

export function conversationReducer(state, action) {
  switch (action.type) {
    // Optimistic user message while the request is in flight (§15.4).
    case 'send':
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: action.messageId,
            role: 'user',
            content: action.content,
            status: 'sending',
            createdAt: action.createdAt,
          },
        ],
        sendStatus: 'pending',
      };

    // Backend conversation storage confirmed the optimistic user message.
    case 'stored':
      return {
        ...state,
        conversationId: action.conversationId,
        messages: state.messages.map((message) =>
          message.id === action.userMessageId
            ? { ...message, status: 'sent', createdAt: action.createdAt ?? message.createdAt }
            : message,
        ),
        sendStatus: 'idle',
      };

    // Answer arrived: the user message is confirmed and the assistant
    // message is appended with its follow-ups and sources.
    case 'sent':
      return {
        ...state,
        conversationId: action.conversationId,
        messages: [
          ...state.messages.map((message) =>
            message.id === action.userMessageId ? { ...message, status: 'sent' } : message,
          ),
          {
            id: action.message.id,
            role: 'assistant',
            content: action.message.content,
            status: 'sent',
            createdAt: action.message.createdAt,
            sources: action.message.sources ?? [],
            followUps: action.message.followUps ?? [],
          },
        ],
        sendStatus: 'idle',
      };

    // Delivery failed: the user message stays visible with retry context (§6.10).
    case 'failed':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.userMessageId
            ? {
                ...message,
                status: 'failed',
                error: { message: action.errorMessage, retryable: action.retryable },
              }
            : message,
        ),
        sendStatus: 'idle',
      };

    // Re-queuing a failed message for another attempt (§6.10).
    case 'resend':
      return {
        ...state,
        messages: state.messages.map((message) =>
          message.id === action.userMessageId
            ? { ...message, status: 'sending', error: undefined }
            : message,
        ),
        sendStatus: 'pending',
      };

    // Resume (§6.9): adopt a persisted conversation wholesale.
    case 'load':
      return {
        conversationId: action.conversation.id,
        messages: action.conversation.messages.map((message) => ({
          ...message,
          status: 'sent',
        })),
        sendStatus: 'idle',
      };

    // "New chat" (§6.9): a fresh conversation_id is assigned on first message.
    case 'reset':
      return initialConversationState;

    default:
      return state;
  }
}

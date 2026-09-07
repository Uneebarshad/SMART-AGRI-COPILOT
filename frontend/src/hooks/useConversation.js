import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import {
  addMessage,
  createConversation,
  getConversation,
} from '../services/conversationService';
import { chatAssistant } from '../services/api';
import { conversationReducer, initialConversationState } from '../lib/conversationReducer';
import { useT } from '../i18n/useT';

let messageSequence = 0;

function nextId(prefix) {
  messageSequence += 1;
  return `${prefix}-${Date.now().toString(36)}${messageSequence.toString(36)}`;
}

function normalizeConversation(detail) {
  return {
    id: detail.id,
    messages: (detail.messages ?? []).map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt ?? message.created_at,
      sources: message.sources ?? [],
      followUps: message.followUps ?? message.follow_ups ?? [],
    })),
  };
}

function humanizeError(error) {
  return error?.message || 'Something went wrong';
}

function isRetryable(error) {
  // §6.10: network failures, timeouts and server errors retry; only backend
  // validation (400/422, §15.2) does not.
  if (!error?.status) return true;
  return error.status !== 400 && error.status !== 422;
}

/**
 * Assistant conversation state (frontend-spec.md §14.2/§14.3): owns the
 * message list via the lib reducer, sends through the service layer, and
 * resumes conversations for /assistant/:conversationId through the backend
 * conversation and message endpoints.
 */
export function useConversation(conversationIdParam) {
  const [state, dispatch] = useReducer(conversationReducer, initialConversationState);
  const [conversationTitle, setConversationTitle] = useState(null);
  // 'idle' | 'loading' | 'success' | 'missing' | 'error'
  const [loadStatus, setLoadStatus] = useState('idle');
  const { lang } = useT();

  const mountedRef = useRef(true);
  const loadSequenceRef = useRef(0);
  const previousParamRef = useRef(undefined);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadConversationIntoState = useCallback(
    (id) => {
      const sequence = ++loadSequenceRef.current;
      setLoadStatus('loading');
      const load = getConversation(id);

      load
        .then((detail) => {
          if (!mountedRef.current || sequence !== loadSequenceRef.current) return;
          dispatch({ type: 'load', conversation: normalizeConversation(detail) });
          setConversationTitle(detail.title ?? null);
          setLoadStatus('success');
        })
        .catch((error) => {
          if (!mountedRef.current || sequence !== loadSequenceRef.current) return;
          setLoadStatus(error?.code === 'not_found' ? 'missing' : 'error');
        });
    },
    [],
  );

  // Resume (§6.9): when the route param changes, load that conversation.
  // Skips the fetch when the live conversation already IS this conversation —
  // the page replace-navigates to /assistant/{id} after the first exchange.
  useEffect(() => {
    const previous = previousParamRef.current;
    previousParamRef.current = conversationIdParam;

    if (!conversationIdParam) {
      if (previous) {
        dispatch({ type: 'reset' });
        setConversationTitle(null);
      }
      setLoadStatus('idle');
      return;
    }
    if (conversationIdParam === previous) return;
    if (conversationIdParam === state.conversationId) {
      setLoadStatus('success');
      return;
    }
    loadConversationIntoState(conversationIdParam);
  }, [conversationIdParam, state.conversationId, loadConversationIntoState]);

  const retryLoad = useCallback(() => {
    if (conversationIdParam) {
      loadConversationIntoState(conversationIdParam);
    }
  }, [conversationIdParam, loadConversationIntoState]);

  const performExchange = useCallback(
    async (userMessageId, content) => {
      try {
        const conversation = state.conversationId
          ? { id: state.conversationId }
          : await createConversation(content.slice(0, 200));
        const message = await addMessage(conversation.id, {
          role: 'user',
          content,
        });

        if (mountedRef.current) {
          dispatch({
            type: 'stored',
            userMessageId,
            conversationId: conversation.id,
            createdAt: message.createdAt,
          });
        }

        // Request AI response from the backend chat endpoint.
        try {
          const assistantMessage = await chatAssistant({
            conversationId: conversation.id,
            message: content,
            language: lang,
          });

          if (mountedRef.current) {
            dispatch({
              type: 'sent',
              userMessageId,
              conversationId: conversation.id,
              message: {
                id: assistantMessage.id,
                role: assistantMessage.role,
                content: assistantMessage.content,
                createdAt: assistantMessage.created_at,
                sources: assistantMessage.sources ?? [],
                followUps: assistantMessage.follow_ups ?? [],
              },
            });
          }
        } catch (aiError) {
          if (mountedRef.current) {
            dispatch({
              type: 'failed',
              userMessageId,
              errorMessage: humanizeError(aiError),
              retryable: isRetryable(aiError),
            });
          }
        }

        return conversation.id;
      } catch (error) {
        if (mountedRef.current) {
          dispatch({
            type: 'failed',
            userMessageId,
            errorMessage: humanizeError(error),
            retryable: isRetryable(error),
          });
        }
        return undefined;
      }
    },
    [state.conversationId, lang],
  );

  const send = useCallback(
    (rawContent) => {
      const content = typeof rawContent === 'string' ? rawContent.trim() : '';
      if (!content || state.sendStatus === 'pending') {
        return Promise.resolve(undefined);
      }
      const userMessageId = nextId('u');
      dispatch({
        type: 'send',
        messageId: userMessageId,
        content,
        createdAt: new Date().toISOString(),
      });
      return performExchange(userMessageId, content);
    },
    [state.sendStatus, performExchange],
  );

  const retry = useCallback(
    (messageId) => {
      const failedMessage = state.messages.find((message) => message.id === messageId);
      if (!failedMessage || failedMessage.role !== 'user' || state.sendStatus === 'pending') {
        return Promise.resolve(undefined);
      }
      dispatch({ type: 'resend', userMessageId: messageId });
      return performExchange(messageId, failedMessage.content);
    },
    [state.messages, state.sendStatus, performExchange],
  );

  const reset = useCallback(() => {
    dispatch({ type: 'reset' });
    setConversationTitle(null);
  }, []);

  return { state, conversationTitle, loadStatus, send, retry, reset, retryLoad };
}

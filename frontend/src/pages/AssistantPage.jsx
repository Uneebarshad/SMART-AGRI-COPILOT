import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { useConversation } from '../hooks/useConversation';
import { usePageTitle } from '../hooks/usePageTitle';
import { ButtonLink, ErrorState, Skeleton } from '../components/ui';
import { AssistantHeader } from '../components/assistant/AssistantHeader';
import { Composer } from '../components/assistant/Composer';
import { MessageBubble } from '../components/assistant/MessageBubble';
import { PhotoHandoff } from '../components/assistant/PhotoHandoff';
import { SuggestedQuestions } from '../components/assistant/SuggestedQuestions';
import { TypingIndicator } from '../components/assistant/TypingIndicator';
import { SproutIcon } from '../components/ui/icons/SproutIcon';
import { LeafIcon } from '../components/ui/icons/LeafIcon';
import { CloudRainIcon } from '../components/ui/icons/CloudRainIcon';
import { ChartIcon } from '../components/ui/icons/ChartIcon';
import { ChatIcon } from '../components/ui/icons/ChatIcon';

/** Demo conversation shown on the empty state for the hackathon prototype. */
const DEMO_MESSAGES = [
  {
    id: 'demo-user-1',
    role: 'user',
    content: 'My wheat leaves are turning yellow. What should I check?',
  },
  {
    id: 'demo-assistant-1',
    role: 'assistant',
    content: `Yellowing in wheat can have several causes. Here's what to check first:

1. Soil moisture — both waterlogging and drought stress can cause yellowing. Push a finger 5 cm into the soil near an affected plant.

2. Pattern across the field — if yellowing is uniform, it may be a nutrient deficiency (often nitrogen). If it's in patches, look for disease or pest damage.

3. Lower leaves first — if the oldest leaves are yellowing first, this is typically nitrogen deficiency. If new leaves are affected, it could be an iron or manganese issue.

4. Check the roots — healthy roots are white and firm. Brown, mushy roots suggest root rot or waterlogging.

Based on your region's current conditions (warm days, cool nights), nitrogen deficiency or moisture stress are the most likely causes. Would you like me to help you narrow it down further?`,
  },
];

const CAPABILITIES = [
  { icon: ChatIcon, label: 'Ask about crops, pests, or soil' },
  { icon: LeafIcon, label: 'Identify diseases from leaf photos' },
  { icon: CloudRainIcon, label: 'Get weather-smart farming advice' },
  { icon: ChartIcon, label: 'Receive personalized recommendations' },
];

/**
 * AI Assistant — the conversational copilot for agriculture.
 * Shows a demo conversation on the empty state for the hackathon prototype.
 */
export function AssistantPage() {
  const { conversationId: routeConversationId } = useParams();
  const { t } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { state, conversationTitle, loadStatus, send, retry, reset, retryLoad } = useConversation(
    routeConversationId,
  );
  usePageTitle(t('assistant.title'));

  const [photo, setPhoto] = useState(null);
  const photoRef = useRef(null);
  const fileInputRef = useRef(null);
  const composerZoneRef = useRef(null);

  const prefill = location.state?.prefill;
  useEffect(() => {
    if (prefill) {
      navigate('/assistant', { replace: true, state: null });
    }
  }, [prefill, navigate]);

  useEffect(() => {
    photoRef.current = photo;
  }, [photo]);

  useEffect(
    () => () => {
      if (photoRef.current) {
        URL.revokeObjectURL(photoRef.current.objectUrl);
      }
    },
    [],
  );

  useEffect(() => {
    if (state.conversationId && !routeConversationId) {
      navigate(`/assistant/${state.conversationId}`, { replace: true });
    }
  }, [state.conversationId, routeConversationId, navigate]);

  useEffect(() => {
    if (state.messages.length === 0) return undefined;
    const frame = requestAnimationFrame(() => {
      composerZoneRef.current?.scrollIntoView({ block: 'end' });
    });
    return () => cancelAnimationFrame(frame);
  }, [state.messages.length, state.sendStatus, routeConversationId]);

  const isEmpty = state.messages.length === 0 && state.sendStatus === 'idle';

  const handleAttach = () => fileInputRef.current?.click();

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      return;
    }
    setPhoto((current) => {
      if (current) {
        URL.revokeObjectURL(current.objectUrl);
      }
      return { file, objectUrl: URL.createObjectURL(file) };
    });
  };

  const handlePhotoCancel = () => {
    if (photo) {
      URL.revokeObjectURL(photo.objectUrl);
    }
    setPhoto(null);
  };

  const handlePhotoConfirm = () => {
    if (!photo) return;
    photoRef.current = null;
    setPhoto(null);
    navigate('/diagnosis', { state: { pendingPhoto: { file: photo.file, objectUrl: photo.objectUrl } } });
  };

  const handleNewChat = () => {
    reset();
    if (routeConversationId) {
      navigate('/assistant', { replace: true });
    }
  };

  const greetingMessage = {
    id: 'greeting',
    role: 'assistant',
    content: `${t('assistant.greeting')}\n\n${t('assistant.capability')}`,
  };

  const showChat = loadStatus === 'idle' || loadStatus === 'success';

  return (
    <div className="flex min-h-dvh flex-col">
      <AssistantHeader
        title={conversationTitle ?? t('assistant.title')}
        onNewChat={handleNewChat}
      />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
        <div aria-label={t('assistant.messagesLabel')} className="flex flex-1 flex-col gap-4 py-4">
          <p className="sr-only" role="status" aria-live="polite">
            {state.sendStatus === 'pending' ? t('assistant.thinking') : ''}
          </p>

          {loadStatus === 'loading' && (
            <div className="flex flex-col gap-4 py-2" aria-hidden="true">
              <div className="flex justify-end">
                <Skeleton className="h-10 w-3/5 rounded-xl" />
              </div>
              <div className="flex justify-start">
                <Skeleton className="h-24 w-4/5 rounded-xl" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-2/5 rounded-xl" />
              </div>
            </div>
          )}

          {loadStatus === 'missing' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
              <p className="max-w-sm text-base font-semibold text-soil-800">
                {t('assistant.conversationMissing')}
              </p>
              <ButtonLink to="/assistant">{t('assistant.startNewChat')}</ButtonLink>
            </div>
          )}

          {loadStatus === 'error' && <ErrorState message={t('assistant.loadError')} onRetry={retryLoad} />}

          {showChat && (
            <>
              {isEmpty ? (
                <>
                  {/* Welcome card — AI copilot identity */}
                  <div className="rounded-xl border border-soil-200 bg-surface p-5 md:p-6 shadow-card">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ai-600 text-white shadow-card">
                        <SproutIcon className="h-6 w-6" />
                      </span>
                      <div>
                        <h2 className="font-display text-lg font-semibold tracking-tight text-soil-900">
                          Your AI farming copilot
                        </h2>
                        <p className="mt-1 text-sm leading-relaxed text-soil-600">
                          Ask anything about your crops, diseases, weather, or soil. Get practical advice tailored to your farm and local conditions.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {CAPABILITIES.map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-2.5 rounded-lg bg-soil-100/60 dark:bg-soil-200 px-3 py-2 text-sm text-soil-700 dark:text-soil-500">
                          <Icon className="h-4 w-4 shrink-0 text-ai-600 dark:text-ai-400" />
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Demo conversation */}
                  <div className="flex flex-col gap-1">
                    <p className="px-1 text-xs font-semibold uppercase tracking-wide text-soil-400">
                      Example conversation
                    </p>
                    <ul className="flex flex-col gap-4">
                      {DEMO_MESSAGES.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))}
                    </ul>
                  </div>

                  {/* Suggested questions */}
                  <SuggestedQuestions onSuggestion={send} />
                </>
              ) : (
                <ul className="flex flex-col gap-4">
                  {state.messages.map((message) => (
                    <MessageBubble key={message.id} message={message} onRetry={retry} />
                  ))}
                  {state.sendStatus === 'pending' && <TypingIndicator />}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      <div ref={composerZoneRef} className="mx-auto w-full max-w-3xl scroll-mb-24 lg:scroll-mb-8">
        {photo && (
          <div className="mb-3">
            <PhotoHandoff photo={photo} onConfirm={handlePhotoConfirm} onCancel={handlePhotoCancel} />
          </div>
        )}
        <Composer
          disabled={state.sendStatus === 'pending'}
          onSend={send}
          onAttach={handleAttach}
          initialValue={prefill}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default AssistantPage;

import { storage } from './storage';

/**
 * Local-first conversation store (frontend-spec.md §6.9, Appendix A5):
 * stands in for the server-side conversation endpoints (§15.5) while the
 * backend is absent. All writes go through the storage seam; swapping this
 * adapter for `fetchConversation` / `chatAssistant` when the API goes live
 * leaves the hook and screens unchanged.
 */

const LIST_KEY = 'agri.conversations';
const ITEM_KEY_PREFIX = 'agri.conversation.';
const MAX_CONVERSATIONS = 20;
const TITLE_MAX_LENGTH = 60;

// ---------------------------------------------------------------------------
// Demo seed (fixture data). The dashboard fixture (§15.3) links its
// "recent activity" row to /assistant/c-101; seeding the same conversation
// here makes that hand-off work end to end. Matches the canned chat answer
// for yellowing wheat leaves.
// ---------------------------------------------------------------------------
const SEED_CONVERSATION = {
  id: 'c-101',
  title: 'Why are my wheat leaves turning yellow?',
  created_at: '2026-09-01T09:10:00Z',
  messages: [
    {
      id: 'm-101-u',
      role: 'user',
      content: 'Why are my wheat leaves turning yellow?',
      created_at: '2026-09-01T09:10:00Z',
    },
    {
      id: 'm-101-a',
      role: 'assistant',
      content:
        'Yellowing wheat leaves usually point to nitrogen deficiency.\n- Apply 40–50 kg urea per acre and water lightly within two days.\n- If leaves also have rusty streaks, it could be leaf rust — a photo scan can confirm.\n- Avoid overwatering; yellow tips can also come from waterlogged soil.',
      created_at: '2026-09-01T09:10:30Z',
      follow_ups: ['How do I treat leaf rust?', 'How much urea per acre for wheat?'],
      sources: [
        { title: 'Punjab Agriculture Department — wheat nutrition guide', url: 'https://agripunjab.gov.pk' },
      ],
    },
  ],
};

function parseJson(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function truncate(text, maxLength = TITLE_MAX_LENGTH) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function readList() {
  return parseJson(storage.get(LIST_KEY)) ?? [];
}

function writeList(list) {
  storage.set(LIST_KEY, JSON.stringify(list));
}

function readItem(id) {
  return parseJson(storage.get(`${ITEM_KEY_PREFIX}${id}`));
}

function writeItem(conversation) {
  storage.set(`${ITEM_KEY_PREFIX}${conversation.id}`, JSON.stringify(conversation));
}

/** Idempotent: writes the demo seed once so /assistant/c-101 resolves. */
function ensureSeeded() {
  if (!readItem(SEED_CONVERSATION.id)) {
    writeItem(SEED_CONVERSATION);
    const list = readList();
    if (!list.some((entry) => entry.id === SEED_CONVERSATION.id)) {
      list.push({
        id: SEED_CONVERSATION.id,
        title: SEED_CONVERSATION.title,
        updated_at: SEED_CONVERSATION.created_at,
        preview: SEED_CONVERSATION.title,
      });
      writeList(list);
    }
  }
}

/**
 * Conversation list for the History screen (§15.5):
 * [{ id, title, updated_at, preview }], newest first, capped at N.
 */
export function listConversations() {
  ensureSeeded();
  return readList().sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
}

/**
 * Conversation detail for resume (§15.5): { id, title, created_at, messages }.
 * Throws an error with `code: 'not_found'` when the id is unknown — the
 * assistant maps that to its "no longer available" state.
 */
export function loadConversation(id) {
  ensureSeeded();
  const conversation = readItem(id);
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.code = 'not_found';
    throw error;
  }
  return conversation;
}

/**
 * Appends one exchange (user message + assistant answer) to a conversation,
 * creating it when the id is new. Returns the stored conversation.
 */
export function appendExchange(conversationId, { userMessage, assistantMessage }) {
  ensureSeeded();
  const existing = readItem(conversationId);
  const conversation = existing ?? {
    id: conversationId,
    title: truncate(userMessage.content),
    created_at: userMessage.created_at,
    messages: [],
  };

  conversation.messages.push(userMessage, assistantMessage);
  writeItem(conversation);

  const list = readList().filter((entry) => entry.id !== conversation.id);
  list.push({
    id: conversation.id,
    title: conversation.title,
    updated_at: assistantMessage.created_at,
    preview: truncate(userMessage.content),
  });
  writeList(list.slice(-MAX_CONVERSATIONS));

  return conversation;
}

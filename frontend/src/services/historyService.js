import {
  fetchHistory,
  deleteHistoryItem as deleteHistoryRequest,
} from './api';

const normalizeHistoryRecord = (record) => ({
  id: `history-${record.id}`,
  type: record.event_type,
  title: record.title,
  description: record.description ?? '',
  fullDescription: record.full_description ?? record.description ?? '',
  occurredAt: record.occurred_at,
  field: record.field_name ?? '',
  crop: record.crop ?? '',
  status: record.status ?? 'Completed',
  relatedEntityType: record.related_entity_type ?? null,
  relatedEntityId: record.related_entity_id ?? null,
});

const toBackendId = (id) => {
  const match = /^history-(\d+)$/.exec(String(id));
  return match ? match[1] : id;
};

/** History service — uses the real FastAPI + PostgreSQL backend. */
export function getHistory() {
  return fetchHistory().then((records) => records.map(normalizeHistoryRecord));
}

export function deleteHistory(id) {
  return deleteHistoryRequest(toBackendId(id)).then(() => true);
}

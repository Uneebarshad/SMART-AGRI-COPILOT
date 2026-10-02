import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/useT';
import { usePageTitle } from '../hooks/usePageTitle';
import { formatDate } from '../lib/format';
import { PageHeader } from '../components/layout/PageHeader';
import { FieldDrawer } from '../components/fields/FieldDrawer';
import { Badge, Banner, Button, ButtonLink, Card, EmptyState, ErrorState, SelectField, Skeleton, TextField } from '../components/ui';
import { CalendarIcon } from '../components/ui/icons/CalendarIcon';
import { ChatIcon } from '../components/ui/icons/ChatIcon';
import { ChartIcon } from '../components/ui/icons/ChartIcon';
import { ChevronRightIcon } from '../components/ui/icons/ChevronRightIcon';
import { CloudRainIcon } from '../components/ui/icons/CloudRainIcon';
import { LeafIcon } from '../components/ui/icons/LeafIcon';
import { MapPinIcon } from '../components/ui/icons/MapPinIcon';
import { SearchIcon } from '../components/ui/icons/SearchIcon';
import { TrashIcon } from '../components/ui/icons/TrashIcon';
import { getHistory, deleteHistory } from '../services/historyService';
import { deleteConversation, getConversations } from '../services/conversationService';

const TYPE_CONFIG = {
  assistant: { label: 'AI Assistant', Icon: ChatIcon, tile: 'bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400' },
  diagnosis: { label: 'Leaf Diagnosis', Icon: LeafIcon, tile: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400' },
  field: { label: 'Field Activity', Icon: MapPinIcon, tile: 'bg-sun-100 text-sun-800 dark:bg-sun-900/20 dark:text-sun-400' },
  weather: { label: 'Weather Insight', Icon: CloudRainIcon, tile: 'bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400' },
  recommendation: { label: 'Farming Recommendation', Icon: ChartIcon, tile: 'bg-field-100 text-field-700 dark:bg-field-900/20 dark:text-field-400' },
};

const STATUS_TONES = {
  Completed: 'success',
  Reviewed: 'info',
  Saved: 'neutral',
  'Action needed': 'warning',
};

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
];

const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatDateTime(value) {
  const date = new Date(value);
  return { date: DATE_FORMATTER.format(date), time: TIME_FORMATTER.format(date) };
}

function getFieldCropLabel(record) {
  return [record.field, record.crop].filter(Boolean).join(' · ');
}

function HistoryFilters({ filters, fieldCropOptions, onChange, onClear }) {
  const typeOptions = [
    { value: 'all', label: 'All activity types' },
    ...Object.entries(TYPE_CONFIG).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  ];
  const hasActiveFilters = Object.values(filters).some((value) => value && value !== 'all');

  return (
    <Card className="mb-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-soil-900">Find an activity</h2>
          <p className="mt-1 text-sm text-soil-600">Filter your local activity history by type, timing, or field.</p>
        </div>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label="Search history"
          type="search"
          placeholder="Search activities…"
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
          className="sm:col-span-2 lg:col-span-1"
        />
        <SelectField
          label="Activity type"
          options={typeOptions}
          value={filters.type}
          onChange={(event) => onChange('type', event.target.value)}
        />
        <SelectField
          label="Date range"
          options={DATE_RANGE_OPTIONS}
          value={filters.dateRange}
          onChange={(event) => onChange('dateRange', event.target.value)}
        />
        <SelectField
          label="Field or crop"
          options={fieldCropOptions}
          value={filters.fieldCrop}
          onChange={(event) => onChange('fieldCrop', event.target.value)}
        />
      </div>
    </Card>
  );
}

function HistoryRecord({ record, onViewDetails }) {
  const { Icon, label, tile } = TYPE_CONFIG[record.type];
  const { date, time } = formatDateTime(record.occurredAt);

  return (
    <li>
      <Card className="p-0 md:p-0">
        <div className="flex items-start gap-3 p-4 md:gap-4 md:p-5">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tile}`}>
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-medium text-soil-500">{label}</p>
              <Badge tone={STATUS_TONES[record.status]}>{record.status}</Badge>
            </div>
            <h3 className="mt-1 text-base font-semibold text-soil-900">{record.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-soil-600">{record.description}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-soil-500">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-soil-400" />
                {date} · {time}
              </span>
              {getFieldCropLabel(record) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPinIcon className="h-4 w-4 text-soil-400" />
                  {getFieldCropLabel(record)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onViewDetails(record)}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-field-700 transition-colors hover:bg-field-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 focus-visible:ring-offset-2"
          >
            <span className="hidden sm:inline">View details</span>
            <span className="sm:hidden" aria-hidden="true">View</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </li>
  );
}

function HistoryDetailDrawer({ record, onClose, onDelete }) {
  if (!record) return null;

  const { Icon, label, tile } = TYPE_CONFIG[record.type];
  const { date, time } = formatDateTime(record.occurredAt);

  return (
    <FieldDrawer
      open={Boolean(record)}
      onClose={onClose}
      title={record.title}
      description={`${label} · ${record.status}`}
      footer={
        <Button variant="danger" fullWidth onClick={() => onDelete(record)}>
          <TrashIcon className="h-4 w-4" /> Delete activity
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 items-center justify-center rounded-lg ${tile}`}>
            <Icon className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-soil-800">{label}</p>
            <Badge tone={STATUS_TONES[record.status]}>{record.status}</Badge>
          </div>
        </div>
        <dl className="divide-y divide-soil-100 dark:divide-soil-300 rounded-lg border border-soil-200 dark:border-soil-300 bg-soil-50 dark:bg-soil-200 px-4">
          <div className="flex items-start justify-between gap-4 py-3">
            <dt className="flex items-center gap-2 text-sm text-soil-500">
              <CalendarIcon className="h-4 w-4 text-soil-400" />
              Date and time
            </dt>
            <dd className="text-end text-sm font-medium text-soil-800">{date} · {time}</dd>
          </div>
          {getFieldCropLabel(record) && (
            <div className="flex items-start justify-between gap-4 py-3">
              <dt className="flex items-center gap-2 text-sm text-soil-500">
                <MapPinIcon className="h-4 w-4 text-soil-400" />
                Related field/crop
              </dt>
              <dd className="text-end text-sm font-medium text-soil-800">{getFieldCropLabel(record)}</dd>
            </div>
          )}
        </dl>
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight text-soil-900">Details</h3>
          <p className="mt-2 text-base leading-relaxed text-soil-700">{record.fullDescription}</p>
        </div>
      </div>
    </FieldDrawer>
  );
}

function HistorySkeleton() {
  return (
    <ol className="space-y-3">
      {[1, 2, 3, 4, 5].map((item) => (
        <li key={item}>
          <Card className="p-0">
            <div className="flex items-start gap-3 p-4 md:gap-4 md:p-5">
              <Skeleton className="h-11 w-11 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        </li>
      ))}
    </ol>
  );
}

/**
 * One stored AI conversation (redesign §7): real title from the backend
 * (derived from the first question), open and delete through the existing
 * conversation endpoints. Nothing is synthesized here.
 */
function ConversationRow({ conversation, onOpen, onDelete }) {
  const { t, lang } = useT();
  return (
    <li>
      <Card className="p-0 md:p-0">
        <div className="flex items-center gap-3 p-4 md:gap-4 md:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-ai-100 text-ai-700 dark:bg-ai-900/20 dark:text-ai-400">
            <ChatIcon className="h-5 w-5" />
          </span>
          <button
            type="button"
            onClick={() => onOpen(conversation)}
            className="min-w-0 flex-1 rounded-md text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-500"
          >
            <p className="truncate text-base font-semibold text-soil-900">
              {conversation.title || t('conversations.untitled')}
            </p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-soil-500">
              <CalendarIcon className="h-4 w-4 text-soil-400" />
              {formatDate(conversation.updatedAt ?? conversation.createdAt, lang)}
            </p>
          </button>
          <button
            type="button"
            onClick={() => onDelete(conversation.id)}
            aria-label={t('conversations.deleteAria')}
            title={t('conversations.deleteAria')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-soil-400 transition-colors hover:bg-rust-50 hover:text-rust-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rust-500 dark:hover:bg-rust-900/15"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onOpen(conversation)}
            aria-label={t('conversations.openAria')}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-field-700 transition-colors hover:bg-field-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-field-600 dark:hover:bg-field-900/20"
          >
            <span className="hidden sm:inline">{t('conversations.open')}</span>
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </Card>
    </li>
  );
}

function ConversationsSection() {
  const { t } = useT();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  // 'loading' | 'success' | 'error'
  const [status, setStatus] = useState('loading');
  const [deleteError, setDeleteError] = useState(false);

  const load = useCallback(() => {
    setStatus('loading');
    return getConversations()
      .then((items) => {
        setConversations(items);
        setStatus('success');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openConversation = useCallback(
    (conversation) => navigate(`/assistant/${conversation.id}`),
    [navigate],
  );

  const removeConversation = useCallback((id) => {
    setDeleteError(false);
    deleteConversation(id)
      .then(() => setConversations((current) => current.filter((item) => item.id !== id)))
      .catch(() => setDeleteError(true));
  }, []);

  return (
    <section aria-labelledby="conversations-list-title" className="mb-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="conversations-list-title" className="font-display text-lg font-semibold tracking-tight text-soil-900 md:text-xl">
            {t('conversations.listTitle')}
          </h2>
          <p className="mt-1 text-sm text-soil-600">{t('conversations.listSubtitle')}</p>
        </div>
        <p className="text-sm text-soil-500">{status === 'success' ? `${conversations.length}` : ''}</p>
      </div>

      {deleteError && (
        <Banner tone="error" className="mb-3">{t('conversations.deleteError')}</Banner>
      )}

      {status === 'loading' && (
        <ol className="space-y-3" aria-hidden="true">
          {[1, 2, 3].map((item) => (
            <li key={item}>
              <Card className="p-0">
                <div className="flex items-center gap-3 p-4">
                  <Skeleton className="h-11 w-11 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}

      {status === 'error' && (
        <Card>
          <ErrorState
            title={t('conversations.loadErrorTitle')}
            message={t('conversations.loadError')}
            onRetry={load}
          />
        </Card>
      )}

      {status === 'success' && conversations.length === 0 && (
        <Card>
          <EmptyState
            icon={ChatIcon}
            title={t('conversations.emptyTitle')}
            description={t('conversations.emptyDesc')}
            action={
              <ButtonLink to="/assistant" variant="primary">
                {t('conversations.startAction')}
              </ButtonLink>
            }
          />
        </Card>
      )}

      {status === 'success' && conversations.length > 0 && (
        <ol className="space-y-3" aria-label={t('conversations.listLabel')}>
          {conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              onOpen={openConversation}
              onDelete={removeConversation}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

export function HistoryPage() {
  const { t } = useT();
  usePageTitle(t('conversations.title'));
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [filters, setFilters] = useState({ type: 'all', dateRange: 'all', fieldCrop: 'all', search: '' });
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [notice, setNotice] = useState('');

  const loadHistory = useCallback(() => {
    setLoadStatus('loading');
    return getHistory()
      .then((data) => {
        setRecords(data);
        setLoadStatus('success');
      })
      .catch(() => setLoadStatus('error'));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const fieldCropOptions = useMemo(() => {
    const values = [...new Set(records.map(getFieldCropLabel).filter(Boolean))];
    return [
      { value: 'all', label: 'All fields and crops' },
      ...values.map((value) => ({ value, label: value })),
    ];
  }, [records]);

  const filteredRecords = useMemo(() => {
    const latestDate = new Date(records[0]?.occurredAt ?? Date.now());
    const query = filters.search.trim().toLowerCase();

    return records.filter((record) => {
      const recordDate = new Date(record.occurredAt);
      const matchesType = filters.type === 'all' || record.type === filters.type;
      const matchesFieldCrop = filters.fieldCrop === 'all' || getFieldCropLabel(record) === filters.fieldCrop;
      const matchesSearch = !query || [
        record.title,
        record.description,
        record.fullDescription,
        TYPE_CONFIG[record.type].label,
        record.field,
        record.crop,
        record.status,
      ].filter(Boolean).some((value) => value.toLowerCase().includes(query));

      let matchesDate = true;
      if (filters.dateRange === 'today') {
        matchesDate = recordDate.toDateString() === latestDate.toDateString();
      } else if (filters.dateRange !== 'all') {
        const startDate = new Date(latestDate);
        startDate.setDate(startDate.getDate() - Number(filters.dateRange) + 1);
        matchesDate = recordDate >= startDate;
      }

      return matchesType && matchesFieldCrop && matchesSearch && matchesDate;
    });
  }, [filters, records]);

  const handleViewDetails = useCallback((record) => {
    if (record.type === 'assistant' && record.relatedEntityId) {
      navigate(`/assistant/${record.relatedEntityId}`);
      return;
    }
    setSelectedRecord(record);
  }, [navigate]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => setFilters({ type: 'all', dateRange: 'all', fieldCrop: 'all', search: '' });
  const handleDelete = async (record) => {
    try {
      await deleteHistory(record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setSelectedRecord(null);
      setNotice('Activity removed from your history.');
    } catch {
      setNotice('Couldn\u2019t delete this activity. Please try again.');
    }
  };

  return (
    <>
      <PageHeader title={t('conversations.title')} subtitle={t('conversations.subtitle')} />
      {notice && <Banner tone={notice.includes('Couldn') ? 'error' : 'success'}>{notice}</Banner>}

      <ConversationsSection />

      {loadStatus === 'loading' && <HistorySkeleton />}

      {loadStatus === 'error' && (
        <Card>
          <ErrorState title="Couldn't load history" message="Your activity history could not be loaded. Please try again." onRetry={loadHistory} />
        </Card>
      )}

      {loadStatus === 'success' && (
      <>
      <HistoryFilters
        filters={filters}
        fieldCropOptions={fieldCropOptions}
        onChange={updateFilter}
        onClear={clearFilters}
      />
      <section aria-labelledby="history-list-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="history-list-title" className="font-display text-lg font-semibold tracking-tight text-soil-900 md:text-xl">{t('conversations.timelineTitle')}</h2>
            <p className="mt-1 text-sm text-soil-600">{t('conversations.timelineSubtitle')}</p>
          </div>
          <p className="text-sm text-soil-500">{filteredRecords.length} of {records.length} activities</p>
        </div>
        {filteredRecords.length > 0 ? (
          <ol className="space-y-3" aria-label="History activity list">
            {filteredRecords.map((record) => (
              <HistoryRecord key={record.id} record={record} onViewDetails={handleViewDetails} />
            ))}
          </ol>
        ) : (
          <Card>
            <EmptyState
              icon={SearchIcon}
              title="No activities found"
              description="Try a different search or clear the filters to see more of your local history."
              action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
            />
          </Card>
        )}
      </section>
      </>
      )}
      <HistoryDetailDrawer record={selectedRecord} onClose={() => setSelectedRecord(null)} onDelete={handleDelete} />
    </>
  );
}

export default HistoryPage;

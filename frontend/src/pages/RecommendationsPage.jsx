import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { RecommendationDetailsDrawer } from '../components/recommendations/RecommendationDetailsDrawer';
import { RecommendationListCard } from '../components/recommendations/RecommendationListCard';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '../components/recommendations/recommendationPresentation';
import { getRecommendations, updateRecommendationStatus } from '../services/recommendationService';
import { AlertTriangleIcon } from '../components/ui/icons/AlertTriangleIcon';
import { CheckCircleIcon } from '../components/ui/icons/CheckCircleIcon';
import { ChartIcon } from '../components/ui/icons/ChartIcon';
import { RefreshIcon } from '../components/ui/icons/RefreshIcon';
import { SearchIcon } from '../components/ui/icons/SearchIcon';
import { Button, Banner, Card, EmptyState, ErrorState, SelectField, Skeleton } from '../components/ui';

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }));

const formatCount = (value) => value.toString().padStart(2, '0');

function RecommendationSummary({ recommendations }) {
  const summary = {
    total: recommendations.length,
    high: recommendations.filter((item) => item.priority === 'high').length,
    medium: recommendations.filter((item) => item.priority === 'medium').length,
    low: recommendations.filter((item) => item.priority === 'low').length,
    completed: recommendations.filter((item) => item.status === 'completed').length,
  };

  const items = [
    { key: 'total', label: 'Total recommendations', icon: ChartIcon, tone: 'text-field-700' },
    { key: 'high', label: 'High priority', icon: AlertTriangleIcon, tone: 'text-rust-700' },
    { key: 'medium', label: 'Medium priority', icon: AlertTriangleIcon, tone: 'text-sun-700' },
    { key: 'low', label: 'Low priority', icon: CheckCircleIcon, tone: 'text-soil-600' },
    { key: 'completed', label: 'Completed', icon: CheckCircleIcon, tone: 'text-field-700' },
  ];

  return (
    <section aria-labelledby="priority-summary-heading">
      <div className="mb-3">
        <h2 id="priority-summary-heading" className="font-display text-xl font-semibold tracking-tight text-soil-900">Priority summary</h2>
        <p className="mt-1 text-sm text-soil-600">A quick view of what needs your attention first.</p>
      </div>
      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-2 divide-x divide-y divide-soil-200 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
          {items.map(({ key, label, icon: Icon, tone }) => (
            <div key={key} className="p-4 md:p-5">
              <Icon className={`h-5 w-5 ${tone}`} />
              <p className="mt-3 text-xs font-medium text-soil-500">{label}</p>
              <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-soil-900">{formatCount(summary[key])}</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

function RecommendationsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Card key={item} className="space-y-4">
          <div className="flex gap-3"><Skeleton className="h-11 w-11 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-28" /><Skeleton className="h-4 w-3/4" /></div></div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-9 w-full" />
        </Card>
      ))}
    </div>
  );
}

export function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [filters, setFilters] = useState({ category: '', priority: '', crop: '', field: '', status: '' });
  const [search, setSearch] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadRecommendations = useCallback(() => {
    setLoadStatus('loading');
    return getRecommendations()
      .then((result) => {
        setRecommendations(result);
        setLoadStatus('success');
      })
      .catch(() => setLoadStatus('error'));
  }, []);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const cropOptions = useMemo(() => [...new Set(recommendations.map((item) => item.crop))].sort().map((crop) => ({ value: crop, label: crop })), [recommendations]);
  const fieldOptions = useMemo(() => [...new Set(recommendations.map((item) => item.field))].sort().map((field) => ({ value: field, label: field })), [recommendations]);

  const filteredRecommendations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return recommendations.filter((recommendation) => {
      const searchable = [recommendation.title, recommendation.description, recommendation.crop, recommendation.field, CATEGORY_LABELS[recommendation.category]].join(' ').toLowerCase();
      return (!query || searchable.includes(query))
        && (!filters.category || recommendation.category === filters.category)
        && (!filters.priority || recommendation.priority === filters.priority)
        && (!filters.crop || recommendation.crop === filters.crop)
        && (!filters.field || recommendation.field === filters.field)
        && (!filters.status || recommendation.status === filters.status);
    });
  }, [recommendations, search, filters]);

  const hasFilters = Boolean(search || Object.values(filters).some(Boolean));
  const clearFilters = () => {
    setSearch('');
    setFilters({ category: '', priority: '', crop: '', field: '', status: '' });
  };

  const handleRefresh = () => {
    setNotice(null);
    setRefreshing(true);
    loadRecommendations().finally(() => setRefreshing(false));
  };

  const handleMarkDone = async (recommendation) => {
    setUpdatingId(recommendation.id);
    try {
      const updated = await updateRecommendationStatus(recommendation.id, 'completed');
      setRecommendations((current) => current.map((item) => item.id === updated.id ? updated : item));
      setSelectedRecommendation((current) => current?.id === updated.id ? updated : current);
      setNotice({ tone: 'success', message: 'Recommendation marked as done on this device.' });
    } catch {
      setNotice({ tone: 'error', message: 'Couldn’t update this recommendation. Please try again.' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Recommendations"
        subtitle="Clear, practical next steps for the crops and fields you manage."
        action={(
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshIcon className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        )}
      />

      {notice && <Banner tone={notice.tone}>{notice.message}</Banner>}

      {loadStatus === 'loading' && <RecommendationsSkeleton />}

      {loadStatus === 'error' && (
        <Card>
          <ErrorState title="Couldn’t load recommendations" message="Your local recommendation list could not be opened. Try again to continue." onRetry={loadRecommendations} />
        </Card>
      )}

      {loadStatus === 'success' && (
        <>
          <RecommendationSummary recommendations={recommendations} />

          <Card>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="block md:col-span-2 lg:col-span-3">
                <span className="mb-1.5 block text-sm font-medium text-soil-800">Search recommendations</span>
                <span className="relative block">
                  <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-soil-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title, crop, field, or category"
                    className="h-11 w-full rounded-md border border-soil-300 dark:border-soil-200 bg-surface pe-3 ps-10 text-base text-soil-900 placeholder:text-soil-400 focus:border-field-600 focus:outline-none focus:ring-2 focus:ring-field-600/20"
                  />
                </span>
              </label>
              <SelectField label="Category" value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))} options={[{ value: '', label: 'All categories' }, ...CATEGORY_OPTIONS]} />
              <SelectField label="Priority" value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))} options={[{ value: '', label: 'All priorities' }, ...PRIORITY_OPTIONS]} />
              <SelectField label="Crop" value={filters.crop} onChange={(event) => setFilters((current) => ({ ...current, crop: event.target.value }))} options={[{ value: '', label: 'All crops' }, ...cropOptions]} />
              <SelectField label="Field" value={filters.field} onChange={(event) => setFilters((current) => ({ ...current, field: event.target.value }))} options={[{ value: '', label: 'All fields' }, ...fieldOptions]} />
              <SelectField label="Status" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS]} />
            </div>
          </Card>

          <section aria-labelledby="recommendations-heading">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="recommendations-heading" className="font-display text-xl font-semibold tracking-tight text-soil-900">Priority recommendations</h2>
                <p className="mt-1 text-sm text-soil-600">Start with high-priority items, then work through the rest when you can.</p>
              </div>
              <p className="text-sm text-soil-500">{filteredRecommendations.length} of {recommendations.length} shown</p>
            </div>

            {filteredRecommendations.length === 0 ? (
              <Card>
                <EmptyState
                  icon={SearchIcon}
                  title="No recommendations match these filters"
                  description="Try a different search or clear the filters to see every recommendation."
                  action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button> : undefined}
                />
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
                {filteredRecommendations.map((recommendation) => (
                  <RecommendationListCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    onViewDetails={setSelectedRecommendation}
                    onMarkDone={handleMarkDone}
                    updating={updatingId === recommendation.id}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <RecommendationDetailsDrawer
        recommendation={selectedRecommendation}
        onClose={() => setSelectedRecommendation(null)}
        onMarkDone={handleMarkDone}
        updating={updatingId === selectedRecommendation?.id}
      />
    </div>
  );
}

export default RecommendationsPage;

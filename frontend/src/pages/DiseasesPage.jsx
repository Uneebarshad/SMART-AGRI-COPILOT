import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { DiseaseCard } from '../components/diseases/DiseaseCard';
import { DiseaseDetailDrawer } from '../components/diseases/DiseaseDetailDrawer';
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorState, SelectField, Skeleton, TextField } from '../components/ui';
import { BugIcon } from '../components/ui/icons/BugIcon';
import { LeafIcon } from '../components/ui/icons/LeafIcon';
import { SearchIcon } from '../components/ui/icons/SearchIcon';
import { filterDiseases, getDiseases, searchDiseases } from '../services/diseaseService';

const INITIAL_FILTERS = { crop: 'all', type: 'all', severity: 'all', search: '', sort: 'common' };

const CROP_OPTIONS = ['Tomato', 'Potato', 'Wheat', 'Rice', 'Cotton', 'Maize'].map((crop) => ({
  value: crop,
  label: crop,
}));

const TYPE_OPTIONS = ['Fungal', 'Bacterial', 'Viral', 'Pest-related'].map((type) => ({
  value: type,
  label: type,
}));

const SEVERITY_OPTIONS = ['Low', 'Medium', 'High'].map((severity) => ({
  value: severity,
  label: severity,
}));

const SORT_OPTIONS = [
  { value: 'common', label: 'Most common' },
  { value: 'az', label: 'A–Z' },
  { value: 'severity', label: 'Severity' },
];

const SEVERITY_RANK = { Low: 1, Medium: 2, High: 3 };

function sortDiseases(diseases, sort) {
  return [...diseases].sort((first, second) => {
    if (sort === 'az') return first.name.localeCompare(second.name);
    if (sort === 'severity') {
      return SEVERITY_RANK[second.severity] - SEVERITY_RANK[first.severity] || first.name.localeCompare(second.name);
    }
    return second.commonness - first.commonness;
  });
}

function DiseaseFilters({ filters, onChange, onClear }) {
  const hasActiveFilters = filters.search || filters.crop !== 'all' || filters.type !== 'all' || filters.severity !== 'all';

  return (
    <Card className="mb-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-soil-900">Find a disease</h2>
          <p className="mt-1 text-sm text-soil-600">Search the library or narrow it down by crop, type, and severity.</p>
        </div>
        {hasActiveFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={onClear}>
            Clear filters
          </Button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField
          label="Search diseases"
          type="search"
          placeholder="Search diseases, crops, or symptoms..."
          value={filters.search}
          onChange={(event) => onChange('search', event.target.value)}
          className="sm:col-span-2 lg:col-span-1"
        />
        <SelectField
          label="Crop"
          options={[{ value: 'all', label: 'All crops' }, ...CROP_OPTIONS]}
          value={filters.crop}
          onChange={(event) => onChange('crop', event.target.value)}
        />
        <SelectField
          label="Disease type"
          options={[{ value: 'all', label: 'All disease types' }, ...TYPE_OPTIONS]}
          value={filters.type}
          onChange={(event) => onChange('type', event.target.value)}
        />
        <SelectField
          label="Severity"
          options={[{ value: 'all', label: 'All severities' }, ...SEVERITY_OPTIONS]}
          value={filters.severity}
          onChange={(event) => onChange('severity', event.target.value)}
        />
      </div>
    </Card>
  );
}

function LeafDiagnosisCta() {
  return (
    <Card className="mt-6 flex flex-col gap-4 border-field-200 bg-field-50 sm:flex-row sm:items-center sm:justify-between dark:border-field-500/30 dark:bg-field-900/15">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface text-field-700 dark:bg-surface dark:text-field-400">
          <LeafIcon className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-field-900 dark:text-field-400">Can&apos;t identify a disease?</h2>
          <p className="mt-1 text-sm leading-relaxed text-field-800 dark:text-field-300">Try Leaf Diagnosis for a guided photo check, then use this library to learn more.</p>
        </div>
      </div>
      <ButtonLink to="/diagnosis" variant="secondary" className="shrink-0">
        Try Leaf Diagnosis
      </ButtonLink>
    </Card>
  );
}

function DiseasesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Card key={item} className="space-y-4">
          <div className="flex gap-3"><Skeleton className="h-11 w-11 rounded-lg" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-28" /><Skeleton className="h-4 w-3/4" /></div></div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      ))}
    </div>
  );
}

export function DiseasesPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [allDiseases, setAllDiseases] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');

  const loadDiseases = useCallback(() => {
    setLoadStatus('loading');
    getDiseases()
      .then((diseases) => {
        setAllDiseases(diseases);
        setLoadStatus('success');
      })
      .catch(() => setLoadStatus('error'));
  }, []);

  useEffect(() => {
    loadDiseases();
  }, [loadDiseases]);

  const visibleDiseases = useMemo(() => {
    const filtered = filterDiseases(allDiseases, filters);
    return sortDiseases(searchDiseases(filters.search, filtered), filters.sort);
  }, [allDiseases, filters]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => setFilters(INITIAL_FILTERS);

  return (
    <>
      <PageHeader
        title="Disease library"
        subtitle="Learn about common crop diseases, warning signs, and practical prevention steps."
      />

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sky-800 dark:border-sky-500/30 dark:bg-sky-900/15 dark:text-sky-400">
        <BugIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <p className="text-sm leading-relaxed">Use these entries for general education and field observation. They do not provide a certain diagnosis.</p>
      </div>

      <DiseaseFilters filters={filters} onChange={updateFilter} onClear={clearFilters} />

      {loadStatus === 'loading' && <DiseasesSkeleton />}

      {loadStatus === 'error' && (
        <Card>
          <ErrorState title="Couldn't load the disease library" message="The disease library could not be loaded. Please try again." onRetry={loadDiseases} />
        </Card>
      )}

      {loadStatus === 'success' && (
      <section aria-labelledby="disease-results-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="disease-results-title" className="font-display text-lg font-semibold tracking-tight text-soil-900 md:text-xl">Common crop diseases</h2>
            <p className="mt-1 text-sm text-soil-600" role="status" aria-live="polite">
              {visibleDiseases.length} of {allDiseases.length} entries shown
            </p>
          </div>
          <SelectField
            label="Sort by"
            options={SORT_OPTIONS}
            value={filters.sort}
            onChange={(event) => updateFilter('sort', event.target.value)}
            className="w-full sm:w-44"
          />
        </div>

        {visibleDiseases.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleDiseases.map((disease) => (
              <DiseaseCard key={disease.id} disease={disease} onViewDetails={setSelectedDisease} />
            ))}
          </div>
        ) : (
          <Card>
            <EmptyState
              icon={SearchIcon}
              title="No matching disease found"
              description="Try a different search or clear the filters to browse the full educational library."
              action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>}
            />
          </Card>
        )}
      </section>
      )}

      <LeafDiagnosisCta />
      <DiseaseDetailDrawer disease={selectedDisease} onClose={() => setSelectedDisease(null)} />
    </>
  );
}

export default DiseasesPage;

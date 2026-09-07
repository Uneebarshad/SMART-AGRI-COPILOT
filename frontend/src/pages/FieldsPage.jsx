import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button, Card, EmptyState, ErrorState, SelectField, Skeleton, StatCard, StatCardSkeleton, Banner } from '../components/ui';
import { FieldCard } from '../components/fields/FieldCard';
import { FieldDetailsDrawer } from '../components/fields/FieldDetailsDrawer';
import { FieldFormDrawer } from '../components/fields/FieldFormDrawer';
import { DeleteFieldDialog } from '../components/fields/DeleteFieldDialog';
import { FieldStatusChip } from '../components/fields/FieldStatusChip';
import { CROP_OPTIONS, FIELD_STATUSES } from '../data/fieldTypes';
import { getFields, createField, updateField, deleteField } from '../services/fieldService';
import { AlertTriangleIcon } from '../components/ui/icons/AlertTriangleIcon';
import { ChartIcon } from '../components/ui/icons/ChartIcon';
import { MapPinIcon } from '../components/ui/icons/MapPinIcon';
import { PlusIcon } from '../components/ui/icons/PlusIcon';
import { SearchIcon } from '../components/ui/icons/SearchIcon';
import { SproutIcon } from '../components/ui/icons/SproutIcon';

const STATUS_OPTIONS = FIELD_STATUSES.map((status) => ({ value: status, label: status }));
const CROP_FILTER_OPTIONS = CROP_OPTIONS.map((crop) => ({ value: crop, label: crop }));

function FieldCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <Card key={item} className="space-y-5">
          <div className="flex justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-40" />
        </Card>
      ))}
    </div>
  );
}

export function FieldsPage() {
  const [fields, setFields] = useState([]);
  const [loadStatus, setLoadStatus] = useState('loading');
  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedField, setSelectedField] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadFields = useCallback(() => {
    setLoadStatus('loading');
    getFields()
      .then((result) => {
        setFields(result);
        setLoadStatus('success');
      })
      .catch(() => setLoadStatus('error'));
  }, []);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const filteredFields = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return fields.filter((field) => {
      const matchesSearch = !normalizedSearch || [field.name, field.location, field.crop].some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesCrop = !cropFilter || field.crop === cropFilter;
      const matchesStatus = !statusFilter || field.status === statusFilter;
      return matchesSearch && matchesCrop && matchesStatus;
    });
  }, [fields, search, cropFilter, statusFilter]);

  const overview = useMemo(() => ({
    total: fields.length,
    area: fields.reduce((total, field) => total + Number(field.area), 0).toFixed(1),
    crops: new Set(fields.map((field) => field.crop)).size,
    attention: fields.filter((field) => field.status === 'Needs Attention').length,
  }), [fields]);

  const openAdd = () => {
    setSelectedField(null);
    setEditingField(null);
    setFormOpen(true);
  };

  const openEdit = (field) => {
    setSelectedField(null);
    setEditingField(field);
    setFormOpen(true);
  };

  const handleSave = async (form) => {
    const saved = editingField ? await updateField(editingField.id, form) : await createField(form);
    setFields((current) => editingField ? current.map((field) => field.id === saved.id ? saved : field) : [saved, ...current]);
    setFormOpen(false);
    setEditingField(null);
    setNotice({ tone: 'success', message: editingField ? 'Field details updated.' : 'Field added to your local list.' });
  };

  const handleDelete = async (field) => {
    setDeleting(true);
    try {
      await deleteField(field.id);
      setFields((current) => current.filter((item) => item.id !== field.id));
      setFieldToDelete(null);
      setNotice({ tone: 'success', message: `${field.name} was removed from your local list.` });
    } catch {
      setNotice({ tone: 'error', message: 'Couldn’t delete this field. Please try again.' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="My fields"
        subtitle="Keep every plot, crop, and next step in view."
        action={
          <Button onClick={openAdd}>
            <PlusIcon className="h-4 w-4" /> Add field
          </Button>
        }
      />

      {notice && <Banner tone={notice.tone}>{notice.message}</Banner>}

      {loadStatus === 'loading' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      )}

      {loadStatus === 'error' && (
        <Card>
          <ErrorState title="Couldn’t load your fields" message="Your local field list could not be opened. Try again to continue." onRetry={loadFields} />
        </Card>
      )}

      {loadStatus === 'success' && (
        <>
          <section aria-labelledby="overview-heading">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 id="overview-heading" className="font-display text-xl font-semibold tracking-tight text-soil-900">Field overview</h2>
                <p className="mt-1 text-sm text-soil-600">A quick read on the land you are tending.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              <StatCard icon={MapPinIcon} label="Total fields" value={overview.total} />
              <StatCard icon={ChartIcon} label="Cultivated area" value={overview.area} unit="acres" />
              <StatCard icon={SproutIcon} label="Active crops" value={overview.crops} />
              <StatCard icon={AlertTriangleIcon} label="Need attention" value={overview.attention} trendTone="negative" />
            </div>
          </section>

          <Card className="p-4 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <label className="block flex-1">
                <span className="mb-1.5 block text-sm font-medium text-soil-800">Search fields</span>
                <span className="relative block">
                  <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-soil-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, location, or crop"
                    className="h-11 w-full rounded-md border border-soil-300 dark:border-soil-200 bg-surface pe-3 ps-10 text-base text-soil-900 placeholder:text-soil-400 focus:border-field-600 focus:outline-none focus:ring-2 focus:ring-field-600/20"
                  />
                </span>
              </label>
              <div className="grid gap-4 sm:grid-cols-2 lg:w-96">
                <SelectField label="Filter by crop" value={cropFilter} onChange={(event) => setCropFilter(event.target.value)} options={[{ value: '', label: 'All crops' }, ...CROP_FILTER_OPTIONS]} />
                <SelectField label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} options={[{ value: '', label: 'All statuses' }, ...STATUS_OPTIONS]} />
              </div>
            </div>
          </Card>

          <section aria-labelledby="fields-heading">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="fields-heading" className="font-display text-xl font-semibold tracking-tight text-soil-900">Your fields</h2>
                <p className="mt-1 text-sm text-soil-600">Select a card to see the full field record.</p>
              </div>
              <p className="text-sm text-soil-500">{filteredFields.length} of {fields.length} shown</p>
            </div>

            {fields.length === 0 && (
              <Card>
                <EmptyState
                  icon={MapPinIcon}
                  title="No fields yet"
                  description="Add your first field to start tracking crops, dates, and notes in one place."
                  action={<Button onClick={openAdd}><PlusIcon className="h-4 w-4" /> Add your first field</Button>}
                />
              </Card>
            )}

            {fields.length > 0 && filteredFields.length === 0 && (
              <Card>
                <EmptyState
                  icon={SearchIcon}
                  title="No fields match these filters"
                  description="Try a different search or clear the filters to see your full list."
                  action={<Button variant="outline" onClick={() => { setSearch(''); setCropFilter(''); setStatusFilter(''); }}>Clear filters</Button>}
                />
              </Card>
            )}

            {filteredFields.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
                {filteredFields.map((field) => (
                  <FieldCard key={field.id} field={field} onOpen={setSelectedField} onEdit={openEdit} onDelete={setFieldToDelete} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="status-guide-heading">
            <Card>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 id="status-guide-heading" className="text-base font-semibold text-soil-900">Status guide</h2>
                  <p className="mt-1 text-sm text-soil-600">Every status includes an icon and a plain-language label.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FIELD_STATUSES.map((status) => <FieldStatusChip key={status} status={status} />)}
                </div>
              </div>
            </Card>
          </section>
        </>
      )}

      <FieldDetailsDrawer
        field={selectedField}
        onClose={() => setSelectedField(null)}
        onEdit={openEdit}
        onDelete={(field) => {
          setSelectedField(null);
          setFieldToDelete(field);
        }}
      />
      <FieldFormDrawer open={formOpen} field={editingField} onClose={() => { setFormOpen(false); setEditingField(null); }} onSave={handleSave} />
      <DeleteFieldDialog field={fieldToDelete} onClose={() => setFieldToDelete(null)} onConfirm={handleDelete} deleting={deleting} />
    </div>
  );
}

export default FieldsPage;

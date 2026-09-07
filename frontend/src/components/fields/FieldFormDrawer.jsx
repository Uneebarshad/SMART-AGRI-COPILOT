import { useEffect, useState } from 'react';
import { Button, SelectField, TextAreaField, TextField } from '../ui';
import { CROP_OPTIONS, IRRIGATION_OPTIONS } from '../../data/fieldTypes';
import { FieldDrawer } from './FieldDrawer';

const EMPTY_FORM = {
  name: '',
  location: '',
  area: '',
  crop: '',
  plantingDate: '',
  harvestDate: '',
  irrigationMethod: '',
  notes: '',
};

const formFromField = (field) =>
  field
    ? {
        name: field.name,
        location: field.location,
        area: String(field.area),
        crop: field.crop,
        plantingDate: field.plantingDate,
        harvestDate: field.harvestDate,
        irrigationMethod: field.irrigationMethod,
        notes: field.notes,
      }
    : EMPTY_FORM;

export function FieldFormDrawer({ open, field, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const editing = Boolean(field);

  useEffect(() => {
    if (open) {
      setForm(formFromField(field));
      setErrors({});
      setFormError('');
    }
  }, [open, field]);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Enter a field name.';
    if (!form.location.trim()) nextErrors.location = 'Enter a location.';
    if (!form.area || Number(form.area) <= 0) nextErrors.area = 'Enter an area greater than zero.';
    if (!form.crop) nextErrors.crop = 'Choose a crop.';
    if (!form.plantingDate) nextErrors.plantingDate = 'Choose a planting date.';
    if (!form.harvestDate) nextErrors.harvestDate = 'Choose a harvest date.';
    if (!form.irrigationMethod) nextErrors.irrigationMethod = 'Choose an irrigation method.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await onSave(form);
    } catch {
      setFormError('Couldn’t save this field. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FieldDrawer
      open={open}
      onClose={onClose}
      title={editing ? 'Edit field' : 'Add field'}
      description={editing ? 'Update the details you use to track this field.' : 'Add a field to start tracking its crop and care.'}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="field-form" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Save field'}
          </Button>
        </div>
      }
    >
      <form id="field-form" onSubmit={submit} className="space-y-5">
        {formError && (
          <div role="alert" className="rounded-lg border-l-4 border-rust-600 bg-rust-50 p-3 text-sm text-rust-800 dark:border-rust-500/40 dark:bg-rust-900/15 dark:text-rust-400">
            {formError}
          </div>
        )}
        <TextField label="Field name" required value={form.name} onChange={update('name')} error={errors.name} placeholder="e.g. South orchard" />
        <TextField label="Location" required value={form.location} onChange={update('location')} error={errors.location} placeholder="e.g. Block C · Lahore" />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Area (acres)" required type="number" min="0.1" step="0.1" value={form.area} onChange={update('area')} error={errors.area} placeholder="0.0" />
          <SelectField label="Crop" required value={form.crop} onChange={update('crop')} error={errors.crop} placeholder="Choose a crop" options={CROP_OPTIONS} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Planting date" required type="date" value={form.plantingDate} onChange={update('plantingDate')} error={errors.plantingDate} />
          <TextField label="Harvest date" required type="date" value={form.harvestDate} onChange={update('harvestDate')} error={errors.harvestDate} />
        </div>
        <SelectField label="Irrigation method" required value={form.irrigationMethod} onChange={update('irrigationMethod')} error={errors.irrigationMethod} placeholder="Choose a method" options={IRRIGATION_OPTIONS} />
        <TextAreaField label="Notes" value={form.notes} onChange={update('notes')} rows={4} placeholder="Add a reminder or observation" />
      </form>
    </FieldDrawer>
  );
}

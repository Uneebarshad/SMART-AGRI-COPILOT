import {
  createFieldRequest,
  deleteFieldRequest,
  fetchField,
  fetchFields,
  updateFieldRequest,
} from './api';
import { MOCK_FIELDS } from '../data/fieldsMock';

const normalizeField = (field) => ({
  id: `field-${field.id}`,
  name: field.name,
  location: field.location ?? '',
  area: Number(field.area_ha),
  crop: field.crop,
  status: field.status ?? 'Recently Planted',
  growthStage: field.growth_stage ?? 'Seedling',
  plantingDate: field.sowing_date ?? '',
  harvestDate: field.harvest_date ?? '',
  irrigationMethod: field.irrigation_method ?? '',
  notes: field.notes ?? '',
  lastUpdated: field.updated_at ?? field.created_at,
  soil: {
    ph: field.soil?.ph ?? 'Not measured',
    moisture: field.soil?.moisture ?? 'Not measured',
    organicMatter: field.soil?.organicMatter ?? 'Not measured',
  },
});

const toBackendId = (id) => {
  const match = /^field-(\d+)$/.exec(String(id));
  return match ? match[1] : id;
};

const toPayload = (input) => ({
  name: input.name.trim(),
  location: input.location.trim(),
  area_ha: Number(input.area),
  crop: input.crop,
  sowing_date: input.plantingDate || null,
  harvest_date: input.harvestDate || null,
  irrigation_method: input.irrigationMethod || '',
  notes: input.notes?.trim() || '',
});

/** Field service — uses the real FastAPI + PostgreSQL backend. */
const USE_FIXTURE = false;

export function getFields() {
  if (USE_FIXTURE) {
    return Promise.resolve(MOCK_FIELDS);
  }
  return fetchFields().then((fields) => fields.map(normalizeField));
}

export function getField(id) {
  return fetchField(toBackendId(id)).then(normalizeField);
}

export function createField(input) {
  return createFieldRequest(toPayload(input)).then(normalizeField);
}

export function updateField(id, input) {
  return updateFieldRequest(toBackendId(id), toPayload(input)).then(normalizeField);
}

export function deleteField(id) {
  return deleteFieldRequest(toBackendId(id)).then(() => true);
}

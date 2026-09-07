/**
 * Local-only history fixtures for the History screen.
 * This page intentionally does not read from the backend or a database.
 */
export const HISTORY_RECORDS = [
  {
    id: 'history-01',
    type: 'assistant',
    title: 'Asked about tomato leaf curling',
    description: 'Discussed likely causes and the first checks to make before treating the crop.',
    fullDescription:
      'You asked why the leaves on your tomato plants were curling. Agri Copilot suggested checking watering consistency, heat stress, and early pest activity before applying any treatment.',
    occurredAt: '2026-09-03T09:40:00',
    field: 'Main Field',
    crop: 'Tomato',
    status: 'Completed',
  },
  {
    id: 'history-02',
    type: 'weather',
    title: 'Rain expected tomorrow',
    description: 'A weather insight flagged likely rain and a good window to pause irrigation.',
    fullDescription:
      'The local forecast shows rain expected tomorrow afternoon. Hold off on planned irrigation and check drainage around the lower edge of Main Field after the rain passes.',
    occurredAt: '2026-09-02T16:15:00',
    field: 'Main Field',
    crop: 'Tomato',
    status: 'Reviewed',
  },
  {
    id: 'history-03',
    type: 'field',
    title: 'Updated Main Field information',
    description: 'Field details were updated with the current tomato crop and planting notes.',
    fullDescription:
      'Main Field was updated to reflect the current tomato crop. The field remains active, and the planting notes now include the latest row spacing and irrigation observations.',
    occurredAt: '2026-09-01T11:20:00',
    field: 'Main Field',
    crop: 'Tomato',
    status: 'Saved',
  },
  {
    id: 'history-04',
    type: 'diagnosis',
    title: 'Tomato leaf analysis',
    description: 'A leaf photo was reviewed for signs of disease and visible stress.',
    fullDescription:
      'The tomato leaf photo showed mild curling with no clear signs of a serious disease. Improve watering consistency, inspect the underside of leaves, and rescan if spots or yellowing appear.',
    occurredAt: '2026-08-31T08:55:00',
    field: 'Main Field',
    crop: 'Tomato',
    status: 'Reviewed',
  },
  {
    id: 'history-05',
    type: 'recommendation',
    title: 'Irrigation recommendation',
    description: 'Suggested an early-morning watering cycle based on crop stage and weather.',
    fullDescription:
      'For the tomato crop, water deeply in the early morning and avoid wetting the leaves. Recheck soil moisture before the next cycle, especially if the forecasted rain arrives.',
    occurredAt: '2026-08-29T07:30:00',
    field: 'Main Field',
    crop: 'Tomato',
    status: 'Action needed',
  },
  {
    id: 'history-06',
    type: 'assistant',
    title: 'Asked when to fertilize wheat',
    description: 'Discussed timing a nitrogen application around the wheat growth stage.',
    fullDescription:
      'You asked when to apply the next wheat fertilizer. The guidance was to check the crop growth stage and soil moisture first, then apply nitrogen before a light rain or irrigation where possible.',
    occurredAt: '2026-08-27T14:05:00',
    field: 'East Plot',
    crop: 'Wheat',
    status: 'Completed',
  },
  {
    id: 'history-07',
    type: 'weather',
    title: 'Heat risk for cotton',
    description: 'A warm spell was noted with a reminder to watch for moisture stress.',
    fullDescription:
      'Temperatures are expected to stay high through the weekend. Check cotton leaves during the afternoon, keep the field free of competing weeds, and use the next cool morning for any planned field work.',
    occurredAt: '2026-08-25T12:45:00',
    field: 'East Plot',
    crop: 'Cotton',
    status: 'Reviewed',
  },
  {
    id: 'history-08',
    type: 'diagnosis',
    title: 'Wheat leaf analysis',
    description: 'A wheat leaf scan was saved with a note to monitor small pale spots.',
    fullDescription:
      'The wheat leaf scan found small pale spots that should be monitored. Compare new growth over the next few days and seek local advice if the spots spread across the field.',
    occurredAt: '2026-08-21T10:10:00',
    field: 'East Plot',
    crop: 'Wheat',
    status: 'Saved',
  },
  {
    id: 'history-09',
    type: 'field',
    title: 'Added Riverside Field',
    description: 'A new maize field was added to keep its crop notes in one place.',
    fullDescription:
      'Riverside Field was added with maize as its current crop. Use this field record to keep planting dates, irrigation notes, and future recommendations together.',
    occurredAt: '2026-08-14T15:35:00',
    field: 'Riverside Field',
    crop: 'Maize',
    status: 'Saved',
  },
  {
    id: 'history-10',
    type: 'recommendation',
    title: 'Pest scouting plan',
    description: 'Recommended a twice-weekly check of maize leaves and plant stems.',
    fullDescription:
      'Walk the maize rows twice each week and inspect the newest leaves and lower stems. Record any holes, curled leaves, or visible insects so the next decision is based on what is actually present.',
    occurredAt: '2026-08-05T09:05:00',
    field: 'Riverside Field',
    crop: 'Maize',
    status: 'Action needed',
  },
];

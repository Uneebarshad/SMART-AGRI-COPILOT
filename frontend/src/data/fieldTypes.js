/** @typedef {'Healthy'|'Needs Attention'|'Recently Planted'|'Ready for Harvest'} FieldStatus */
/** @typedef {'Seedling'|'Vegetative'|'Flowering'|'Maturing'|'Harvesting'} GrowthStage */
/** @typedef {'Wheat'|'Cotton'|'Tomato'|'Maize'|'Rice'} Crop */

export const FIELD_STATUSES = ['Healthy', 'Needs Attention', 'Recently Planted', 'Ready for Harvest'];
export const GROWTH_STAGES = ['Seedling', 'Vegetative', 'Flowering', 'Maturing', 'Harvesting'];
export const CROP_OPTIONS = ['Wheat', 'Cotton', 'Tomato', 'Maize', 'Rice'];
export const IRRIGATION_OPTIONS = ['Drip irrigation', 'Sprinkler', 'Flood irrigation', 'Rain-fed'];

/** @typedef {Object} Field
 * @property {string} id
 * @property {string} name
 * @property {string} location
 * @property {number} area
 * @property {Crop|string} crop
 * @property {FieldStatus} status
 * @property {GrowthStage} growthStage
 * @property {string} plantingDate
 * @property {string} harvestDate
 * @property {string} irrigationMethod
 * @property {string} notes
 * @property {string} lastUpdated
 * @property {{ph: string, moisture: string, organicMatter: string}} soil
 */

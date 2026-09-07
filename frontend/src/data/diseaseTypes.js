/**
 * @typedef {'Tomato'|'Potato'|'Wheat'|'Rice'|'Cotton'|'Maize'} Crop
 * @typedef {'Fungal'|'Bacterial'|'Viral'|'Pest-related'} DiseaseType
 * @typedef {'Low'|'Medium'|'High'} DiseaseSeverity
 *
 * @typedef {Object} Disease
 * @property {string} id
 * @property {string} name
 * @property {Crop} crop
 * @property {DiseaseType} type
 * @property {DiseaseSeverity} severity
 * @property {string} description
 * @property {string[]} symptoms
 * @property {string[]} causes
 * @property {string[]} prevention
 * @property {string[]} recommendedActions
 * @property {number} commonness
 */

export {};

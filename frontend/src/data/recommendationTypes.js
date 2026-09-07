/** @typedef {'irrigation'|'crop-care'|'weather'|'pest-disease'|'fertilization'|'harvest'|'general'} RecommendationCategory */
/** @typedef {'high'|'medium'|'low'} RecommendationPriority */
/** @typedef {'active'|'completed'} RecommendationStatus */

/**
 * @typedef {Object} Recommendation
 * @property {string} id
 * @property {string} title
 * @property {RecommendationCategory} category
 * @property {RecommendationPriority} priority
 * @property {string} description
 * @property {string} action
 * @property {string} crop
 * @property {string} field
 * @property {string} date
 * @property {RecommendationStatus} status
 * @property {string} why
 * @property {string} timing
 * @property {string} notes
 */

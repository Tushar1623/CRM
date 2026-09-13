const Activity = require('../models/Activity');

/**
 * Logs an activity into the MongoDB activities collection.
 * 
 * @param {Object} params
 * @param {string|mongoose.Types.ObjectId} [params.lead_id]
 * @param {string|mongoose.Types.ObjectId} [params.customer_id]
 * @param {string|mongoose.Types.ObjectId} [params.user_id]
 * @param {string} params.activity_type
 * @param {string} [params.title]
 * @param {string} params.description
 * @param {Object} [params.metadata]
 * @returns {Promise<Activity>}
 */
async function logActivity({
  lead_id = null,
  customer_id = null,
  user_id = null,
  activity_type,
  title = '',
  description,
  metadata = {}
}) {
  try {
    const activity = new Activity({
      lead_id,
      customer_id,
      user_id,
      activity_type,
      title: title || activity_type.replace(/_/g, ' ').toUpperCase(),
      description,
      metadata
    });
    return await activity.save();
  } catch (error) {
    console.error('Failed to log activity to database:', error.message);
    return null;
  }
}

module.exports = { logActivity };

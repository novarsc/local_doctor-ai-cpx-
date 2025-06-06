/**
 * @file case.service.js
 * @description Business logic for handling scenarios (cases).
 */

const { Scenario, UserPracticeHistory } = require('../models');
const { Op } = require('sequelize');

/**
 * Lists all scenarios with filtering, sorting, and pagination.
 * @param {object} queryParams - The query parameters from the request.
 * @param {string} userId - The ID of the currently logged-in user.
 * @returns {Promise<object>} An object containing the list of scenarios and pagination info.
 */
const listScenarios = async (queryParams, userId) => {
  const { page = 1, limit = 10, keyword, primaryCategory, secondaryCategory, isLearned, sortBy = 'createdAt_desc' } = queryParams;
  
  const offset = (page - 1) * limit;
  
  let where = {};
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${keyword}%` } },
      { shortDescription: { [Op.iLike]: `%${keyword}%` } },
      { primaryCategory: { [Op.iLike]: `%${keyword}%` } },
      { secondaryCategory: { [Op.iLike]: `%${keyword}%` } },
    ];
  }
  if (primaryCategory) {
    where.primaryCategory = primaryCategory;
  }
  if (secondaryCategory) {
    where.secondaryCategory = secondaryCategory;
  }
  
  // TODO: Implement 'isLearned' filter logic by checking UserPracticeHistory
  // This requires a more complex query (e.g., subquery or join with aggregation)
  // to check if a user has a completed history for a scenario.
  
  const [sortField, sortOrder] = sortBy.split('_');
  const order = [[sortField, sortOrder.toUpperCase()]];

  const { count, rows } = await Scenario.findAndCountAll({
    where,
    limit,
    offset,
    order,
    // Note: To add user-specific data like 'isLearned' and 'highestScore',
    // you would typically use a more advanced query with includes and attributes.
    // This is a simplified version for now.
  });

  // TODO: Map over 'rows' to add user-specific data ('isLearned', 'highestScore', etc.)
  // for the given userId by querying the UserPracticeHistory table.
  const scenariosWithUserData = rows.map(scenario => ({
    ...scenario.toJSON(),
    isLearned: false, // Placeholder
    highestScore: null, // Placeholder
    lastPlayedAt: null, // Placeholder
  }));
  
  const totalPages = Math.ceil(count / limit);

  return {
    data: scenariosWithUserData,
    pagination: {
      totalItems: count,
      totalPages,
      currentPage: parseInt(page, 10),
      pageSize: parseInt(limit, 10),
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }
  };
};

module.exports = {
  listScenarios,
};

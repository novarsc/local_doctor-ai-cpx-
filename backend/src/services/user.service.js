/**
 * @file user.service.js
 * @description Business logic for user-related operations.
 */

// User와 관련된 모든 모델 및 트랜잭션을 위한 sequelize를 불러옵니다.
// 최종적으로 발견된 EvaluationResult 모델을 포함합니다.
const {
  User,
  UserPracticeHistory,
  IncorrectAnswerNote,
  UserBookmarkedScenario,
  PracticeSession,
  EvaluationResult, // 마지막으로 발견된 모델
  Scenario,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

/**
 * Fetches a user's profile by their ID.
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<object>} The user object without the password.
 */
const getUserProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw new ApiError(404, 'U004_USER_NOT_FOUND', 'User not found.');
  }
  return user.toJSON();
};

/**
 * Updates a user's profile information.
 * @param {string} userId - The ID of the user to update.
 * @param {object} profileData - The profile data to update.
 * @returns {Promise<object>} The updated user object.
 */
const updateUserProfile = async (userId, profileData) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new ApiError(404, 'U004_USER_NOT_FOUND', 'User not found.');
  }

  const allowedFields = ['nickname'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (profileData[field] !== undefined) {
      updateData[field] = profileData[field];
    }
  });

  await user.update(updateData);
  
  const { password, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
};

/**
 * Updates a user's password.
 * @param {string} userId - The ID of the user to update.
 * @param {string} currentPassword - The current password.
 * @param {string} newPassword - The new password.
 * @returns {Promise<void>}
 */
const updateUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new ApiError(404, 'U004_USER_NOT_FOUND', 'User not found.');
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'U005_INVALID_PASSWORD', 'Current password is incorrect.');
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashedNewPassword });
};

/**
 * Uploads a profile image for a user.
 * @param {string} userId - The ID of the user.
 * @param {object} file - The uploaded file object.
 * @returns {Promise<object>} The updated user object.
 */
const uploadProfileImage = async (userId, file) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new ApiError(404, 'U004_USER_NOT_FOUND', 'User not found.');
  }

  if (user.profileImageUrl) {
    await deleteProfileImageFile(user.profileImageUrl);
  }

  const imageUrl = `/uploads/profile-images/${file.filename}`;
  
  await user.update({ profileImageUrl: imageUrl });
  
  const { password, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
};

/**
 * Deletes a user's profile image.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} The updated user object.
 */
const deleteProfileImage = async (userId) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new ApiError(404, 'U004_USER_NOT_FOUND', 'User not found.');
  }

  if (user.profileImageUrl) {
    await deleteProfileImageFile(user.profileImageUrl);
    await user.update({ profileImageUrl: null });
  }
  
  const { password, ...userWithoutPassword } = user.toJSON();
  return userWithoutPassword;
};

/**
 * Deletes a profile image file from the filesystem.
 * @param {string} imageUrl - The URL of the image to delete.
 * @returns {Promise<void>}
 */
const deleteProfileImageFile = async (imageUrl) => {
  try {
    const filePath = path.join(__dirname, '../../public', imageUrl);
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error deleting profile image file:', error);
    }
  }
};

/**
 * Deletes a user's account and all related data within a transaction.
 * @param {string} userId - The ID of the user to delete.
 * @param {string} password - The user's password for confirmation.
 * @returns {Promise<void>}
 */
const deleteUserAccount = async (userId, password) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new ApiError(404, 'U004_USER_NOT_FOUND', 'User not found.');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {    
    throw new ApiError(400, 'U005_INVALID_PASSWORD', 'Password is incorrect.');
  }

  const transaction = await sequelize.transaction();

  try {
    if (user.profileImageUrl) {
      await deleteProfileImageFile(user.profileImageUrl);
    }

    // 1. 삭제할 사용자의 모든 PracticeSession ID를 가져옵니다.
    const practiceSessions = await PracticeSession.findAll({
      where: { userId },
      attributes: ['practiceSessionId'],
      transaction
    });
    const practiceSessionIds = practiceSessions.map(session => session.practiceSessionId);

    // 2. PracticeSession에 종속된 데이터들을 먼저 삭제합니다.
    if (practiceSessionIds.length > 0) {
      // EvaluationResult를 삭제합니다.
      await EvaluationResult.destroy({
        where: { practiceSessionId: practiceSessionIds },
        transaction
      });
    }
    
    // 3. 이제 PracticeSession을 삭제할 수 있습니다. (PracticeNote는 자동으로 삭제됨)
    await PracticeSession.destroy({ where: { userId }, transaction });

    // 4. User와 직접 연결된 나머지 데이터들을 삭제합니다.
    await UserPracticeHistory.destroy({ where: { userId }, transaction });
    await IncorrectAnswerNote.destroy({ where: { userId }, transaction });
    await UserBookmarkedScenario.destroy({ where: { userId }, transaction });

    // 5. 마지막으로 사용자 계정을 삭제합니다.
    await user.destroy({ transaction });

    // 6. 모든 작업이 성공하면 트랜잭션을 최종 확정합니다.
    await transaction.commit();

  } catch (error) {
    // 7. 하나라도 오류가 발생하면 모든 변경사항을 되돌립니다.
    await transaction.rollback();
    
    console.error('Failed to delete user account:', error);
    throw new ApiError(500, 'U006_DELETION_FAILED', 'Failed to delete user account due to an internal error.');
  }
};

/**
 * 사용자의 학습 통계를 계산하여 반환합니다.
 * @param {string} userId - 통계를 계산할 사용자의 ID
 * @returns {Promise<object>}
 */
const calculateUserStats = async (userId) => {
  // 1. 총 학습 시간 계산 (분 단위)
  const practiceHistories = await UserPracticeHistory.findAll({
    where: { userId, endTime: { [Op.ne]: null } },
    attributes: ['startTime', 'endTime'],
  });

  const totalStudyMilliseconds = practiceHistories.reduce((total, history) => {
    if (history.endTime && history.startTime) {
      return total + (new Date(history.endTime) - new Date(history.startTime));
    }
    return total;
  }, 0);
  const totalStudyMinutes = Math.round(totalStudyMilliseconds / (1000 * 60));

  // 2. 완료 증례 수 계산
  const [completedCasesCount, totalCasesCount] = await Promise.all([
    UserPracticeHistory.count({
      where: { userId },
      distinct: true,
      col: 'scenarioId',
    }),
    Scenario.count(),
  ]);
  
  // 3. 전체 평균 점수 계산
  const avgScoreResult = await UserPracticeHistory.findOne({
    where: { userId, score: { [Op.ne]: null } },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('score')), 'averageScore'],
    ],
    raw: true,
  });
  const overallAverageScore = avgScoreResult.averageScore
    ? Math.round(avgScoreResult.averageScore)
    : 0;

  // 4. 분류별 성취도 계산 (개선된 버전)
  const allCategories = await Scenario.findAll({
    attributes: [
      [sequelize.fn('DISTINCT', sequelize.col('primaryCategory')), 'category']
    ],
    where: {
      primaryCategory: {
        [Op.ne]: null
      }
    },
    raw: true
  });

  // 각 분류별로 완료된 증례 수와 평균 점수를 계산합니다
  const performanceByCategory = await Promise.all(
    allCategories.map(async ({ category }) => {
      try {
        const totalInCategory = await Scenario.count({
          where: { primaryCategory: category }
        });

        const completedInCategory = await sequelize.query(`
          SELECT 
            COUNT(up.scenario_id) as "completedCount",
            AVG(up.score) as "averageScore"
          FROM user_practice_histories up
          INNER JOIN "Scenarios" s ON up.scenario_id = s."scenarioId"
          WHERE up.user_id = :userId 
            AND up.score IS NOT NULL 
            AND s."primaryCategory" = :category
        `, {
          replacements: { userId, category },
          type: sequelize.QueryTypes.SELECT
        });

        const result = completedInCategory[0];
        const completedCount = parseInt(result?.completedCount || 0);
        const averageScore = result?.averageScore ? Math.round(result.averageScore) : 0;

        return {
          category,
          completedCount,
          totalCount: totalInCategory,
          averageScore,
          completionRate: totalInCategory > 0 ? Math.round((completedCount / totalInCategory) * 100) : 0
        };
      } catch (error) {
        console.error(`Error processing category "${category}":`, error);
        return {
          category,
          completedCount: 0,
          totalCount: 0,
          averageScore: 0,
          completionRate: 0
        };
      }
    })
  );

  return {
    totalStudyMinutes,
    completedCases: {
      count: completedCasesCount,
      total: totalCasesCount,
    },
    overallAverageScore,
    performanceByCategory,
  };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  uploadProfileImage,
  deleteProfileImage,
  deleteUserAccount,
  calculateUserStats,
};
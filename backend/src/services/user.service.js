/**
 * @file user.service.js
 * @description Business logic for user-related operations.
 */

const { User, UserPracticeHistory, Scenario, sequelize } = require('../models');
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
    // 보안을 위해 password 필드는 제외하고 조회합니다.
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

  // 업데이트 가능한 필드들만 허용
  const allowedFields = ['nickname'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (profileData[field] !== undefined) {
      updateData[field] = profileData[field];
    }
  });

  await user.update(updateData);
  
  // 비밀번호를 제외한 사용자 정보 반환
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

  // 현재 비밀번호 확인
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    throw new ApiError(400, 'U005_INVALID_PASSWORD', 'Current password is incorrect.');
  }

  // 새 비밀번호 해시화
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

  // 기존 프로필 이미지가 있다면 삭제
  if (user.profileImageUrl) {
    await deleteProfileImageFile(user.profileImageUrl);
  }

  // 새 이미지 URL 생성 (실제 구현에서는 클라우드 스토리지 사용 권장)
  const imageUrl = `/uploads/profile-images/${file.filename}`;
  
  await user.update({ profileImageUrl: imageUrl });
  
  // 비밀번호를 제외한 사용자 정보 반환
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
  
  // 비밀번호를 제외한 사용자 정보 반환
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
    // 파일이 존재하지 않는 경우는 무시
    if (error.code !== 'ENOENT') {
      console.error('Error deleting profile image file:', error);
    }
  }
};

/**
 * Deletes a user's account.
 * @param {string} userId - The ID of the user to delete.
 * @param {string} password - The user's password for confirmation.
 * @returns {Promise<void>}
 */
const deleteUserAccount = async (userId, password) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new ApiError(404, 'U004_USER_NOT_FOUND', 'User not found.');
  }

  // 비밀번호 확인
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(400, 'U005_INVALID_PASSWORD', 'Password is incorrect.');
  }

  // 프로필 이미지가 있다면 삭제
  if (user.profileImageUrl) {
    await deleteProfileImageFile(user.profileImageUrl);
  }

  // 사용자 계정 삭제
  await user.destroy();
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
    // endTime과 startTime이 유효한 Date 객체인지 확인
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
  // 먼저 모든 분류 카테고리를 가져옵니다
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
        // 해당 분류의 전체 증례 수
        const totalInCategory = await Scenario.count({
          where: { primaryCategory: category }
        });

        // 해당 분류에서 완료된 증례 수와 평균 점수
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
        // 오류가 발생한 카테고리의 경우 기본값 반환
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
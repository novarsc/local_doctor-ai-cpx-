/**
 * @file UserRole.enum.js
 * @description Defines user roles and their corresponding enum array for validation.
 */

const USER_ROLE = {
    USER: 'USER',
    ADMIN: 'ADMIN',
  };
  
  // USER_ROLE 객체의 값들로 배열을 생성합니다. (e.g., ['USER', 'ADMIN'])
  const USER_ROLE_ENUM = Object.values(USER_ROLE);
  
  module.exports = {
    USER_ROLE,
    USER_ROLE_ENUM,
  };
  
/**
 * @file passwordHasher.js
 * @description bcryptjs를 사용한 비밀번호 암호화 및 비교 유틸리티
 */

const bcrypt = require('bcryptjs');

/**
 * 비밀번호를 해싱(암호화)합니다.
 * @param {string} password - 평문 비밀번호
 * @returns {Promise<string>} 해싱된 비밀번호
 */
const hashPassword = async (password) => {
  // 보안을 위해 10~12 사이의 saltRounds를 사용하는 것이 일반적입니다.
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

/**
 * 평문 비밀번호와 해싱된 비밀번호를 비교합니다.
 * @param {string} password - 사용자가 입력한 평문 비밀번호
 * @param {string} hashedPassword - 데이터베이스에 저장된 해싱된 비밀번호
 * @returns {Promise<boolean>} 비밀번호 일치 여부
 */
const comparePasswords = async (password, hashedPassword) => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};

module.exports = {
  hashPassword,
  comparePasswords,
};
// .env 파일의 환경 변수를 로드합니다.
require('dotenv').config();

/**
 * Google Gemini API 연결을 위한 설정 파일입니다.
 * API 키와 같은 민감한 정보는 .env 파일에 보관하고,
 * 여기서는 환경 변수를 통해 참조합니다.
 */
module.exports = {
  // Gemini API 키. .env 파일의 GEMINI_API_KEY 변수에서 값을 가져옵니다.
  apiKey: process.env.GEMINI_API_KEY,

  // 사용할 Gemini 모델 이름
  // 제공된 Python 코드의 'gemini-2.5-flash-preview-04-17' 모델을 사용합니다.
  model: 'gemini-2.5-flash-preview-0514', // 최신 flash 모델로 업데이트

  // API 요청 시 타임아웃 설정 (밀리초 단위, 예: 30초)
  // 긴 응답을 기다려야 하는 경우 이 값을 늘릴 수 있습니다.
  timeout: 30000,
};

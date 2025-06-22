const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 검사할 폴더 경로
const casesDir = path.join(__dirname, 'data', 'cases');
// 긴 텍스트가 주로 사용되는 필드 목록
const keysToCheck = [
  'chief_complaint_verbatim',
  'course',
  'examinee_instructions',
  'standardized_patient_questions',
  'specific_remarks'
];

console.log('--- YAML 파일 검사를 시작합니다 ---');

try {
  const yamlFiles = fs.readdirSync(casesDir)
                      .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));

  let potentialIssues = 0;

  for (const file of yamlFiles) {
    const filePath = path.join(casesDir, file);
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const data = yaml.load(fileContents);

      // history 객체가 있는지 확인
      if (data.history) {
        for (const key of keysToCheck) {
          // data.history 또는 data 루트 레벨에 키가 있는지 확인
          const value = data.history[key] || data[key];
          
          // 값이 긴 문자열인데, 여러 줄로 나뉘어 있지 않은 경우(잠재적 오류)
          if (typeof value === 'string' && value.length > 80 && !value.includes('\n')) {
            console.log(`[수정 필요] 파일: ${file}, 필드: ${key} (긴 텍스트)`);
            potentialIssues++;
          }
        }
      }

    } catch (e) {
      // 이미 문법 오류가 있는 파일
      console.error(`[문법 오류!] 파일: ${file} -> ${e.reason}`);
      potentialIssues++;
    }
  }

  console.log(`\n--- 검사 완료 ---`);
  if (potentialIssues === 0) {
    console.log('✅ 모든 파일이 양호합니다!');
  } else {
    console.log(`총 ${potentialIssues}개의 파일에서 수정이 필요하거나 오류가 있습니다.`);
  }

} catch (error) {
  console.error('data/cases 폴더를 읽는 중 오류가 발생했습니다:', error);
}
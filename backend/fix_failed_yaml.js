const fs = require('fs');
const path = require('path');

// 실패한 파일 목록 (경로는 backend/data/cases/ 기준)
const failedFiles = [
  'anxiety_19.yaml',
  'anxiety_22.yaml',
  'bruising_easily_01.yaml',
  'bruising_easily_02.yaml',
  'bruising_easily_03.yaml',
  'bruising_easily_04.yaml',
  'bruising_easily_05.yaml',
  'bruising_easily_06.yaml',
  'bruising_easily_07.yaml',
  'bruising_easily_08.yaml',
  'bruising_easily_09.yaml',
  'bruising_easily_10.yaml',
  'bruising_easily_11.yaml',
  'bruising_easily_12.yaml',
  'bruising_easily_13.yaml',
  'bruising_easily_14.yaml',
  'bruising_easily_15.yaml',
  'bruising_easily_16.yaml',
  'developmental_delay_04.yaml',
  'developmental_delay_06.yaml',
  'developmental_delay_07.yaml',
  'developmental_delay_09.yaml',
  'developmental_delay_12.yaml',
  'developmental_delay_14.yaml',
  'dyskinesia_08.yaml',
  'dyskinesia_16.yaml',
  'jaundice_06.yaml',
  'oliguria_12.yaml',
  'syncope_05.yaml',
];

const CASES_DIR = path.join(__dirname, 'data', 'cases');

// 나이 문자열을 숫자로 변환하는 함수
function convertAgeToNumber(ageStr) {
  if (!ageStr || typeof ageStr !== 'string') return ageStr;
  
  // "생후 4개월" -> 4
  const monthMatch = ageStr.match(/생후\s*(\d+)개월/);
  if (monthMatch) {
    return parseInt(monthMatch[1]);
  }
  
  // "18개월" -> 18
  const monthOnlyMatch = ageStr.match(/(\d+)개월/);
  if (monthOnlyMatch) {
    return parseInt(monthOnlyMatch[1]);
  }
  
  // "20개월" -> 20
  const ageMatch = ageStr.match(/(\d+)/);
  if (ageMatch) {
    return parseInt(ageMatch[1]);
  }
  
  return ageStr;
}

// YAML 라인들을 수정하는 함수
function fixYamlLines(lines) {
  const sectionKeys = ['palpation', 'inspection', 'auscultation', 'percussion'];
  let inSection = false;
  let sectionIndent = 0;
  let fixed = [];
  let otherKeyCount = 0; // 중복 키 방지용

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 나이 필드 수정 (developmental_delay 시리즈)
    if (line.includes('age:')) {
      const ageMatch = line.match(/^(\s*age:\s*)(.+)$/);
      if (ageMatch) {
        const indent = ageMatch[1];
        const ageValue = ageMatch[2].trim();
        const convertedAge = convertAgeToNumber(ageValue);
        fixed.push(indent + convertedAge);
        continue;
      }
    }
    
    // 중복 other 키 제거 (oliguria_12.yaml)
    if (line.includes('other:') && otherKeyCount > 0) {
      otherKeyCount++;
      if (otherKeyCount > 1) {
        continue; // 두 번째 other 키는 건너뛰기
      }
    }
    
    // section 시작
    const sectionMatch = line.match(/^(\s*)(palpation|inspection|auscultation|percussion):\s*$/);
    if (sectionMatch) {
      inSection = true;
      sectionIndent = sectionMatch[1].length;
      otherKeyCount = 0; // 섹션 시작시 카운터 리셋
      fixed.push(line);
      continue;
    }
    
    // section 내부 key 없이 값만 있는 라인
    if (inSection) {
      const indentMatch = line.match(/^(\s*)([^:]+)$/);
      const colonMatch = line.match(/^(\s*)([^:]+):/);
      const currIndent = line.match(/^(\s*)/)[1].length;
      
      if (currIndent > sectionIndent) {
        if (indentMatch && !colonMatch) {
          // key 없이 값만 있는 경우 -> other key로 변환 (리스트 형태 제거)
          const value = indentMatch[2].trim();
          // 리스트 형태 제거하고 단순 문자열로 변환
          const cleanValue = value.replace(/^-\s*"/, '').replace(/"$/, '');
          fixed.push(' '.repeat(currIndent) + 'other: "' + cleanValue.replace(/"/g, '\\"') + '"');
          otherKeyCount++;
          continue;
        }
      } else {
        // section 종료
        inSection = false;
      }
    }
    
    // heent 섹션의 복합 문장 수정 (dyskinesia 시리즈)
    if (line.includes('sclera:') && line.includes('.') && line.includes('혀를')) {
      const scleraMatch = line.match(/^(\s*sclera:\s*)"([^"]+)"\.\s*(.+)$/);
      if (scleraMatch) {
        const indent = scleraMatch[1].replace('sclera:', '').replace(/\s*$/, '');
        const scleraValue = scleraMatch[2];
        const additionalInfo = scleraMatch[3];
        fixed.push(indent + 'sclera: "' + scleraValue + '"');
        fixed.push(indent + 'additional_notes: "' + additionalInfo.replace(/"/g, '\\"') + '"');
        continue;
      }
    }
    
    // family_history 중복 제거 (syncope_05.yaml)
    if (line.includes('family_history:') && i > 0) {
      const prevLine = lines[i-1];
      if (prevLine.includes('family_history:')) {
        continue; // 중복된 family_history 라인 건너뛰기
      }
    }
    
    fixed.push(line);
  }
  
  // 추가 후처리: other 필드에서 리스트 형태 완전 제거 및 value 정제
  const finalFixed = [];
  for (const line of fixed) {
    if (line.trim().startsWith('other:')) {
      // other: ... 라인에서 value가 -로 시작하면 모두 정제
      const match = line.match(/^(\s*other:\s*)(["']?-\s*)(.*?)["']?$/);
      if (match) {
        const indent = match[1];
        let value = match[3].trim();
        // value 양쪽에 남은 따옴표 제거
        value = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
        finalFixed.push(indent + '"' + value.replace(/"/g, '\\"') + '"');
        continue;
      }
    }
    finalFixed.push(line);
  }
  
  return finalFixed;
}

function backupAndFixFile(filePath) {
  const absPath = path.join(CASES_DIR, filePath);
  if (!fs.existsSync(absPath)) {
    console.warn('파일 없음:', absPath);
    return;
  }
  const original = fs.readFileSync(absPath, 'utf8');
  const lines = original.split(/\r?\n/);
  const fixedLines = fixYamlLines(lines);
  // 백업
  fs.writeFileSync(absPath + '.bak', original, 'utf8');
  // 덮어쓰기
  fs.writeFileSync(absPath, fixedLines.join('\n'), 'utf8');
  console.log('수정 완료:', filePath);
}

// 모든 실패 파일에 대해 수정 적용
for (const file of failedFiles) {
  backupAndFixFile(file);
}

// 추가: 남은 3개 파일의 특수 오류 패치
function fixSpecialCases(filename, lines) {
  // dyskinesia_08.yaml, dyskinesia_16.yaml: value 여러 줄 → 한 줄로 합치고 쌍따옴표로 감싸기
  if (filename === 'dyskinesia_08.yaml' || filename === 'dyskinesia_16.yaml') {
    let result = [];
    let buffer = null;
    let key = null;
    let indent = '';
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      // key: "value ..." 형태가 아니고, key: "value로 시작하면 버퍼링
      let match = line.match(/^(\s*)([a-zA-Z0-9_]+):\s*"([^"]*)$/);
      if (match) {
        indent = match[1];
        key = match[2];
        buffer = match[3];
        continue;
      }
      // value가 끝나는 쌍따옴표가 없는 줄이면 버퍼에 추가
      if (buffer !== null) {
        // value가 끝나는 줄인지 확인
        if (line.trim().endsWith('"')) {
          buffer += ' ' + line.trim().slice(0, -1);
          // 한 줄로 합쳐서 쌍따옴표로 감싸기
          result.push(`${indent}${key}: "${buffer.replace(/"/g, '\\"')}"`);
          buffer = null;
          key = null;
          indent = '';
        } else {
          buffer += ' ' + line.trim();
        }
        continue;
      }
      // 이미 한 줄로 되어 있지만 쌍따옴표가 없는 경우
      let match2 = line.match(/^(\s*)([a-zA-Z0-9_]+):\s*([^"].*)$/);
      if (match2 && match2[3].length > 0) {
        indent = match2[1];
        key = match2[2];
        let value = match2[3].trim();
        // value에 콜론(:)이나 마침표(.)가 포함되어 있으면 쌍따옴표로 감싸기
        if (value.includes(':') || value.includes('.') || value.includes('(') || value.includes(')')) {
          result.push(`${indent}${key}: "${value.replace(/"/g, '\\"')}"`);
          continue;
        }
      }
      result.push(line);
    }
    return result;
  }
  // oliguria_12.yaml: duplicated mapping key(other)
  if (filename === 'oliguria_12.yaml') {
    let otherCount = 0;
    return lines.map(line => {
      if (line.trim().startsWith('other:')) {
        otherCount++;
        if (otherCount > 1) {
          // 두 번째부터는 other2, other3 ...
          return line.replace('other:', `other${otherCount}:`);
        }
      }
      return line;
    });
  }
  return lines;
}

// 파일별로 특수 오류 패치 적용
failedFiles.forEach(file => {
  const filePath = path.join(CASES_DIR, file);
  const original = fs.readFileSync(filePath, 'utf8');
  const lines = original.split(/\r?\n/);
  let fixed = fixYamlLines(lines);
  fixed = fixSpecialCases(file, fixed);
  fs.writeFileSync(filePath, fixed.join('\n'), 'utf8');
  console.log(`수정 완료: ${file}`);
});

console.log('\n모든 파일 자동 수정 완료! 이제 seed.js로 재시딩하세요.'); 
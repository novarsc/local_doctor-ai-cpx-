/**
 * @file seed.js
 * @description Initializes the database with baseline data by dynamically reading and preprocessing YAML files.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Scenario, AIPatientPersonality, sequelize } = require('./src/models');
const { v4: uuidv4 } = require('uuid');

/**
 * Pre-processes YAML content to fix common string formatting issues before parsing.
 * @param {string} content - The raw YAML string content.
 * @returns {string} The processed YAML string.
 */
function preprocessYamlContent(content) {
  // Problems often occur in these keys with long, single-line strings.
  const keysToFix = [
    'chief_complaint_verbatim',
    'course',
    'examinee_instructions',
    'standardized_patient_questions',
    'specific_remarks',
    'character_of_symptom'
  ];

  let processedContent = content;

  keysToFix.forEach(key => {
    // Example: "course: "long text...""
    const regex = new RegExp(`^(\\s*${key}:\\s*)(\\".*\\"|'.*')$`, 'm');
    processedContent = processedContent.replace(regex, (match, p1, p2) => {
      // Remove the outer quotes and replace with a literal block scalar
      const value = p2.substring(1, p2.length - 1);
      return `${p1}|\n${p1.replace(key, '  ')}${value}`;
    });
  });

  return processedContent;
}

/**
 * Extracts secondary category from title
 * @param {string} title - The case title
 * @returns {string} Secondary category
 */
function extractSecondaryCategory(title) {
  const match = title.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return match[1].split(',')[0].trim();
  }
  return '기타'; 
}

/**
 * Generates keywords from case data
 * @param {Object} caseData - The case data object
 * @param {string} secondaryCategory - Secondary category
 * @returns {Array} Array of keywords
 */
function generateKeywords(caseData, secondaryCategory) {
    const keywords = new Set();
    
    // Add title, chapter, and secondary category keywords
    [caseData.title, caseData.chapter, secondaryCategory].forEach(text => {
      if(typeof text === 'string') {
        text.split(/\s+|\(|\)|,/).forEach(word => {
            if (word && word.length > 1) keywords.add(word.trim());
        });
      }
    });
    
    // Add patient name if available
    if (caseData.patient_info && caseData.patient_info.name) {
        keywords.add(caseData.patient_info.name);
    }
    
    // Add presenting complaint keywords
    if (caseData.patient_info && caseData.patient_info.presenting_complaint) {
        caseData.patient_info.presenting_complaint.split(/\s+/).forEach(word => {
            if (word && word.length > 1) keywords.add(word.trim());
        });
    }
    
    return Array.from(keywords);
}

/**
 * Safely extracts nested object values
 * @param {Object} obj - The object to extract from
 * @param {string} path - The path to the value (e.g., 'patient_info.name')
 * @param {*} defaultValue - Default value if path doesn't exist
 * @returns {*} The value at the path or default value
 */
function safeGet(obj, path, defaultValue = null) {
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : defaultValue;
    }, obj);
}

/**
 * Converts Korean age expressions to numbers
 * @param {string|number} ageStr - Age string like "7세", "4개월", "생후 4개월"
 * @returns {number|null} Converted age number or null
 */
function convertAgeToNumber(ageStr) {
    if (!ageStr) return null;
    if (typeof ageStr === 'number') return ageStr;
    if (typeof ageStr !== 'string') return null;
    
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
    
    // "7세" -> 7 or any number extraction
    const ageMatch = ageStr.match(/(\d+)/);
    if (ageMatch) {
        return parseInt(ageMatch[1]);
    }
    
    return null;
}

/**
 * Finds the appropriate checklist file for a case file
 * @param {string} fileName - Name of the case file
 * @returns {string|null} Checklist file path or null if not found
 */
function getChecklistPath(fileName) {
    const baseFileName = path.basename(fileName, path.extname(fileName));
    
    // 넘버링 기반 매핑: 파일명 앞의 번호를 추출하여 매핑
    // 예: "01. 소화기_급성복통_급성 게실염.json" → "01"로 시작하는 체크리스트 찾기
    const numberMatch = baseFileName.match(/^(\d+)\./);
    if (numberMatch) {
        const number = numberMatch[1];
        const checklistsDir = path.join(__dirname, 'data', 'checklists');
        
        if (fs.existsSync(checklistsDir)) {
            const files = fs.readdirSync(checklistsDir);
            // 같은 번호로 시작하는 체크리스트 파일 찾기
            const matchingFile = files.find(file => 
                file.startsWith(`${number}.`) && 
                (file.endsWith('.yaml') || file.endsWith('.yml'))
            );
            
            if (matchingFile) {
                return `data/checklists/${matchingFile}`;
            }
        }
    }
    
    // 기존 YAML 파일용 매핑 로직 (하위 호환성)
    // 1. 정확한 매칭 체크리스트 찾기 (개별 체크리스트)
    let checklistFile = `${baseFileName}_checklist.yaml`;
    let checklistPath = path.join(__dirname, 'data', 'checklists', checklistFile);
    
    if (fs.existsSync(checklistPath)) {
        return `data/checklists/${checklistFile}`;
    }
    
    // 2. 패턴 매칭 체크리스트 찾기 (공통 체크리스트)
    // 파일명 끝의 숫자(_01, _02 등)를 제거하고 공통 체크리스트 찾기
    const patternName = baseFileName.replace(/_\d+$/, '');
    
    if (patternName !== baseFileName) { // 숫자가 제거된 경우만
        checklistFile = `${patternName}_checklist.yaml`;
        checklistPath = path.join(__dirname, 'data', 'checklists', checklistFile);
        
        if (fs.existsSync(checklistPath)) {
            return `data/checklists/${checklistFile}`;
        }
    }
    
    return null;
}

/**
 * Processes a single JSON case file
 * @param {string} filePath - Path to the JSON file
 * @param {string} fileName - Name of the file
 * @param {string} personalityId - AI personality ID
 * @returns {Promise<Object[]>} Array of created scenario data
 */
async function processJsonFile(filePath, fileName, personalityId) {
    try {
        const rawContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(rawContent);
        
        if (!jsonData || !jsonData.cases || !Array.isArray(jsonData.cases)) {
            throw new Error('JSON file must contain a "cases" array');
        }

        const results = [];
        
        for (const caseData of jsonData.cases) {
            try {
                // Extract category from filename (format: "01. 소화기_급성복통_급성 게실염.json")
                const fileNameWithoutExt = fileName.replace('.json', '');
                const parts = fileNameWithoutExt.split('_');
                
                                 let primaryCategory = '기타';
                 let secondaryCategory = '';
                 let caseName = fileName.replace('.json', '');
                 
                 if (parts.length >= 2) {
                     // First part contains number and primary category: "01. 소화기"
                     const firstPart = parts[0];
                     const categoryMatch = firstPart.match(/\d+\.\s*(.+)/);
                     if (categoryMatch) {
                         primaryCategory = categoryMatch[1].trim();
                     }
                     
                     // Second part is secondary category: "급성복통"
                     secondaryCategory = parts[1];
                     
                     // Third part and beyond form the case name
                     if (parts.length > 2) {
                         caseName = parts.slice(2).join(' ');
                     }
                 }
                
                // Generate keywords from case data
                const keywords = [];
                if (caseData.patientProfile?.name) keywords.push(caseData.patientProfile.name);
                if (caseData.chiefComplaint) keywords.push(...caseData.chiefComplaint.split(/\s+/));
                if (primaryCategory !== '기타') keywords.push(primaryCategory);
                if (secondaryCategory) keywords.push(secondaryCategory);
                
                                                                   // Find corresponding checklist file
                 const checklistFilePath = getChecklistPath(fileName);
                 
                 // Map JSON structure to database schema
                 const scenarioData = {
                     scenarioId: uuidv4(),
                     name: caseName || '제목 없음',
                     shortDescription: caseData.situation || '',
                     description: null,
                     primaryCategory: primaryCategory,
                     secondaryCategory: secondaryCategory,
                     age: convertAgeToNumber(caseData.patientProfile?.age) || null,
                     sex: caseData.patientProfile?.gender || null,
                     presentingComplaint: caseData.chiefComplaint || '',
                     bloodPressure: caseData.vitalSigns?.bloodPressure || null,
                     pulse: caseData.vitalSigns?.heartRate || null,
                     respiration: caseData.vitalSigns?.respiration || null,
                     temperature: caseData.vitalSigns?.temperature || null,
                     keywords: keywords.filter(k => k && k.trim().length > 0),
                     caseFilePath: `data/cases/${fileName}`,
                     checklistFilePath: checklistFilePath,
                     defaultAiPersonalityId: personalityId,
                 };

                const scenario = await Scenario.create(scenarioData);
                results.push({ success: true, scenario, title: scenarioData.name });
                
            } catch (error) {
                results.push({ 
                    success: false, 
                    error: error.message, 
                    fileName: fileName,
                    caseNumber: caseData.caseNumber 
                });
            }
        }
        
        return results;
        
    } catch (error) {
        return [{ 
            success: false, 
            error: error.message, 
            fileName: fileName 
        }];
    }
}

/**
 * Processes a single YAML case file
 * @param {string} filePath - Path to the YAML file
 * @param {string} fileName - Name of the file
 * @param {string} personalityId - AI personality ID
 * @returns {Promise<Object>} Created scenario data
 */
async function processCaseFile(filePath, fileName, personalityId) {
    try {
        const rawContent = fs.readFileSync(filePath, 'utf8');
        
        // Pre-process YAML content
        const processedContent = preprocessYamlContent(rawContent);
        
        const caseData = yaml.load(processedContent);
        
        if (!caseData) {
            throw new Error('YAML parsing resulted in null or undefined data');
        }

        const secondaryCategory = extractSecondaryCategory(caseData.title);
        const keywords = generateKeywords(caseData, secondaryCategory);
        
        // Check for checklist file (improved to support shared checklists)
        const checklistFilePath = getChecklistPath(fileName);
        
        // Safely extract values with fallbacks
        const scenarioData = {
            scenarioId: uuidv4(),
            name: caseData.title || '제목 없음',
            shortDescription: safeGet(caseData, 'examinee_instructions', ''),
            description: null,
            primaryCategory: caseData.chapter || '기타',
            secondaryCategory: secondaryCategory,
            age: safeGet(caseData, 'patient_info.age', null),
            sex: safeGet(caseData, 'patient_info.sex', null),
            presentingComplaint: safeGet(caseData, 'patient_info.presenting_complaint', ''),
            bloodPressure: safeGet(caseData, 'vital_signs.blood_pressure', null),
            pulse: safeGet(caseData, 'vital_signs.pulse', null),
            respiration: safeGet(caseData, 'vital_signs.respiration', null),
            temperature: safeGet(caseData, 'vital_signs.temperature', null),
            keywords: keywords,
            caseFilePath: `data/cases/${fileName}`,
            checklistFilePath: checklistFilePath,
            defaultAiPersonalityId: personalityId,
        };

        const scenario = await Scenario.create(scenarioData);
        return { success: true, scenario, title: caseData.title };
        
    } catch (error) {
        return { 
            success: false, 
            error: error.message, 
            fileName: fileName 
        };
    }
}

/**
 * Main seeding function
 */
async function seedDatabase() {
    console.log('🚀 데이터베이스 시딩을 시작합니다...');

    try {
        // Sync database (force: true will drop and recreate tables)
        await sequelize.sync({ force: true });
        console.log('✅ 데이터베이스 초기화 완료.');

        // Create AI Patient Personality
        const personality = await AIPatientPersonality.create({
            personalityId: uuidv4(),
            name: '협조적인 환자',
            description: '의사의 질문에 최대한 협조적으로 대답하는 환자입니다.',
            promptFilePath: 'data/personalities/cooperative_v1.yaml',
            isActive: true,
        });
        console.log(`✅ [${personality.name}] AI 환자 성격이 생성되었습니다.`);

        // Process case files
        const casesDir = path.join(__dirname, 'data', 'cases');
        
        if (!fs.existsSync(casesDir)) {
            throw new Error(`Cases directory not found: ${casesDir}`);
        }

        const caseFiles = fs.readdirSync(casesDir)
                            .filter(file => file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json'))
                            .sort(); // Sort for consistent ordering

        console.log(`\n📁 총 ${caseFiles.length}개의 증례 파일을 발견했습니다. 시딩을 시작합니다...\n`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process files sequentially to avoid overwhelming the database
        for (const file of caseFiles) {
            const caseFilePath = path.join(casesDir, file);
            const isJsonFile = file.endsWith('.json');
            
            if (isJsonFile) {
                // Process JSON file
                const results = await processJsonFile(caseFilePath, file, personality.personalityId);
                
                for (const result of results) {
                    if (result.success) {
                        console.log(`  ✅ [${result.title}] JSON 증례가 성공적으로 추가되었습니다.`);
                        successCount++;
                    } else {
                        console.error(`  ❌ [${file}] JSON 파일 처리 중 오류 발생: ${result.error}`);
                        errorCount++;
                        errors.push({ file, error: result.error });
                    }
                }
            } else {
                // Process YAML file
                const result = await processCaseFile(caseFilePath, file, personality.personalityId);
                
                if (result.success) {
                    console.log(`  ✅ [${result.title}] YAML 증례가 성공적으로 추가되었습니다.`);
                    successCount++;
                } else {
                    console.error(`  ❌ [${file}] YAML 파일 처리 중 오류 발생: ${result.error}`);
                    errorCount++;
                    errors.push({ file, error: result.error });
                }
            }
        }

        console.log('\n📊 시딩 결과 요약:');
        console.log(`  ✅ 성공: ${successCount}개`);
        console.log(`  ❌ 실패: ${errorCount}개`);
        
        if (errors.length > 0) {
            console.log('\n❌ 실패한 파일들:');
            errors.forEach(({ file, error }) => {
                console.log(`  - ${file}: ${error}`);
            });
        }

        console.log('\n🎉 데이터베이스 시딩이 완료되었습니다.');

    } catch (error) {
        console.error('❌ 시딩 중 치명적인 오류가 발생했습니다:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
        console.log('🔌 데이터베이스 연결이 종료되었습니다.');
    }
}

// Run the seeding
if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };
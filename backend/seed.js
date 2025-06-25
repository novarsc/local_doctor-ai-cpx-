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
 * Finds the appropriate checklist file for a case file
 * @param {string} fileName - Name of the case file
 * @returns {string|null} Checklist file path or null if not found
 */
function getChecklistPath(fileName) {
    const baseFileName = path.basename(fileName, path.extname(fileName));
    
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

        const yamlFiles = fs.readdirSync(casesDir)
                            .filter(file => file.endsWith('.yaml') || file.endsWith('.yml'))
                            .sort(); // Sort for consistent ordering

        console.log(`\n📁 총 ${yamlFiles.length}개의 증례 파일을 발견했습니다. 시딩을 시작합니다...\n`);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process files sequentially to avoid overwhelming the database
        for (const file of yamlFiles) {
            const caseFilePath = path.join(casesDir, file);
            const result = await processCaseFile(caseFilePath, file, personality.personalityId);
            
            if (result.success) {
                console.log(`  ✅ [${result.title}] 증례가 성공적으로 추가되었습니다.`);
                successCount++;
            } else {
                console.error(`  ❌ [${file}] 파일 처리 중 오류 발생: ${result.error}`);
                errorCount++;
                errors.push({ file, error: result.error });
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
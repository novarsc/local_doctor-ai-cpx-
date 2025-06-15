/**
 * @file seed.js
 * @description Initializes the database with baseline data, reading from YAML files.
 */
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { Scenario, AIPatientPersonality, sequelize } = require('./src/models');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  console.log('데이터베이스 시딩을 시작합니다...');

  try {
    // 기존 데이터를 모두 삭제하여 깨끗한 상태에서 시작합니다.
    await Scenario.destroy({ where: {}, truncate: true, cascade: true });
    await AIPatientPersonality.destroy({ where: {}, truncate: true, cascade: true });
    console.log('기존 데이터 삭제 완료.');

    // 1. "협조적인 환자" 성격 데이터 생성
    const personality = await AIPatientPersonality.create({
      personalityId: uuidv4(),
      name: '협조적인 환자',
      description: '의사의 질문에 최대한 협조적으로 대답하는 환자입니다.',
      promptFilePath: 'data/personalities/cooperative_v1.yaml',
      isActive: true,
    });
    console.log(`✅ [${personality.name}] AI 환자 성격이 생성되었습니다.`);

    // 2. YAML 파일 읽기
    const caseFilePath = path.join(__dirname, 'data/cases/acute_abdomen_kim.yaml');
    const caseFileContent = fs.readFileSync(caseFilePath, 'utf8');
    const caseData = yaml.load(caseFileContent);

    // 3. YAML 데이터와 직접 정의한 데이터를 조합하여 증례 생성
    const scenario = await Scenario.create({
      scenarioId: uuidv4(),
      name: caseData.title, // YAML의 title 필드 사용
      shortDescription: caseData.examinee_instructions, // 지시사항을 짧은 설명으로 활용
      // description 필드는 요청에 따라 비워둡니다.
      description: null, 
      primaryCategory: caseData.chapter, // YAML의 chapter 필드 사용
      secondaryCategory: '급성 복통', // 중분류는 직접 지정
      
      // 환자 정보 매핑
      age: caseData.patient_info.age,
      sex: caseData.patient_info.sex,
      presentingComplaint: caseData.patient_info.presenting_complaint,
      
      // 활력 징후 매핑
      bloodPressure: caseData.vital_signs.blood_pressure,
      pulse: caseData.vital_signs.pulse,
      respiration: caseData.vital_signs.respiration,
      temperature: caseData.vital_signs.temperature,
      
      keywords: ['급성 복통', 'RUQ', '담낭염', '소화기', '김민준'], // 예시 키워드
      caseFilePath: 'data/cases/acute_abdomen_kim.yaml',
      checklistFilePath: 'data/checklists/acute_abdomen_checklist.yaml',
      defaultAiPersonalityId: personality.personalityId,
    });
    console.log(`✅ [${scenario.name}] 증례가 생성되었습니다.`);

    console.log('🎉 데이터베이스 시딩이 성공적으로 완료되었습니다.');

  } catch (error) {
    console.error('❌ 시딩 중 오류가 발생했습니다:', error);
  } finally {
    // 스크립트 실행 후 데이터베이스 연결을 닫습니다.
    await sequelize.close();
  }
}

// 스크립트 실행
seedDatabase();
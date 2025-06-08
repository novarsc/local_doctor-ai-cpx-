// backend/seed.js

const { Scenario, AIPatientPersonality } = require('./src/models');
const { v4: uuidv4 } = require('uuid');

async function seedDatabase() {
  console.log('데이터베이스 시딩을 시작합니다...');

  try {
    // 1. "협조적인 환자" 성격 데이터 생성
    const personality = await AIPatientPersonality.create({
      personalityId: uuidv4(),
      name: '협조적인 환자',
      description: '의사의 질문에 최대한 협조적으로 대답하는 환자입니다.',
      // 2단계에서 만든 파일 경로를 정확하게 입력합니다.
      promptFilePath: 'data/personalities/cooperative_v1.yaml',
      isActive: true,
    });
    console.log(`✅ [${personality.name}] AI 환자 성격이 생성되었습니다.`);

    // 2. "급성 복통" 테스트 증례 데이터 생성
    const scenario = await Scenario.create({
      scenarioId: uuidv4(),
      name: '급성 복통 (테스트)',
      shortDescription: '25세 남성, 갑작스러운 우하복부 통증',
      primaryCategory: '소화기',
      secondaryCategory: '급성 복통',
      // 2단계에서 만든 파일 경로들을 정확하게 입력합니다.
      caseFilePath: 'data/cases/acute_abdomen_kim.yaml',
      checklistFilePath: 'data/checklists/acute_abdomen_checklist.yaml',
      // 위에서 생성한 AI 성격의 ID를 연결합니다.
      defaultAiPersonalityId: personality.personalityId,
    });
    console.log(`✅ [${scenario.name}] 증례가 생성되었습니다.`);

    console.log('🎉 데이터베이스 시딩이 성공적으로 완료되었습니다.');
  } catch (error) {
    console.error('❌ 시딩 중 오류가 발생했습니다:', error);
  } finally {
    // 실제로는 DB 연결을 여기서 닫아주는 것이 좋습니다.
    // process.exit();
  }
}

// 스크립트 실행
seedDatabase();
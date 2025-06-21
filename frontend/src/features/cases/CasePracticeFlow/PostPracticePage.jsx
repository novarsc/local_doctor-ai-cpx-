/**
 * @file PostPracticePage.jsx
 * @description Page component to display the results and feedback after a practice session.
 */

import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedbackForSession } from '../../../store/slices/practiceSessionSlice';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Button from '../../../components/common/Button';
import { CheckCircle, XCircle, Star, Target, ArrowRight } from 'lucide-react';

// 점수에 따라 색상을 반환하는 헬퍼 함수
const getScoreColor = (score) => {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

const PostPracticePage = () => {
  const { scenarioId, sessionId: urlSessionId } = useParams();
  const dispatch = useDispatch();

  const { sessionId: storeSessionId, feedback, isLoading, error } = useSelector((state) => state.practiceSession);

  // URL에서 온 sessionId를 우선 사용하고, 없으면 store의 sessionId 사용
  const currentSessionId = urlSessionId || storeSessionId;

  // 평가가 진행 중일 때, 5초마다 피드백을 다시 요청하기 위한 폴링 설정
  useEffect(() => {
    let intervalId;
    
    if (currentSessionId) {
      dispatch(fetchFeedbackForSession(currentSessionId));

      // 피드백 상태가 'evaluating'일 때만 폴링 시작
      if (feedback?.status === 'evaluating') {
        intervalId = setInterval(() => {
          dispatch(fetchFeedbackForSession(currentSessionId));
        }, 5000); // 5초마다 반복
      }
    }

    // 컴포넌트가 언마운트되거나, 피드백 상태가 'completed'로 바뀌면 폴링을 중단
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [dispatch, currentSessionId, feedback?.status]);

  if (isLoading || !feedback || feedback.status === 'evaluating') {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <LoadingSpinner text="AI가 사용자의 답변을 채점하고 있습니다." />
        <p className="mt-4 text-gray-600">결과가 나오기까지 최대 1분 정도 소요될 수 있습니다. 잠시만 기다려주세요.</p>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">오류가 발생했습니다: {error}</div>;
  }

  // feedback.data가 없을 경우를 대비한 예외 처리
  if (!feedback.data) {
    return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
            <p className="text-lg text-gray-700">평가 결과를 불러오는 데 실패했습니다.</p>
            <Link to="/cases" className="mt-4">
                <Button variant="primary">증례 목록으로 돌아가기</Button>
            </Link>
        </div>
    );
  }

  const { overallScore, qualitativeFeedback, checklistResults, goodPoints, improvementAreas } = feedback.data;

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800">실습 결과 및 피드백</h1>
          <p className="text-lg text-gray-600 mt-2">AI 평가 교수가 채점한 나의 임상 수행 능력을 확인해보세요.</p>
        </header>

        {/* 요약 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-500 mb-2">종합 점수</h3>
            <p className={`text-7xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}<span className="text-4xl text-gray-400">/100</span></p>
          </div>
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-3">교수 총평</h3>
            <p className="text-gray-700 leading-relaxed">{qualitativeFeedback}</p>
          </div>
        </div>

        {/* 상세 피드백 섹션 */}
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="space-y-12">
            {/* 체크리스트 결과 */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">수행 항목 체크리스트</h3>
              <ul className="space-y-4">
                {checklistResults && checklistResults.map((item, index) => (
                  <li key={index} className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-start">
                      {item.performance === 'yes' ? 
                        <CheckCircle className="h-6 w-6 text-green-500 mr-4 flex-shrink-0 mt-1" /> : 
                        <XCircle className="h-6 w-6 text-red-500 mr-4 flex-shrink-0 mt-1" />}
                      <div>
                        <p className="font-semibold text-gray-800">{item.itemText}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.aiComment}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* 잘한 점 */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">잘한 점</h3>
              <ul className="space-y-3">
                {goodPoints && goodPoints.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <Star className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
                    <p className="text-gray-700">{point.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* 개선할 점 */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">개선할 점</h3>
              <ul className="space-y-4">
                {improvementAreas && improvementAreas.map((area, index) => (
                  <li key={index} className="flex items-start">
                    <Target className="h-5 w-5 text-indigo-500 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">{area.description}</p>
                      <p className="text-sm text-gray-600 mt-1">{area.advice}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* 하단 버튼 */}
        <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4">
          {/* MY 노트에서 온 경우와 일반 실습에서 온 경우를 구분 */}
          {urlSessionId ? (
            // MY 노트에서 온 경우
            <Link to="/my-notes/history">
              <Button variant="primary" size="lg" className="flex items-center">
                학습 기록으로 돌아가기 <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          ) : (
            // 일반 실습에서 온 경우
            <>
              <Link to={`/cases/practice/${scenarioId}`}>
                <Button variant="secondary" size="lg">다시 실습하기</Button>
              </Link>
              <Link to="/cases">
                <Button variant="primary" size="lg" className="flex items-center">
                  증례 목록으로 돌아가기 <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostPracticePage;

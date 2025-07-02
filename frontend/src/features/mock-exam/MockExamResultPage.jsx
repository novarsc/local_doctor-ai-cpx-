/**
 * @file MockExamResultPage.jsx
 * @description Page to display the final results of a mock exam session.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearCurrentMockExam, fetchMockExamSession } from '../../store/slices/mockExamSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { mockExamService } from '../../services/mockExamService';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Star, Target, CheckCircle, XCircle } from 'lucide-react';

const MockExamResultPage = () => {
    const dispatch = useDispatch();
    const { mockExamSessionId } = useParams();
    const { currentSession, status, error } = useSelector(state => state.mockExam);
    const autoRetryTimer = useRef(null);
    const [progress, setProgress] = useState(null);
    const progressPollTimer = useRef(null);
    // 체크리스트 아코디언 상태를 scenarioId+category별로 관리
    const [openGroups, setOpenGroups] = useState({});
    const swiperRef = useRef(null);

    // 디버깅을 위한 로그
    console.log('MockExamResultPage render:', { mockExamSessionId, currentSession, status, error });

    // 모의고사 세션 정보 로드
    useEffect(() => {
        console.log('MockExamResultPage useEffect triggered:', { mockExamSessionId, currentSession, status, error });
        
        // 결과 페이지에서는 항상 최신 세션 정보를 가져오도록 함
        // 모의고사 완료 후 최신 점수 정보를 보여주기 위함
        if (mockExamSessionId && status !== 'loading') {
            console.log('Fetching mock exam session:', mockExamSessionId);
            dispatch(fetchMockExamSession(mockExamSessionId))
                .unwrap()
                .then((result) => {
                    console.log('Mock exam session fetched successfully:', result);
                })
                .catch((error) => {
                    console.error('Failed to fetch mock exam session:', error);
                });
        }
        
        // 사용자가 이 결과 페이지를 떠날 때, Redux의 현재 모의고사 상태를 초기화합니다.
        return () => {
            dispatch(clearCurrentMockExam());
        }
    }, [dispatch, mockExamSessionId]); // status를 의존성에서 제거하여 무한 반복 방지

    // 세션이 없고 에러가 있을 때 자동으로 다시 시도 (한 번만)
    useEffect(() => {
        if (!currentSession && error && status === 'error') {
            console.log('세션이 없고 에러가 있음, 3초 후 다시 시도');
            const timer = setTimeout(() => {
                console.log('자동 재시도 시작');
                dispatch(fetchMockExamSession(mockExamSessionId));
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [error, status, dispatch, mockExamSessionId]); // currentSession 의존성 제거

    // 에러 발생 시 10초마다 자동 재시도
    useEffect(() => {
        if (error && status === 'error') {
            autoRetryTimer.current = setTimeout(() => {
                dispatch(fetchMockExamSession(mockExamSessionId));
            }, 10000); // 10초마다 자동 재시도
            return () => clearTimeout(autoRetryTimer.current);
        }
    }, [error, status, dispatch, mockExamSessionId]);

    // 로딩 중일 때 진행상황 폴링
    useEffect(() => {
        if (status === 'loading' && mockExamSessionId) {
            const fetchProgress = async () => {
                try {
                    const prog = await mockExamService.getEvaluationProgress(mockExamSessionId);
                    setProgress(prog);
                } catch (e) {
                    setProgress(null);
                }
            };
            fetchProgress();
            progressPollTimer.current = setInterval(fetchProgress, 3000);
            return () => clearInterval(progressPollTimer.current);
        } else {
            setProgress(null);
        }
    }, [status, mockExamSessionId]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <LoadingSpinner size="xl" />
                <h2 className="mt-6 text-2xl font-bold text-gray-800">수고하셨습니다! 전체 모의고사를 채점 중입니다.</h2>
                <p className="mt-2 text-gray-600">최종 결과 확인까지 5분정도 소요됩니다.</p>
                {progress && (
                    <p className="mt-4 text-lg text-blue-700 font-semibold">진행상황: {progress.completed} / {progress.total} 평가 완료</p>
                )}
            </div>
        );
    }

    if (error || !currentSession) {
        // 평가 진행상황 추출
        let progress = null;
        if (error && typeof error === 'object' && error.progress) {
            progress = error.progress;
        } else if (typeof error === 'string') {
            try {
                const parsed = JSON.parse(error);
                if (parsed && parsed.progress) progress = parsed.progress;
            } catch {}
        }
        return (
            <div className="p-8 text-center text-red-500">
                <h1 className="text-2xl font-bold mb-4">오류</h1>
                <p>결과를 표시하는 중 오류가 발생했습니다: {typeof error === 'string' ? error : error?.message}</p>
                {progress && (
                    <p className="mt-4 text-lg text-blue-700 font-semibold">진행상황: {progress.completed} / {progress.total} 평가 완료</p>
                )}
                <p className="mt-2 text-sm text-gray-600">세션 ID: {mockExamSessionId}</p>
                <p className="mt-2 text-sm text-gray-600">상태: {status}</p>
                <p className="mt-2 text-sm text-gray-600">현재 세션: {currentSession ? '존재함' : '존재하지 않음'}</p>
                <p className="mt-2 text-sm text-gray-600">에러: {typeof error === 'string' ? error : error?.message}</p>
                <div className="mt-4 space-y-2">
                    <button 
                        onClick={() => {
                            dispatch(fetchMockExamSession(mockExamSessionId));
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg mr-2"
                    >
                        다시 시도
                    </button>
                    <button 
                        onClick={() => {
                            dispatch(clearCurrentMockExam());
                            setTimeout(() => {
                                dispatch(fetchMockExamSession(mockExamSessionId));
                            }, 100);
                        }}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg mr-2"
                    >
                        상태 초기화 후 재시도
                    </button>
                    <Link to="/mock-exams" className="inline-block px-4 py-2 bg-gray-600 text-white rounded-lg">
                        모의고사 홈으로 돌아가기
                    </Link>
                </div>
                <p className="mt-6 text-gray-500 text-sm">10초 후 자동으로 다시 시도합니다...</p>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <header className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">모의고사 결과</h1>
                    <p className="text-gray-600 mt-2">응시일: {new Date(currentSession.startTime).toLocaleString()}</p>
                </header>

                {/* Overall Score + Score by Case (가로 정렬) */}
                <div className="flex flex-col lg:flex-row gap-8 mb-8">
                    {/* 종합 평균 점수 */}
                    <div className="flex-1 bg-white p-8 rounded-xl shadow-lg text-center flex flex-col justify-center min-h-[260px]">
                    <h2 className="text-xl font-semibold text-gray-500">종합 평균 점수</h2>
                    <p className="text-7xl font-bold text-blue-600 my-3">{currentSession.overallScore ?? 'N/A'}</p>
                    <p className="text-gray-700">6개 증례의 평균 점수입니다.</p>
                </div>
                    {/* 증례별 점수 상세 */}
                    <div className="flex-1 bg-white p-8 rounded-xl shadow-lg flex flex-col min-h-[260px]">
                    <h3 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-4">증례별 점수 상세</h3>
                        <div className="space-y-4 flex-1">
                        {currentSession.selectedScenariosDetails.map((scenario, index) => (
                                <div
                                    key={scenario.scenarioId}
                                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                                    onClick={() => {
                                        if (swiperRef.current) {
                                            swiperRef.current.slideTo(index);
                                        }
                                    }}
                                >
                                <div>
                                    <p className="font-bold text-gray-800">증례 {index + 1}: {scenario.name}</p>
                                    <p className="text-sm text-gray-600">{scenario.primaryCategory} &gt; {scenario.secondaryCategory}</p>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {scenario.score ?? 'N/A'} 점
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>

                {/* Scenario Feedback Carousel */}
                <div className="bg-white p-8 rounded-xl shadow-lg mt-10">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">증례별 AI 피드백</h3>
                  <div className="relative">
                    <Swiper
                      modules={[Navigation, Pagination]}
                      spaceBetween={32}
                      slidesPerView={1}
                      navigation={{
                        nextEl: '.custom-swiper-button-next',
                        prevEl: '.custom-swiper-button-prev',
                      }}
                      pagination={{ clickable: true }}
                      onSwiper={swiper => { swiperRef.current = swiper; }}
                      allowTouchMove={true}
                      style={{ cursor: 'grab' }}
                    >
                    {currentSession.selectedScenariosDetails.map((scenario, idx) => (
                      <SwiperSlide key={scenario.scenarioId}>
                        <div className="max-w-2xl mx-auto">
                          <div className="mb-4 text-center">
                            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-semibold text-lg mb-2">증례 {idx + 1}</span>
                            <div className="font-bold text-xl text-gray-800">{scenario.name}</div>
                            <div className="text-sm text-gray-500 mb-2">{scenario.primaryCategory} &gt; {scenario.secondaryCategory}</div>
                              {scenario.feedback && (scenario.feedback.overallScore !== null && scenario.feedback.overallScore !== undefined)
                                ? <div className="text-3xl font-bold text-blue-600 my-2">{scenario.feedback.overallScore}점</div>
                                : <div className="text-3xl font-bold text-blue-600 my-2">0점</div>
                              }
                          </div>
                          {/* 교수 총평 */}
                          {scenario.feedback?.qualitativeFeedback && (
                            <div className="mb-8">
                              <h4 className="text-lg font-bold text-gray-700 mb-2">교수 총평</h4>
                              <p className="text-gray-700 leading-relaxed">{scenario.feedback.qualitativeFeedback}</p>
                            </div>
                          )}
                          {/* 잘한 점 */}
                          {scenario.feedback?.goodPoints?.length > 0 && (
                            <div className="mb-8">
                              <h4 className="text-lg font-bold text-gray-700 mb-2">잘한 점</h4>
                              <ul className="space-y-2">
                                {scenario.feedback.goodPoints.map((point, i) => (
                                  <li key={i} className="flex items-start">
                                    <Star className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-1" />
                                    <span className="text-gray-700">{point.description}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {/* 개선할 점 */}
                          {scenario.feedback?.improvementAreas?.length > 0 && (
                            <div className="mb-8">
                              <h4 className="text-lg font-bold text-gray-700 mb-2">개선할 점</h4>
                              <ul className="space-y-2">
                                {scenario.feedback.improvementAreas.map((area, i) => (
                                  <li key={i} className="flex items-start">
                                    <Target className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0 mt-1" />
                                    <div>
                                      <span className="font-semibold text-gray-800">{area.description}</span>
                                      {area.advice && <div className="text-sm text-gray-600 mt-1">{area.advice}</div>}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                            {/* 체크리스트 - PostPracticePage 스타일 */}
                          {scenario.feedback?.checklistResults?.length > 0 && (
                            <div className="mb-8">
                              <h4 className="text-lg font-bold text-gray-700 mb-2">수행 항목 체크리스트</h4>
                                {/* 그룹핑 및 토글 구현 */}
                                {(() => {
                                  const groupedResults = scenario.feedback.checklistResults.reduce((groups, item) => {
                                    const category = [item.section, item.subtitle].filter(Boolean).join(' - ') || '기타';
                                    if (!groups[category]) groups[category] = [];
                                    groups[category].push(item);
                                    return groups;
                                  }, {});
                                  return (
                                    <div className="space-y-6">
                                      {Object.entries(groupedResults).map(([category, items]) => {
                                        const sortedItems = [...items].sort((a, b) => {
                                          const aPerf = (a.performance || '').trim().toLowerCase();
                                          const bPerf = (b.performance || '').trim().toLowerCase();
                                          if (aPerf === bPerf) return 0;
                                          if (aPerf === 'no') return -1;
                                          if (bPerf === 'no') return 1;
                                          return 0;
                                        });
                                        // scenarioId+category 조합으로 상태 관리
                                        const groupKey = `${scenario.scenarioId}__${category}`;
                                        const isOpen = openGroups[groupKey] !== undefined ? openGroups[groupKey] : true;
                                        const handleToggle = () => setOpenGroups(prev => ({ ...prev, [groupKey]: !isOpen }));
                                        return (
                                          <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <button type="button" onClick={handleToggle} className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200 focus:outline-none">
                                              <h4 className="font-semibold text-gray-800 text-left">{category}</h4>
                                              <span className="ml-2 text-gray-500">{isOpen ? '▼' : '▶'}</span>
                                            </button>
                                            {isOpen && (
                                              <ul className="divide-y divide-gray-100">
                                                {sortedItems.map((item, index) => (
                                                  <li key={index} className="p-4 bg-white">
                                                    <div className="flex items-start">
                                                      {item.performance === 'yes' ? 
                                                        <CheckCircle className="h-6 w-6 text-green-500 mr-4 flex-shrink-0 mt-1" /> : 
                                                        <XCircle className="h-6 w-6 text-red-500 mr-4 flex-shrink-0 mt-1" />}
                                                      <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{item.itemText || item.content}</p>
                                                        {item.aiComment && (
                                                          <p className="text-sm text-gray-600 mt-1">{item.aiComment}</p>
                                                        )}
                                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })()}
                            </div>
                          )}
                          {/* 피드백이 없을 때 */}
                          {!scenario.feedback && (
                            <div className="text-gray-400 text-center py-12">아직 피드백이 준비되지 않았습니다.</div>
                          )}
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                    {/* 커스텀 네비게이션 버튼 */}
                    <button className="custom-swiper-button-prev absolute left-0 top-0 z-10 bg-white rounded-full shadow p-2 border border-gray-200 hover:bg-gray-100 transition" style={{transform: 'translateY(-50%)'}} aria-label="이전 증례">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button className="custom-swiper-button-next absolute right-0 top-0 z-10 bg-white rounded-full shadow p-2 border border-gray-200 hover:bg-gray-100 transition" style={{transform: 'translateY(-50%)'}} aria-label="다음 증례">
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                  </div>
                </div>

                <div className="text-center mt-12">
                    <Link to="/mock-exams" className="px-10 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 transition shadow-md">
                        모의고사 홈으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MockExamResultPage;
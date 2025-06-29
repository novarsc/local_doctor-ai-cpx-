import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchLearningHistory, fetchMockExamCases } from '../../store/slices/myNotesSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LearningHistoryPage = () => {
    const dispatch = useDispatch();
    const { learningHistory, mockExamCases, status, error } = useSelector((state) => state.myNotes);
    const [expandedMockExams, setExpandedMockExams] = useState(new Set());

    useEffect(() => {
        if (status.learningHistory !== 'succeeded') {
        dispatch(fetchLearningHistory());
        }
    }, [dispatch, status.learningHistory]);

    const handleMockExamToggle = async (mockExamId) => {
        const newExpanded = new Set(expandedMockExams);
        
        if (newExpanded.has(mockExamId)) {
            // 축소
            newExpanded.delete(mockExamId);
            setExpandedMockExams(newExpanded);
        } else {
            // 확장
            newExpanded.add(mockExamId);
            setExpandedMockExams(newExpanded);
            
            // 해당 모의고사의 개별 증례들을 가져오기
            if (status.mockExamCases !== 'loading') {
                dispatch(fetchMockExamCases(mockExamId));
            }
        }
    };

    const getResultLink = (item) => {
        // 실제 백엔드 데이터 구조에 맞게 수정
        if (item.type === '증례 실습' && item.id) {
            return `/my-notes/history/case-results/${item.id}`;
        }
        if (item.type === '모의고사' && item.id) {
            return `/my-notes/history/mock-exam-results/${item.id}`;
        }
        return '#';
    };

    const renderMockExamCases = (mockExamId) => {
        if (!expandedMockExams.has(mockExamId) || !mockExamCases || mockExamCases.mockExamSessionId !== mockExamId) {
            return null;
        }

        if (status.mockExamCases === 'loading') {
            return (
                <tr>
                    <td colSpan="5" className="px-6 py-4">
                        <div className="flex justify-center">
                            <LoadingSpinner size="sm" />
                            <span className="ml-2 text-gray-600">개별 증례를 불러오는 중...</span>
                        </div>
                    </td>
                </tr>
            );
        }

        return mockExamCases.cases.map((caseItem, index) => (
            <tr key={`${mockExamId}-case-${index}`} className="bg-gray-50">
                <td className="px-6 py-3 pl-12">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        증례 {caseItem.caseNumber}
                    </span>
                </td>
                <td className="px-6 py-3 text-sm text-gray-900">
                    <div>
                        <div className="font-medium">{caseItem.name}</div>
                        <div className="text-xs text-gray-500">
                            {caseItem.age}세 {caseItem.sex} - {caseItem.presentingComplaint}
                        </div>
                    </div>
                </td>
                <td className="px-6 py-3 text-sm text-gray-500">
                    {caseItem.completedAt ? new Date(caseItem.completedAt).toLocaleDateString('ko-KR') : 'N/A'}
                </td>
                <td className="px-6 py-3 text-sm text-gray-800 font-bold">
                    {typeof caseItem.score === 'number' ? `${caseItem.score}점` : 'N/A'}
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium">
                    {caseItem.practiceSessionId ? (
                        <Link to={`/my-notes/history/case-results/${caseItem.practiceSessionId}`} className="text-indigo-600 hover:text-indigo-900">
                            결과 보기
                        </Link>
                    ) : (
                        <span className="text-gray-400">결과 없음</span>
                    )}
                </td>
            </tr>
        ));
    };

    return (
        <div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학습명</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">완료일</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">점수</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">동작</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {learningHistory.length === 0 ? (
                            <tr><td colSpan="5" className="p-6 text-center text-gray-500">아직 완료한 학습 기록이 없습니다.</td></tr>
                        ) : (
                            learningHistory.map((item) => {
                                const type = item.type || '증례 실습';
                                const title = item.name || item.scenarioName || `모의고사 (${item.examType || '랜덤'})`;
                                const date = new Date(item.completedAt || item.examDate).toLocaleDateString('ko-KR');
                                const score = item.score ?? item.averageScore ?? 'N/A';
                                const isExpanded = expandedMockExams.has(item.id);

                                return (
                                    <React.Fragment key={item.id}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    {item.type === '모의고사' && (
                                                        <button
                                                            onClick={() => handleMockExamToggle(item.id)}
                                                            className="mr-2 text-gray-400 hover:text-gray-600 transition-transform"
                                                            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                                        >
                                                            ▶
                                                        </button>
                                                    )}
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${type === '모의고사' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {type}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{title}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold">{typeof score === 'number' ? `${score}점` : score}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link to={getResultLink(item)} className="text-indigo-600 hover:text-indigo-900">
                                                    결과 보기
                                                </Link>
                                            </td>
                                        </tr>
                                        {item.type === '모의고사' && renderMockExamCases(item.id)}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LearningHistoryPage;

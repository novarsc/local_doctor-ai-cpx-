/**
 * @file LearningHistoryPage.jsx
 * @description Page component to display the user's complete learning history.
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchLearningHistory } from '../../store/slices/myNotesSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const LearningHistoryPage = () => {
    const dispatch = useDispatch();
    const { learningHistory, status, error } = useSelector((state) => state.myNotes);

    useEffect(() => {
        if (status.learningHistory !== 'succeeded') {
        dispatch(fetchLearningHistory());
        }
    }, [dispatch, status.learningHistory]);

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

    if (status.learningHistory === 'loading') {
        return <div className="p-6 text-center"><LoadingSpinner /></div>;
    }
    if (status.learningHistory === 'failed') {
        return <div className="p-6 text-center text-red-500">오류가 발생했습니다: {error}</div>;
    }



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
                                // 실제 백엔드 데이터 구조에 맞게 수정
                                const type = item.type || '증례 실습';
                                const title = item.name || item.scenarioName || `모의고사 (${item.examType || '랜덤'})`;
                                const date = new Date(item.completedAt || item.examDate).toLocaleDateString('ko-KR');
                                const score = item.score ?? item.averageScore ?? 'N/A';

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${type === '모의고사' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {type}
                                    </span>
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
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LearningHistoryPage;

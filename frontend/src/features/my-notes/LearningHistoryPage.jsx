import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchLearningHistory } from '../../store/slices/myNotesSlice';

const LearningHistoryPage = () => {
    const dispatch = useDispatch();
    const { learningHistory, status, error } = useSelector((state) => state.myNotes);

    useEffect(() => {
        dispatch(fetchLearningHistory());
    }, [dispatch]);

    const getResultLink = (item) => {
        if (item.type === '증례 실습') {
            return `/cases/${item.scenarioId}/practice/result`;
        }
        if (item.type === '모의고사') {
            return `/mock-exam/${item.id}/result`;
        }
        return '#';
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">나의 학습 활동</h1>
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
                        {status.learningHistory === 'loading' && <tr><td colSpan="5" className="p-6 text-center text-gray-500">학습 기록을 불러오는 중...</td></tr>}
                        {status.learningHistory === 'failed' && <tr><td colSpan="5" className="p-6 text-center text-red-500">오류: {error}</td></tr>}
                        {status.learningHistory === 'succeeded' && learningHistory.length === 0 && (
                            <tr><td colSpan="5" className="p-6 text-center text-gray-500">아직 완료한 학습 기록이 없습니다.</td></tr>
                        )}
                        {status.learningHistory === 'succeeded' && learningHistory.map((item) => (
                            <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.type === '모의고사' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.completedAt).toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold">{item.score ?? 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Link to={getResultLink(item)} className="text-indigo-600 hover:text-indigo-900">
                                        결과 보기
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LearningHistoryPage;
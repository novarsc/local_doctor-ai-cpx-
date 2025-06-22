import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDetailedIncorrectNotes, saveUserMemo, updateNoteStatus } from '../../store/slices/myNotesSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const IncorrectAnswersDetailPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { scenarioId } = useParams();
    const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'feedback', 'checklist'
    const [userMemo, setUserMemo] = useState('');

    const { detailedIncorrectNotes, status, error } = useSelector(state => state.myNotes);
    const noteData = detailedIncorrectNotes[scenarioId];

    useEffect(() => {
        if (scenarioId) {
            dispatch(fetchDetailedIncorrectNotes(scenarioId));
        }
    }, [dispatch, scenarioId]);

    useEffect(() => {
        if (noteData) {
            setUserMemo(noteData.userMemo || '');
        }
    }, [noteData]);

    const handleSaveMemo = () => {
        dispatch(saveUserMemo({
            scenarioId,
            memo: userMemo
        }));
    };

    const handleNoteStatusChange = (hasNote) => {
        dispatch(updateNoteStatus({ scenarioId, hasNote }));
    };

    const handleBackToList = () => {
        navigate('/my-notes/incorrect');
    };

    if (status.detailedIncorrectNotes === 'loading') {
        return <LoadingSpinner text="상세 정보를 불러오는 중..." />;
    }

    if (status.detailedIncorrectNotes === 'failed') {
        return (
            <div className="text-center py-8">
                <p className="text-red-500 mb-4">데이터를 불러오는데 실패했습니다.</p>
                <button
                    onClick={handleBackToList}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    목록으로 돌아가기
                </button>
            </div>
        );
    }

    if (!noteData) {
        return <LoadingSpinner text="데이터를 불러오는 중..." />;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* 헤더 */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">상세 오답노트</h1>
                            <p className="text-gray-600 mt-1">증례 ID: {scenarioId}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={noteData.hasNote || false}
                                    onChange={(e) => handleNoteStatusChange(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">오답노트 작성</span>
                            </div>
                            <button
                                onClick={handleBackToList}
                                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                            >
                                목록으로
                            </button>
                        </div>
                    </div>

                    {/* 평가 요약 */}
                    {noteData.evaluation && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{noteData.evaluation.overallScore}점</div>
                                <div className="text-sm text-gray-600">총점</div>
                            </div>
                            <div className="md:col-span-2">
                                <div className="text-sm font-medium text-gray-700 mb-1">교수 총평</div>
                                <div className="text-sm text-gray-600">{noteData.evaluation.qualitativeFeedback}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 탭 네비게이션 */}
                <div className="bg-white rounded-lg shadow-md mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'chat'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                채팅 기록
                            </button>
                            <button
                                onClick={() => setActiveTab('feedback')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'feedback'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                피드백
                            </button>
                            <button
                                onClick={() => setActiveTab('checklist')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === 'checklist'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                오답 체크리스트
                            </button>
                        </nav>
                    </div>

                    {/* 탭 콘텐츠 */}
                    <div className="p-6">
                        {/* 채팅 기록 탭 */}
                        {activeTab === 'chat' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">실제 채팅 기록</h3>
                                {noteData.chatHistory && noteData.chatHistory.length > 0 ? (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {noteData.chatHistory.map((message, index) => (
                                            <div
                                                key={index}
                                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                        message.sender === 'user'
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-200 text-gray-800'
                                                    }`}
                                                >
                                                    <div className="text-sm font-medium mb-1">
                                                        {message.sender === 'user' ? '의사' : '환자'}
                                                    </div>
                                                    <div className="text-sm whitespace-pre-wrap">{message.message}</div>
                                                    <div className="text-xs opacity-70 mt-1">
                                                        {new Date(message.timestamp).toLocaleTimeString('ko-KR')}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">채팅 기록이 없습니다.</p>
                                )}
                            </div>
                        )}

                        {/* 피드백 탭 */}
                        {activeTab === 'feedback' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">상세 피드백</h3>
                                
                                {noteData.evaluation ? (
                                    <>
                                        {/* 좋은 점 */}
                                        {noteData.evaluation.goodPoints && noteData.evaluation.goodPoints.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-green-700 mb-2">👍 좋은 점</h4>
                                                <ul className="space-y-2">
                                                    {noteData.evaluation.goodPoints.map((point, index) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <span className="text-green-500 mt-1">•</span>
                                                            <span className="text-gray-700">{point.description}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* 개선점 */}
                                        {noteData.evaluation.improvementAreas && noteData.evaluation.improvementAreas.length > 0 && (
                                            <div>
                                                <h4 className="font-semibold text-red-700 mb-2">🔧 개선점</h4>
                                                <ul className="space-y-3">
                                                    {noteData.evaluation.improvementAreas.map((area, index) => (
                                                        <li key={index} className="border-l-4 border-red-200 pl-4">
                                                            <div className="font-medium text-gray-800 mb-1">
                                                                {area.description}
                                                            </div>
                                                            {area.advice && (
                                                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                                                    💡 조언: {area.advice}
                                                                </div>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">피드백 정보가 없습니다.</p>
                                )}
                            </div>
                        )}

                        {/* 오답 체크리스트 탭 */}
                        {activeTab === 'checklist' && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">체크리스트 결과</h3>
                                
                                {noteData.evaluation && noteData.evaluation.checklistResults && noteData.evaluation.checklistResults.length > 0 ? (
                                    <div className="space-y-3">
                                        {noteData.evaluation.checklistResults.map((item, index) => (
                                            <div
                                                key={index}
                                                className={`p-4 rounded-lg border ${
                                                    item.performance === 'yes'
                                                        ? 'bg-green-50 border-green-200'
                                                        : 'bg-red-50 border-red-200'
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5 ${
                                                            item.performance === 'yes'
                                                                ? 'bg-green-500'
                                                                : 'bg-red-500'
                                                        }`}
                                                    >
                                                        {item.performance === 'yes' ? '✓' : '✗'}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-800 mb-1">
                                                            {item.itemText}
                                                        </div>
                                                        {item.aiComment && (
                                                            <div className="text-sm text-gray-600">
                                                                {item.aiComment}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">체크리스트 결과가 없습니다.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 사용자 메모 */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">나의 메모</h2>
                    <textarea
                        value={userMemo}
                        onChange={(e) => setUserMemo(e.target.value)}
                        placeholder="이 문제에 대한 개인적인 메모를 작성하세요..."
                        className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                        onClick={handleSaveMemo}
                        disabled={status.incorrectNotes === 'saving'}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                    >
                        {status.incorrectNotes === 'saving' ? '저장 중...' : '메모 저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncorrectAnswersDetailPage; 
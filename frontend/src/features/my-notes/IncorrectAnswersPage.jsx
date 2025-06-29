import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchIncorrectNotes, saveUserMemo, fetchPracticedScenarios, updateNoteStatus } from '../../store/slices/myNotesSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const IncorrectAnswersPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [selectedScenarioId, setSelectedScenarioId] = useState(null);
    const [userMemo, setUserMemo] = useState('');

    const { practicedScenarios, status, incorrectNotes, error } = useSelector(state => state.myNotes);
    
    // 선택된 증례의 기본 정보
    const selectedScenario = practicedScenarios.find(scenario => scenario.scenarioId === selectedScenarioId);
    
    // 선택된 증례의 오답노트 데이터
    const currentNoteData = selectedScenarioId ? incorrectNotes[selectedScenarioId] : null;

    useEffect(() => {
        dispatch(fetchPracticedScenarios());
    }, [dispatch]);
    
    useEffect(() => {
        if (status.practicedScenarios === 'succeeded' && practicedScenarios.length > 0 && !selectedScenarioId) {
            setSelectedScenarioId(practicedScenarios[0].scenarioId);
        }
    }, [status.practicedScenarios, practicedScenarios, selectedScenarioId]);

    useEffect(() => {
        // 선택된 시나리오의 오답노트를 불러옵니다.
        if (selectedScenarioId) {
            dispatch(fetchIncorrectNotes(selectedScenarioId));
        }
    }, [dispatch, selectedScenarioId]);

    useEffect(() => {
        if (currentNoteData) {
            setUserMemo(currentNoteData.userMemo || '');
        } else {
            setUserMemo('');
        }
    }, [currentNoteData]);

    const handleSaveMemo = () => {
        dispatch(saveUserMemo({
            scenarioId: selectedScenarioId,
            memo: userMemo
        }));
    };

    const handleNoteStatusChange = (scenarioId, hasNote) => {
        dispatch(updateNoteStatus({ scenarioId, hasNote }));
    };

    const handleViewDetail = (scenarioId) => {
        navigate(`/my-notes/incorrect/${scenarioId}/detail`);
    };

    return (
        <div className="flex h-full gap-8">
            <aside className="w-1/3 bg-white p-4 rounded-lg shadow-md flex-shrink-0">
                <h2 className="font-bold text-xl mb-4 border-b pb-2">증례 목록</h2>
                <div className="space-y-1">
                    {status.practicedScenarios === 'loading' && <LoadingSpinner />}
                    {status.practicedScenarios === 'failed' && <p className="text-red-500">목록을 불러오는데 실패했습니다.</p>}
                    {status.practicedScenarios === 'succeeded' && (
                        practicedScenarios.length > 0 ? (
                            practicedScenarios.map(scenario => (
                                <div key={scenario.scenarioId} className="border rounded-md p-3 hover:bg-gray-50">
                                    <div className="flex items-center justify-between mb-2">
                                        <button
                                            onClick={() => setSelectedScenarioId(scenario.scenarioId)}
                                            className={`text-left flex-1 ${selectedScenarioId === scenario.scenarioId ? 'font-bold text-blue-600' : 'hover:text-blue-600'}`}
                                        >
                                            {scenario.name}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={scenario.hasNote || false}
                                                onChange={(e) => handleNoteStatusChange(scenario.scenarioId, e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => handleViewDetail(scenario.scenarioId)}
                                                className="text-sm text-blue-600 hover:text-blue-800 underline"
                                            >
                                                상세보기
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {/* 요약 정보 */}
                                    <div className="text-sm text-gray-600 space-y-1">
                                        {scenario.score !== null && (
                                            <div className="flex justify-between">
                                                <span>점수:</span>
                                                <span className="font-semibold">{scenario.score}점</span>
                                            </div>
                                        )}
                                        {scenario.qualitativeFeedback && (
                                            <div>
                                                <span className="font-medium">교수 총평:</span>
                                                <p className="text-xs mt-1 text-gray-700 line-clamp-2">
                                                    {scenario.qualitativeFeedback}
                                                </p>
                                            </div>
                                        )}
                                        {scenario.completedAt && (
                                            <div className="text-xs text-gray-500">
                                                완료일: {new Date(scenario.completedAt).toLocaleDateString('ko-KR')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm p-3">아직 학습을 완료한 증례가 없습니다.</p>
                        )
                    )}
                </div>
            </aside>
            <main className="w-2/3 bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">오답노트</h1>
                {!selectedScenarioId && <p>왼쪽에서 증례를 선택해주세요.</p>}
                {selectedScenarioId && status.incorrectNotes === 'loading' && <LoadingSpinner text="노트 내용을 불러오는 중..." />}

                {selectedScenario && status.incorrectNotes !== 'loading' && (
                    <div>
                        {/* 선택된 증례의 요약 정보 */}
                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2 text-blue-800">선택된 증례: {selectedScenario.name}</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                {selectedScenario.score !== null && (
                                    <div>
                                        <span className="font-medium">점수:</span>
                                        <span className="ml-2 font-bold text-lg">{selectedScenario.score}점</span>
                                    </div>
                                )}
                                {selectedScenario.qualitativeFeedback && (
                                    <div className="col-span-2">
                                        <span className="font-medium">교수 총평:</span>
                                        <p className="mt-1 text-gray-700">{selectedScenario.qualitativeFeedback}</p>
                                    </div>
                                )}
                                {selectedScenario.completedAt && (
                                    <div className="col-span-2">
                                        <span className="font-medium">완료일:</span>
                                        <span className="ml-2">{new Date(selectedScenario.completedAt).toLocaleDateString('ko-KR')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI 피드백 섹션 */}
                        {currentNoteData && currentNoteData.aiGeneratedFeedback && currentNoteData.aiGeneratedFeedback.length > 0 && (
                            <div className="mb-8">
                                <h3 className="font-semibold text-lg mb-2 text-red-600">AI의 개선 피드백</h3>
                                <div className="bg-red-50 p-4 rounded-md space-y-2 text-red-900 border border-red-200">
                                    <ul className="list-disc list-inside">
                                        {currentNoteData.aiGeneratedFeedback.map((feedback, i) => (
                                            <li key={i}>{typeof feedback === 'string' ? feedback : feedback.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {/* 사용자 메모 입력 - 항상 표시 */}
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">나의 메모</h2>
                            <textarea
                                value={userMemo}
                                onChange={(e) => setUserMemo(e.target.value)}
                                placeholder="이 문제에 대한 개인적인 메모를 작성하세요..."
                                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <div className="flex justify-between items-center mt-4">
                                <button
                                    onClick={handleSaveMemo}
                                    disabled={status.incorrectNotes === 'saving'}
                                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
                                >
                                    {status.incorrectNotes === 'saving' ? '저장 중...' : '메모 저장'}
                                </button>
                                <button
                                    onClick={() => handleViewDetail(selectedScenarioId)}
                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    상세 오답노트 보기
                                </button>
                            </div>
                        </div>

                        {/* AI 피드백이 없을 때 안내 메시지 */}
                        {(!currentNoteData || !currentNoteData.aiGeneratedFeedback || currentNoteData.aiGeneratedFeedback.length === 0) && (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-yellow-800 text-sm">
                                    이 증례에 대한 AI 피드백이 아직 준비되지 않았습니다. 
                                    상세 오답노트에서 더 자세한 정보를 확인할 수 있습니다.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default IncorrectAnswersPage;
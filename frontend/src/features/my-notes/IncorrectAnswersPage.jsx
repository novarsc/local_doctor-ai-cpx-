import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIncorrectNotes, saveUserMemo, fetchPracticedScenarios } from '../../store/slices/myNotesSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const IncorrectAnswersPage = () => {
    const dispatch = useDispatch();
    const [selectedScenarioId, setSelectedScenarioId] = useState(null);
    const [userMemo, setUserMemo] = useState('');

    const { practicedScenarios, status, incorrectNotes, error } = useSelector(state => state.myNotes);
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
        if (!selectedScenarioId) return;
        dispatch(saveUserMemo({ scenarioId: selectedScenarioId, memo: userMemo }));
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
                                <button
                                    key={scenario.scenarioId}
                                    onClick={() => setSelectedScenarioId(scenario.scenarioId)}
                                    className={`w-full text-left p-3 rounded-md transition-colors ${selectedScenarioId === scenario.scenarioId ? 'bg-blue-600 text-white font-bold shadow' : 'hover:bg-gray-100'}`}
                                >
                                    {scenario.name}
                                </button>
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

                {currentNoteData && status.incorrectNotes !== 'loading' && (
                    <div>
                        <div className="mb-8">
                            <h3 className="font-semibold text-lg mb-2 text-red-600">AI의 개선 피드백</h3>
                            <div className="bg-red-50 p-4 rounded-md space-y-2 text-red-900 border border-red-200">
                                {currentNoteData.aiGeneratedFeedback && currentNoteData.aiGeneratedFeedback.length > 0 ?
                                    <ul className="list-disc list-inside">
                                        {currentNoteData.aiGeneratedFeedback.map((fb, i) => <li key={i}>{fb.description}</li>)}
                                    </ul> :
                                    <p>AI 피드백이 없습니다.</p>
                                }
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-blue-600">나의 메모</h3>
                            <textarea
                                value={userMemo}
                                onChange={(e) => setUserMemo(e.target.value)}
                                placeholder="이 증례에 대해 배운 점, 실수한 점, 앞으로 주의할 점 등을 자유롭게 기록해보세요."
                                className="w-full h-64 p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                            <button
                                onClick={handleSaveMemo}
                                disabled={status.incorrectNotes === 'saving'}
                                className="mt-4 px-8 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-all"
                            >
                                {status.incorrectNotes === 'saving' ? '저장 중...' : '메모 저장'}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default IncorrectAnswersPage;
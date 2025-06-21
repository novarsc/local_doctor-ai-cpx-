import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { fetchIncorrectNotes, saveUserMemo, fetchPracticedScenarios } from '../../store/slices/myNotesSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner'; // 로딩 스피너 import

// MyNotesLayout 컴포넌트 (변경 없음)
const MyNotesLayout = ({ children }) => (
    <div className="flex min-h-screen bg-gray-100">
        <aside className="w-64 bg-white p-6 shadow-md flex-shrink-0">
            <h2 className="text-2xl font-bold mb-6">MY 노트</h2>
            <nav className="space-y-2">
                <NavLink to="/my-notes/bookmarks" className={({ isActive }) => `block py-2 px-4 rounded-md text-lg ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>즐겨찾기</NavLink>
                <NavLink to="/my-notes/incorrect" className={({ isActive }) => `block py-2 px-4 rounded-md text-lg ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>오답노트</NavLink>
                <NavLink to="/my-notes/history" className={({ isActive }) => `block py-2 px-4 rounded-md text-lg ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>학습 기록</NavLink>
            </nav>
        </aside>
        <main className="flex-grow p-8">
            {children}
        </main>
    </div>
);

// MOCK 데이터 제거
// const MOCK_PRACTICED_SCENARIOS = [ ... ];

const IncorrectAnswersPageContent = () => {
    const dispatch = useDispatch();
    const [selectedScenarioId, setSelectedScenarioId] = useState(null);
    const [userMemo, setUserMemo] = useState('');

    const { practicedScenarios, status, incorrectNotes, error } = useSelector(state => state.myNotes);
    const currentNoteData = selectedScenarioId ? incorrectNotes[selectedScenarioId] : null;

    // 컴포넌트 마운트 시, 학습 완료된 증례 목록을 불러옵니다.
    useEffect(() => {
        dispatch(fetchPracticedScenarios());
    }, [dispatch]);
    
    // 증례 목록 로딩이 끝나면, 첫 번째 증례를 자동으로 선택합니다.
    useEffect(() => {
        if (status.practicedScenarios === 'succeeded' && practicedScenarios.length > 0 && !selectedScenarioId) {
            setSelectedScenarioId(practicedScenarios[0].scenarioId);
        }
    }, [status.practicedScenarios, practicedScenarios, selectedScenarioId]);

    useEffect(() => {
        // 선택된 시나리오의 오답노트를 불러옵니다.
        dispatch(fetchIncorrectNotes(selectedScenarioId));
    }, [dispatch, selectedScenarioId]);

    useEffect(() => {
        if (currentNoteData) {
            setUserMemo(currentNoteData.userMemo || '');
        } else {
            setUserMemo(''); // 다른 증례 선택 시 메모 초기화
        }
    }, [currentNoteData]);

    const handleSaveMemo = () => {
        dispatch(saveUserMemo({
            scenarioId: selectedScenarioId,
            memo: userMemo
        }));
    };

    return (
        <div className="flex h-full gap-8">
            {/* Left Panel: List of scenarios with notes */}
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

            {/* Right Panel: Note content */}
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
                            <h3 className="font-semibold text-gray-700">해설</h3>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{currentNoteData.explanation}</p>
                        </div>
                    </div>
                )}

                {/* 사용자 메모 입력 */}
                <div className="bg-white rounded-lg shadow-md p-6 mt-6">
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
            </main>
        </div>
    );
};

const IncorrectAnswersPage = () => {
    return (
        <MyNotesLayout>
            <IncorrectAnswersPageContent />
        </MyNotesLayout>
    );
};

export default IncorrectAnswersPage;
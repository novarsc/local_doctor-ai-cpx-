/**
 * @file IncorrectAnswersPage.jsx
 * @description Page for viewing and editing incorrect answer notes.
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { fetchIncorrectNotes, saveUserMemo } from '../../store/slices/myNotesSlice';
// We need a list of scenarios the user has practiced to show on the left panel.
// For now, we will use a placeholder list.
const MOCK_PRACTICED_SCENARIOS = [
    { scenarioId: 's1-uuid-gastric', name: '급성 복통 환자' },
    // more scenarios would be added here based on user's practice history
];

const MyNotesLayout = ({ children }) => (
    <div className="flex min-h-screen bg-gray-100">
        <aside className="w-64 bg-white p-6 shadow-md flex-shrink-0">
            <h2 className="text-2xl font-bold mb-6">MY 노트</h2>
            <nav className="space-y-2">
                <NavLink to="/my-notes/bookmarks" className={({ isActive }) => `block py-2 px-3 rounded-md text-lg ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>
                    즐겨찾기
                </NavLink>
                <NavLink to="/my-notes/incorrect" className={({ isActive }) => `block py-2 px-3 rounded-md text-lg ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100'}`}>
                    오답노트
                </NavLink>
                <NavLink to="/my-notes/history" className="block py-2 px-3 rounded-md text-lg text-gray-400 cursor-not-allowed" onClick={(e) => e.preventDefault()}>
                    학습 기록 (예정)
                </NavLink>
            </nav>
        </aside>
        <main className="flex-grow p-8">
            {children}
        </main>
    </div>
);


const IncorrectAnswersPageContent = () => {
    const dispatch = useDispatch();
    const [selectedScenarioId, setSelectedScenarioId] = useState(MOCK_PRACTICED_SCENARIOS[0]?.scenarioId);
    const [userMemo, setUserMemo] = useState('');

    const { incorrectNotes, status } = useSelector(state => state.myNotes);
    const currentNoteData = incorrectNotes[selectedScenarioId];

    useEffect(() => {
        if (selectedScenarioId) {
            dispatch(fetchIncorrectNotes(selectedScenarioId));
        }
    }, [dispatch, selectedScenarioId]);

    useEffect(() => {
        if (currentNoteData) {
            setUserMemo(currentNoteData.userMemo);
        }
    }, [currentNoteData]);

    const handleSaveMemo = () => {
        dispatch(saveUserMemo({ scenarioId: selectedScenarioId, userMemo }));
    };

    return (
        <div className="flex h-full gap-8">
            {/* Left Panel: List of scenarios with notes */}
            <div className="w-1/3 bg-white p-4 rounded-lg shadow">
                <h2 className="font-bold text-xl mb-4 border-b pb-2">증례 목록</h2>
                <div className="space-y-2">
                    {MOCK_PRACTICED_SCENARIOS.map(scenario => (
                        <button 
                            key={scenario.scenarioId}
                            onClick={() => setSelectedScenarioId(scenario.scenarioId)}
                            className={`w-full text-left p-3 rounded-md ${selectedScenarioId === scenario.scenarioId ? 'bg-blue-600 text-white font-bold' : 'hover:bg-gray-100'}`}
                        >
                            {scenario.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Panel: Note content */}
            <div className="w-2/3 bg-white p-6 rounded-lg shadow">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">오답노트</h1>
                {status.incorrectNotes === 'loading' && <p>노트 내용을 불러오는 중...</p>}
                {currentNoteData && (
                    <div>
                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-2 text-red-600">AI가 지적한 개선할 점</h3>
                            <ul className="list-disc list-inside bg-red-50 p-4 rounded-md space-y-2 text-red-900">
                                {currentNoteData.aiGeneratedFeedback.length > 0 ? 
                                    currentNoteData.aiGeneratedFeedback.map((fb, i) => <li key={i}>{fb.description}</li>) :
                                    <li>AI 피드백이 없습니다.</li>
                                }
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-2 text-blue-600">나의 메모</h3>
                            <textarea
                                value={userMemo}
                                onChange={(e) => setUserMemo(e.target.value)}
                                placeholder="이 증례에 대해 배운 점, 실수한 점, 앞으로 주의할 점 등을 자유롭게 기록해보세요."
                                className="w-full h-64 p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={handleSaveMemo}
                                disabled={status.incorrectNotes === 'saving'}
                                className="mt-4 px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {status.incorrectNotes === 'saving' ? '저장 중...' : '메모 저장'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
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

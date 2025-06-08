/**
 * @file IncorrectAnswersPage.jsx
 * @description Page for viewing and editing incorrect answer notes.
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { fetchIncorrectNotes, saveUserMemo } from '../../store/slices/myNotesSlice';

// MyNotesLayout 컴포넌트 (BookmarksPage에서 가져와 재사용)
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

// TODO: 이 목업 데이터는 추후 API를 통해 '오답노트를 작성할 수 있는 증례 목록'을 불러오는 로직으로 대체되어야 합니다.
const MOCK_PRACTICED_SCENARIOS = [
    { scenarioId: 's1-uuid-gastric', name: '급성 복통 환자' },
    { scenarioId: 's2-uuid-headache', name: '만성 두통 환자' },
    // 사용자가 실습을 완료한 다른 증례들이 여기에 동적으로 추가될 것입니다.
];

const IncorrectAnswersPageContent = () => {
    const dispatch = useDispatch();
    const [selectedScenarioId, setSelectedScenarioId] = useState(MOCK_PRACTICED_SCENARIOS[0]?.scenarioId);
    const [userMemo, setUserMemo] = useState('');

    const { incorrectNotes, status } = useSelector(state => state.myNotes);
    const currentNoteData = incorrectNotes[selectedScenarioId];

    // 선택된 증례가 바뀔 때마다 해당 증례의 오답노트 데이터를 불러옵니다.
    useEffect(() => {
        if (selectedScenarioId) {
            dispatch(fetchIncorrectNotes(selectedScenarioId));
        }
    }, [dispatch, selectedScenarioId]);

    // 데이터를 성공적으로 불러오면, '나의 메모'를 화면에 표시하기 위해 state를 업데이트합니다.
    useEffect(() => {
        if (currentNoteData) {
            setUserMemo(currentNoteData.userMemo || '');
        }
    }, [currentNoteData]);

    const handleSaveMemo = () => {
        if (!selectedScenarioId) return;
        dispatch(saveUserMemo({ scenarioId: selectedScenarioId, memo: userMemo }));
    };

    return (
        <div className="flex h-full gap-8">
            {/* Left Panel: List of scenarios with notes */}
            <aside className="w-1/3 bg-white p-4 rounded-lg shadow-md flex-shrink-0">
                <h2 className="font-bold text-xl mb-4 border-b pb-2">증례 목록</h2>
                <div className="space-y-1">
                    {MOCK_PRACTICED_SCENARIOS.map(scenario => (
                        <button 
                            key={scenario.scenarioId}
                            onClick={() => setSelectedScenarioId(scenario.scenarioId)}
                            className={`w-full text-left p-3 rounded-md transition-colors ${selectedScenarioId === scenario.scenarioId ? 'bg-blue-600 text-white font-bold shadow' : 'hover:bg-gray-100'}`}
                        >
                            {scenario.name}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Right Panel: Note content */}
            <main className="w-2/3 bg-white p-6 rounded-lg shadow-md">
                <h1 className="text-3xl font-bold mb-6 text-gray-800">오답노트</h1>
                {status.incorrectNotes === 'loading' && <p>노트 내용을 불러오는 중...</p>}
                {!selectedScenarioId && <p>왼쪽에서 증례를 선택해주세요.</p>}
                
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

const IncorrectAnswersPage = () => {
    return (
        <MyNotesLayout>
            <IncorrectAnswersPageContent />
        </MyNotesLayout>
    );
};

export default IncorrectAnswersPage;
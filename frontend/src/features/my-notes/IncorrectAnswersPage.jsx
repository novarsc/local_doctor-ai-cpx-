/**
 * @file IncorrectAnswersPage.jsx
 * @description Page for viewing and editing incorrect answer notes.
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchIncorrectNotes, saveUserMemo } from '../../store/slices/myNotesSlice';

const IncorrectAnswersPage = () => {
    const dispatch = useDispatch();
    const [selectedScenarioId, setSelectedScenarioId] = useState('scenario-1');
    const [userMemo, setUserMemo] = useState('');

    // Redux 상태에서 오답노트 데이터를 가져옵니다.
    const { incorrectNotes, status } = useSelector(state => state.myNotes);
    const currentNoteData = incorrectNotes[selectedScenarioId];

    useEffect(() => {
        // 선택된 시나리오의 오답노트를 불러옵니다.
        dispatch(fetchIncorrectNotes(selectedScenarioId));
    }, [dispatch, selectedScenarioId]);

    useEffect(() => {
        // 노트 데이터가 로드되면 사용자 메모를 상태에 설정합니다.
        if (currentNoteData?.userMemo) {
            setUserMemo(currentNoteData.userMemo);
        } else {
            setUserMemo(''); // 메모가 없으면 빈 문자열로 초기화
        }
    }, [currentNoteData]);

    const handleSaveMemo = () => {
        dispatch(saveUserMemo({
            scenarioId: selectedScenarioId,
            memo: userMemo
        }));
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">오답노트</h1>

            {/* 시나리오 선택 드롭다운 */}
            <div className="mb-6">
                <label htmlFor="scenario-select" className="block text-sm font-medium text-gray-700 mb-2">
                    증례 선택
                </label>
                <select
                    id="scenario-select"
                    value={selectedScenarioId}
                    onChange={(e) => setSelectedScenarioId(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                    <option value="scenario-1">급성 복통 - 김○○ 환자</option>
                    <option value="scenario-2">흉통 - 이○○ 환자</option>
                    <option value="scenario-3">호흡곤란 - 박○○ 환자</option>
                </select>
            </div>

            {/* 오답 내용 표시 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">오답 내용</h2>
                {status.incorrectNotes === 'loading' && <p>노트 내용을 불러오는 중...</p>}
                
                {currentNoteData && status.incorrectNotes !== 'loading' && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-700">틀린 질문</h3>
                            <p className="text-gray-600 bg-red-50 p-3 rounded-md">{currentNoteData.incorrectQuestion}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-700">내가 선택한 답</h3>
                            <p className="text-red-600 bg-red-50 p-3 rounded-md">{currentNoteData.myAnswer}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-700">정답</h3>
                            <p className="text-green-600 bg-green-50 p-3 rounded-md">{currentNoteData.correctAnswer}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-700">해설</h3>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{currentNoteData.explanation}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 사용자 메모 입력 */}
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
    );
};

export default IncorrectAnswersPage;
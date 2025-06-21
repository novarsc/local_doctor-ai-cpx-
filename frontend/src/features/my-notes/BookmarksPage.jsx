/**
 * @file BookmarksPage.jsx
 * @description Page for viewing and managing bookmarked scenarios.
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBookmarks } from '../../store/slices/myNotesSlice';

const BookmarksPage = () => {
    const dispatch = useDispatch();
    const { bookmarks, status, error } = useSelector((state) => state.myNotes);

    useEffect(() => {
        dispatch(fetchBookmarks());
    }, [dispatch]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6 text-gray-800">즐겨찾는 증례</h1>
            
            {status.bookmarks === 'loading' && <p>즐겨찾기 목록을 불러오는 중...</p>}
            {error && <p className="text-red-500">오류가 발생했습니다: {error}</p>}
            
            {status.bookmarks === 'succeeded' && bookmarks.length === 0 && (
                <div className="text-center py-20 bg-white rounded-lg shadow">
                    <p className="text-gray-500 text-lg">아직 즐겨찾기한 증례가 없습니다.</p>
                    <p className="text-sm text-gray-400 mt-2">증례 목록에서 별표를 눌러 중요한 증례를 추가해보세요.</p>
                </div>
            )}

            {status.bookmarks === 'succeeded' && bookmarks.length > 0 && (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookmarks.map(scenario => (
                        <div key={scenario.scenarioId} className="bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between transition hover:shadow-xl hover:-translate-y-1">
                            <div>
                                <p className="text-sm text-blue-600 font-semibold">{scenario.primaryCategory} &gt; {scenario.secondaryCategory}</p>
                                <h2 className="font-bold text-xl my-2 text-gray-900">{scenario.name}</h2>
                                <p className="text-gray-600 line-clamp-3">{scenario.shortDescription}</p>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <Link to={`/cases/${scenario.scenarioId}/practice`} className="font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-end">
                                    학습하러 가기
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" /></svg>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BookmarksPage;
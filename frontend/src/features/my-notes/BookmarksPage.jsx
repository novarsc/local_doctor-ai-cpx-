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
            <h1 className="text-3xl font-bold mb-6 text-gray-800">즐겨찾기</h1>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                {status.bookmarks === 'loading' && <p className="p-6 text-center text-gray-500">즐겨찾기 목록을 불러오는 중...</p>}
                {status.bookmarks === 'failed' && <p className="p-6 text-center text-red-500">즐겨찾기 목록을 불러오는 데 실패했습니다.</p>}
            
                {status.bookmarks === 'succeeded' && bookmarks.length === 0 && (
                    <p className="p-6 text-center text-gray-500">아직 즐겨찾기한 증례가 없습니다.</p>
                )}

                {status.bookmarks === 'succeeded' && bookmarks.length > 0 && (
                    <div className="divide-y divide-gray-200">
                        {bookmarks.map((scenario) => (
                            <div key={scenario.scenarioId} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                                                {scenario.primaryCategory}
                                            </span>
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                                {scenario.secondaryCategory}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{scenario.name}</h3>
                                        <p className="text-sm text-gray-600 mb-2">
                                            <strong>환자 정보:</strong> {scenario.age}세 {scenario.sex}, {scenario.presentingComplaint}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            즐겨찾기 추가일: {new Date(scenario.bookmarkedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="ml-4 flex flex-col items-end gap-2">
                                        <Link to={`/cases/practice/${scenario.scenarioId}`} className="font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-end">
                                            실습하기 →
                                        </Link>
                                        <button className="text-xs text-red-600 hover:text-red-800">
                                            즐겨찾기 해제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookmarksPage;
/**
 * @file BookmarksPage.jsx
 * @description Page for viewing and managing bookmarked scenarios.
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchBookmarks, removeBookmark } from '../../store/slices/myNotesSlice';

const BookmarksPage = () => {
    const dispatch = useDispatch();
    const { bookmarks, status, error } = useSelector((state) => state.myNotes);
    const [removingBookmarks, setRemovingBookmarks] = useState(new Set());
    const [showModal, setShowModal] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        dispatch(fetchBookmarks());
    }, [dispatch]);

    const handleRemoveBookmark = async (scenarioId) => {
        try {
            setRemovingBookmarks(prev => new Set(prev).add(scenarioId));
            
            // 팝업을 즉시 시작
            setShowModal(true);
            setTimeout(() => {
                setModalVisible(true);
                setTimeout(() => {
                    setModalVisible(false);
                    setTimeout(() => {
                        setShowModal(false);
                    }, 300);
                }, 1000);
            }, 50);
            
            await dispatch(removeBookmark(scenarioId)).unwrap();
        } catch (error) {
            console.error('즐겨찾기 해제 실패:', error);
        } finally {
            setRemovingBookmarks(prev => {
                const newSet = new Set(prev);
                newSet.delete(scenarioId);
                return newSet;
            });
        }
    };
    
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
                            <div 
                                key={scenario.scenarioId} 
                                className={`p-6 hover:bg-gray-50 transition-all duration-300 ${
                                    removingBookmarks.has(scenario.scenarioId) 
                                        ? 'transform translate-x-full opacity-0' 
                                        : 'transform translate-x-0 opacity-100'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-4">
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
                                    </div>
                                    <div className="ml-4 flex flex-col items-end">
                                        <Link to={`/cases/practice/${scenario.scenarioId}`} className="font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-end">
                                            실습하기 →
                                        </Link>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => handleRemoveBookmark(scenario.scenarioId)}
                                        disabled={removingBookmarks.has(scenario.scenarioId)}
                                        className="text-sm text-gray-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                    >
                                        {removingBookmarks.has(scenario.scenarioId) ? '제거 중...' : '목록에서 제거'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 팝업 모달 */}
            {showModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className={`bg-black absolute inset-0 transition-opacity duration-300 ${
                        modalVisible ? 'bg-opacity-50' : 'bg-opacity-0'
                    }`}></div>
                    <div className={`bg-white rounded-lg shadow-xl p-6 mx-4 transform transition-all duration-300 ${
                        modalVisible 
                            ? 'scale-100 opacity-100 translate-y-0' 
                            : 'scale-95 opacity-0 translate-y-4'
                    }`}>
                        <div className="text-center">
                            <div className="text-green-500 text-2xl mb-2">✓</div>
                            <p className="text-gray-800 font-medium">목록에서 제거되었습니다!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookmarksPage;
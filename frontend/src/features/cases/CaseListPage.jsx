/**
 * @file CaseListPage.jsx
 * @description Page component for displaying the list of all scenarios (cases).
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
// 1. caseSlice에서 addBookmark, removeBookmark 액션을 추가로 import 합니다.
import { fetchScenarios, addBookmark, removeBookmark } from '../../store/slices/caseSlice';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner'; // 1. 스피너 import

// 2. 북마크 아이콘을 위한 별도 컴포넌트를 만듭니다.
const BookmarkIcon = ({ isBookmarked, onClick, isLoading }) => {
    const iconColor = isBookmarked ? "text-yellow-400" : "text-gray-300";
    const hoverColor = "hover:text-yellow-500";

    return (
        <button onClick={onClick} disabled={isLoading} className={`transition-colors duration-200 disabled:opacity-50 disabled:cursor-wait ${hoverColor}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-7 w-7 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        </button>
    )
}

const CaseListPage = () => {
    const dispatch = useDispatch();
    const { scenarios, pagination, isLoading, error } = useSelector((state) => state.cases);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        dispatch(fetchScenarios({ page: currentPage, limit: 9, keyword: searchTerm }));
    }, [dispatch, currentPage, searchTerm]);

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        if (pagination && newPage > 0 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
        }
    };

    // 3. 북마크 아이콘 클릭 시 실행될 핸들러 함수를 추가합니다.
    const handleBookmarkToggle = (scenario) => {
        if (scenario.isBookmarked) {
            dispatch(removeBookmark(scenario.scenarioId));
        } else {
            dispatch(addBookmark(scenario.scenarioId));
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-gray-800">증례 라이브러리</h1>
                <p className="text-lg text-gray-600 mt-2">다양한 임상 증례를 통해 실전 감각을 키워보세요.</p>
            </header>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <form onSubmit={handleSearch} className="flex items-center space-x-4">
                    <input
                        type="text"
                        placeholder="증상, 질환명, 키워드로 증례 검색"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-base flex-grow"
                    />
                    <Button type="submit" variant="primary">
                        검색
                    </Button>
                </form>
            </div>

            {/* 2. 기존 로딩 텍스트를 컴포넌트로 교체 */}
            {isLoading && <LoadingSpinner text="증례 목록을 불러오는 중..." />}
            
            {error && <div className="text-center p-10 text-red-500">오류가 발생했습니다: {error}</div>}
            
            {!isLoading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {scenarios.map((scenario) => (
                        <div key={scenario.scenarioId} className="bg-white rounded-xl shadow-lg flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 relative">
                            {/* 4. 북마크 아이콘을 카드 우측 상단에 배치하고, 핸들러를 연결합니다. */}
                            <div className="absolute top-4 right-4 z-10">
                                <BookmarkIcon 
                                    isBookmarked={scenario.isBookmarked} 
                                    onClick={() => handleBookmarkToggle(scenario)}
                                />
                            </div>
                            
                            <div className="p-6">
                                <p className="text-sm font-semibold text-primary">{scenario.primaryCategory} &gt; {scenario.secondaryCategory}</p>
                                <h2 className="text-xl font-bold my-2 text-gray-900 truncate">{scenario.name}</h2>
                                <p className="text-gray-600 h-20 line-clamp-3">{scenario.shortDescription}</p>
                            </div>
                            <div className="mt-auto bg-gray-50 p-4 border-t flex justify-between items-center">
                                <div className="flex items-center">
                                    {scenario.highestScore ? (
                                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                                            최고 {scenario.highestScore}점
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs font-semibold">미학습</span>
                                    )}
                                </div>
                                <Link to={`/cases/${scenario.scenarioId}/practice`}>
                                    <Button variant="secondary" className="!py-1.5 !px-4 text-sm">
                                      실습 시작
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {!isLoading && !error && scenarios.length === 0 && (
                <div className="text-center p-20 bg-white rounded-lg shadow"><p className="text-gray-500">표시할 증례가 없습니다.</p></div>
            )}
            
            <div className="mt-8 flex justify-center">
                {pagination && pagination.totalPages > 1 && (
                    <nav className="flex items-center space-x-2">
                        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={!pagination.hasPrevPage || isLoading} variant="secondary">이전</Button>
                        <span className="font-semibold px-4 py-2">페이지 {currentPage} / {pagination.totalPages}</span>
                        <Button onClick={() => handlePageChange(currentPage + 1)} disabled={!pagination.hasNextPage || isLoading} variant="secondary">다음</Button>
                    </nav>
                )}
            </div>
        </div>
    );
};

export default CaseListPage;
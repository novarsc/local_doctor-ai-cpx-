/**
 * @file CaseListPage.jsx
 * @description Page component for displaying a personalized list of all scenarios with filtering and dynamic categories.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchScenarios, fetchCategories, addBookmark, removeBookmark } from '../../store/slices/caseSlice';
import { fetchBookmarks, fetchLearningHistory } from '../../store/slices/myNotesSlice';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const BookmarkIcon = ({ isBookmarked, onClick, isLoading }) => {
    const iconColor = isBookmarked ? "text-yellow-400" : "text-gray-300";
    const hoverColor = isBookmarked ? "hover:text-yellow-600" : "hover:text-yellow-500";
    return (
        <button 
            onClick={onClick} 
            disabled={isLoading} 
            className={`
                transition-all duration-200 ease-in-out
                disabled:opacity-50 disabled:cursor-wait
                hover:scale-110 hover:drop-shadow-lg
                p-1 rounded-full
                ${hoverColor}
            `}
            title={isBookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-7 w-7 ${iconColor} transition-colors duration-200`} 
                viewBox="0 0 20 20" 
                fill="currentColor"
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        </button>
    );
};

const CaseListPage = () => {
    const dispatch = useDispatch();
    const { scenarios, pagination, categories, isLoading, error } = useSelector((state) => state.cases);
    const { bookmarks, learningHistory: history } = useSelector((state) => state.myNotes);

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(''); 
    const [completionStatus, setCompletionStatus] = useState('all');

    useEffect(() => {
        const handler = setTimeout(() => {
            setCurrentPage(1);
            dispatch(fetchScenarios({ page: 1, search: searchTerm, category: selectedCategory, status: completionStatus }));
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);
    
    useEffect(() => {
        dispatch(fetchScenarios({ page: currentPage, search: searchTerm, category: selectedCategory, status: completionStatus }));
    }, [dispatch, currentPage, selectedCategory, completionStatus]);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchBookmarks());
        dispatch(fetchLearningHistory());
    }, [dispatch]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    
    const handlePageChange = (newPage) => {
        if (pagination && newPage > 0 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
        }
    };
    
    const handleBookmarkToggle = (scenarioId, isBookmarked) => {
        if (isBookmarked) {
            dispatch(removeBookmark(scenarioId));
        } else {
            dispatch(addBookmark(scenarioId));
        }
    };
    
    const personalizedScenarios = useMemo(() => {
        const bookmarkSet = new Set((bookmarks || []).map(b => b.scenarioId));
        const historySet = new Set((history || []).map(h => h.scenarioId));

        return (scenarios || []).map(scenario => ({
            ...scenario,
            isBookmarked: bookmarkSet.has(scenario.scenarioId),
            isCompleted: historySet.has(scenario.scenarioId),
        }));
    }, [scenarios, bookmarks, history]);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-4">전체 증례 목록</h1>
            <p className="text-gray-600 mb-8">다양한 임상 증례를 통해 CPX 실습 능력을 향상시켜 보세요.</p>
            
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center p-4 bg-gray-50 rounded-lg shadow-sm">
                <input
                    type="text"
                    placeholder="증례 검색 (예: 복통, 두통)"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="flex-grow w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <select 
                    value={selectedCategory} 
                    onChange={e => {
                        setCurrentPage(1);
                        setSelectedCategory(e.target.value);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md w-full md:w-auto bg-white"
                >
                    <option value="">전체 카테고리</option>
                    {(categories || []).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <div className="flex space-x-2">
                    <Button 
                        variant={completionStatus === 'all' ? 'primary' : 'secondary'}
                        onClick={() => { setCurrentPage(1); setCompletionStatus('all'); }}
                    >
                        전체
                    </Button>
                    <Button 
                        variant={completionStatus === 'completed' ? 'primary' : 'secondary'}
                        onClick={() => { setCurrentPage(1); setCompletionStatus('completed'); }}
                    >
                        실습 완료
                    </Button>
                    <Button 
                        variant={completionStatus === 'incomplete' ? 'primary' : 'secondary'}
                        onClick={() => { setCurrentPage(1); setCompletionStatus('incomplete'); }}
                    >
                        미완료
                    </Button>
                </div>
            </div>

            {isLoading && <div className="flex justify-center p-20"><LoadingSpinner /></div>}
            
            {error && <div className="text-center p-20 bg-red-50 text-red-600 rounded-lg shadow"><p>오류가 발생했습니다: {error}</p></div>}
            
            {!isLoading && !error && (scenarios || []).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {personalizedScenarios.map((scenario) => (
                        <div key={scenario.scenarioId} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{scenario.primaryCategory}</span>
                                    <BookmarkIcon isBookmarked={scenario.isBookmarked} onClick={() => handleBookmarkToggle(scenario.scenarioId, scenario.isBookmarked)} isLoading={isLoading} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{scenario.name}</h3>
                                <p className="text-gray-600 text-sm mb-4 h-10 overflow-hidden">{scenario.shortDescription}</p>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center rounded-b-lg">
                                <div>
                                    {scenario.isCompleted && <span className="text-sm font-semibold text-green-600">실습 완료</span>}
                                </div>
                                <Link to={`/cases/practice/${scenario.scenarioId}`}>
                                    <Button variant="secondary" className="!py-1.5 !px-4 text-sm">
                                      실습 시작
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {!isLoading && !error && (!scenarios || scenarios.length === 0) && (
                <div className="text-center p-20 bg-white rounded-lg shadow"><p className="text-gray-500">표시할 증례가 없습니다. 다른 검색어나 필터를 사용해 보세요.</p></div>
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
/**
 * @file CaseListPage.jsx
 * @description Page component for displaying a personalized list of all scenarios with filtering and dynamic categories.
 */

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchScenarios, fetchCategories, addBookmark, removeBookmark } from '../../store/slices/caseSlice';
import { fetchBookmarks, fetchLearningHistory } from '../../store/slices/myNotesSlice';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const BookmarkIcon = ({ isBookmarked, onClick, isLoading, disabled }) => {
    const iconColor = isBookmarked ? "text-yellow-400" : "text-gray-300";
    const hoverColor = isBookmarked ? "hover:text-yellow-600" : "hover:text-yellow-500";
    const disabledColor = disabled ? "text-gray-400 cursor-not-allowed" : "";
    
    return (
        <button 
            onClick={onClick} 
            disabled={disabled || isLoading} 
            className={`
                transition-all duration-200 ease-in-out
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:scale-110 hover:drop-shadow-lg
                p-1 rounded-full
                ${disabled ? "" : hoverColor}
                ${disabledColor}
            `}
            title={disabled ? "즐겨찾기 필터가 활성화되어 해제할 수 없습니다" : (isBookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가")}
        >
            <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-7 w-7 ${iconColor} ${disabledColor} transition-colors duration-200`} 
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
    const { scenarios, categories, isLoading, error } = useSelector((state) => state.cases);
    const { bookmarks, learningHistory: history } = useSelector((state) => state.myNotes);
    const scrollContainerRef = useRef(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [status, setStatus] = useState('all');
    const [scrollPosition, setScrollPosition] = useState(0);

    useEffect(() => {
        const handler = setTimeout(() => {
            dispatch(fetchScenarios({ 
                page: 1, 
                limit: 1000, // 모든 증례를 한 번에 가져오기 위해 큰 값 설정
                search: searchTerm, 
                category: selectedCategories.join(','),
                status: status 
            }));
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm, selectedCategories, status, dispatch]);
    
    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchBookmarks());
        dispatch(fetchLearningHistory());
    }, [dispatch]);

    // 스크롤 위치 저장
    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current) {
                setScrollPosition(scrollContainerRef.current.scrollTop);
            }
        };

        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }
    }, []);

    // 필터 변경 시 스크롤 위치 초기화
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
            setScrollPosition(0);
        }
    }, [searchTerm, selectedCategories, status]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // 카테고리 토글 함수 추가
    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev => {
            if (category === '') {
                // "전체" 버튼 클릭 시 모든 카테고리 선택 해제
                return [];
            }
            
            if (prev.includes(category)) {
                // 이미 선택된 카테고리면 제거
                return prev.filter(cat => cat !== category);
            } else {
                // 선택되지 않은 카테고리면 추가
                return [...prev, category];
            }
        });
    };

    // 모든 카테고리 선택/해제 함수
    const handleSelectAllCategories = () => {
        setSelectedCategories(prev => {
            if (prev.length === categories.length) {
                // 모든 카테고리가 선택되어 있으면 모두 해제
                return [];
            } else {
                // 모든 카테고리 선택
                return [...categories];
            }
        });
    };
    
    const handleBookmarkToggle = (scenarioId, isBookmarked) => {
        if (status === 'bookmarked' && isBookmarked) {
            alert('즐겨찾기 필터가 활성화된 상태에서는 즐겨찾기를 해제할 수 없습니다. 다른 필터로 변경 후 시도해주세요.');
            return;
        }
        
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
        <div className="container mx-auto p-4 md:p-8 h-screen flex flex-col">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold mb-4">전체 증례 목록</h1>
                <p className="text-gray-600 mb-8">다양한 임상 증례를 통해 CPX 실습 능력을 향상시켜 보세요.</p>
                
                <div className="mb-6 flex flex-col gap-4">
                    {/* 검색바 */}
                    <div className="flex flex-col md:flex-row gap-4 items-center p-4 bg-gray-50 rounded-lg shadow-sm">
                        <input
                            type="text"
                            placeholder="증례 검색 (예: 복통, 두통)"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="flex-grow w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    {/* 카테고리 필터 버튼들 */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                            <h3 className="text-sm font-medium text-gray-700">카테고리</h3>
                        </div>
                        <div className="p-4 flex flex-wrap gap-2">
                            <Button 
                                variant={selectedCategories.length === 0 ? 'primary' : 'secondary'}
                                onClick={handleSelectAllCategories}
                                className="text-sm"
                            >
                                {selectedCategories.length === categories.length ? '전체 해제' : '전체 선택'}
                            </Button>
                            {(categories || []).map(cat => (
                                <Button 
                                    key={cat}
                                    variant={selectedCategories.includes(cat) ? 'primary' : 'secondary'}
                                    onClick={() => handleCategoryToggle(cat)}
                                    className="text-sm"
                                >
                                    {cat}
                                </Button>
                            ))}
                        </div>
                    </div>
                    
                    {/* 상태 필터 버튼들 */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                            <h3 className="text-sm font-medium text-gray-700">학습 상태</h3>
                        </div>
                        <div className="p-4 flex flex-wrap gap-2">
                            <Button 
                                variant={status === 'all' ? 'primary' : 'secondary'}
                                onClick={() => setStatus('all')}
                                className="text-sm"
                            >
                                전체
                            </Button>
                            <Button 
                                variant={status === 'completed' ? 'primary' : 'secondary'}
                                onClick={() => setStatus('completed')}
                                className="text-sm"
                            >
                                실습 완료
                            </Button>
                            <Button 
                                variant={status === 'incomplete' ? 'primary' : 'secondary'}
                                onClick={() => setStatus('incomplete')}
                                className="text-sm"
                            >
                                미완료
                            </Button>
                            <Button 
                                variant={status === 'bookmarked' ? 'primary' : 'secondary'}
                                onClick={() => setStatus('bookmarked')}
                                className="text-sm"
                            >
                                즐겨찾기
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading && <div className="flex justify-center p-20"><LoadingSpinner /></div>}
            
            {error && <div className="text-center p-20 bg-red-50 text-red-600 rounded-lg shadow"><p>오류가 발생했습니다: {error}</p></div>}
            
            {!isLoading && !error && (scenarios || []).length > 0 && (
                <div 
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto scrollbar-thin scroll-smooth"
                    style={{ 
                        scrollBehavior: 'smooth',
                        boxShadow: scrollPosition > 0 ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                        {personalizedScenarios.map((scenario) => (
                            <div key={scenario.scenarioId} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between transform hover:scale-105">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{scenario.primaryCategory}</span>
                                        <BookmarkIcon 
                                            isBookmarked={scenario.isBookmarked} 
                                            onClick={() => handleBookmarkToggle(scenario.scenarioId, scenario.isBookmarked)} 
                                            isLoading={isLoading}
                                            disabled={status === 'bookmarked' && scenario.isBookmarked}
                                        />
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
                </div>
            )}
            
            {!isLoading && !error && (!scenarios || scenarios.length === 0) && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center p-20 bg-white rounded-lg shadow">
                        <p className="text-gray-500">표시할 증례가 없습니다. 다른 검색어나 필터를 사용해 보세요.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseListPage;
/**
 * @file CaseListPage.jsx
 * @description Page component for displaying a personalized list of all scenarios with filtering and dynamic categories.
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { fetchScenarios, fetchCategories, fetchSubCategories, addBookmark, removeBookmark } from '../../store/slices/caseSlice';
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
                transition-all duration-100 ease-out
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
                className={`h-7 w-7 ${iconColor} ${disabledColor} transition-colors duration-100 ease-out`} 
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
    const { scenarios, categories, subCategories, isLoading, error } = useSelector((state) => state.cases);
    const { bookmarks, learningHistory: history } = useSelector((state) => state.myNotes);
    const location = useLocation();
    const prevLocationRef = useRef(location.pathname);

    // 저장된 필터 설정을 가져오는 함수
    const getInitialFilterSettings = () => {
        const savedSettings = localStorage.getItem('case_list_filter_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                if (settings.timestamp && settings.timestamp > oneDayAgo) {
                    return settings;
                }
            } catch (error) {
                console.error('저장된 필터 설정을 확인하는데 실패했습니다:', error);
            }
        }
        return null;
    };

    const initialSettings = getInitialFilterSettings();

    // 필터링 상태들 - 저장된 값으로 초기화
    const [searchTerm, setSearchTerm] = useState(initialSettings?.searchTerm || '');
    const [selectedCategories, setSelectedCategories] = useState(initialSettings?.selectedCategories || []);
    const [status, setStatus] = useState(initialSettings?.status || 'all');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(initialSettings?.sidebarCollapsed || false);
    const [categoryExpanded, setCategoryExpanded] = useState(initialSettings?.categoryExpanded !== undefined ? initialSettings.categoryExpanded : true);
    const [statusExpanded, setStatusExpanded] = useState(initialSettings?.statusExpanded !== undefined ? initialSettings.statusExpanded : true);
    const [showOriginalNames, setShowOriginalNames] = useState(initialSettings?.showOriginalNames || false);
    const [expandedPrimaryCategories, setExpandedPrimaryCategories] = useState(
        initialSettings?.expandedPrimaryCategories ? new Set(initialSettings.expandedPrimaryCategories) : new Set()
    );
    const [toast, setToast] = useState({ show: false, message: '', type: '', visible: false });
    const [filtersInitialized, setFiltersInitialized] = useState(false);
    const [optimisticBookmarks, setOptimisticBookmarks] = useState(new Map()); // scenarioId -> boolean

    // 필터링 상태 저장 및 복원 함수들
    const saveFilterSettings = () => {
        const settings = {
            searchTerm,
            selectedCategories,
            status,
            sidebarCollapsed,
            categoryExpanded,
            statusExpanded,
            showOriginalNames,
            expandedPrimaryCategories: Array.from(expandedPrimaryCategories),
            timestamp: Date.now()
        };
        localStorage.setItem('case_list_filter_settings', JSON.stringify(settings));
    };

    // 필터 상태가 변경될 때마다 자동 저장
    useEffect(() => {
        saveFilterSettings();
    }, [searchTerm, selectedCategories, status, sidebarCollapsed, categoryExpanded, statusExpanded, showOriginalNames, expandedPrimaryCategories]);

    // 필터 초기화 완료 표시
    useEffect(() => {
        // 초기화를 즉시 완료로 설정하여 불필요한 지연을 방지
        setFiltersInitialized(true);
    }, []);

    const loadFilterSettings = () => {
        const savedSettings = localStorage.getItem('case_list_filter_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                
                // 24시간 이내의 설정만 복원 (너무 오래된 설정은 무시)
                const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
                if (settings.timestamp && settings.timestamp < oneDayAgo) {
                    localStorage.removeItem('case_list_filter_settings');
                    return;
                }

                // 필터 상태 복원을 일괄 처리하여 깜빡임 방지
                const updates = {};
                
                if (settings.searchTerm !== undefined && settings.searchTerm !== '') {
                    updates.searchTerm = settings.searchTerm;
                }
                if (settings.selectedCategories !== undefined && settings.selectedCategories.length > 0) {
                    updates.selectedCategories = settings.selectedCategories;
                }
                if (settings.status !== undefined && settings.status !== 'all') {
                    updates.status = settings.status;
                }
                if (settings.sidebarCollapsed !== undefined) {
                    updates.sidebarCollapsed = settings.sidebarCollapsed;
                }
                if (settings.categoryExpanded !== undefined) {
                    updates.categoryExpanded = settings.categoryExpanded;
                }
                if (settings.statusExpanded !== undefined) {
                    updates.statusExpanded = settings.statusExpanded;
                }
                if (settings.showOriginalNames !== undefined) {
                    updates.showOriginalNames = settings.showOriginalNames;
                }
                if (settings.expandedPrimaryCategories !== undefined && Array.isArray(settings.expandedPrimaryCategories)) {
                    updates.expandedPrimaryCategories = new Set(settings.expandedPrimaryCategories);
                }
                
                // 일괄 업데이트 적용
                if (Object.keys(updates).length > 0) {
                    if (updates.searchTerm !== undefined) setSearchTerm(updates.searchTerm);
                    if (updates.selectedCategories !== undefined) setSelectedCategories(updates.selectedCategories);
                    if (updates.status !== undefined) setStatus(updates.status);
                    if (updates.sidebarCollapsed !== undefined) setSidebarCollapsed(updates.sidebarCollapsed);
                    if (updates.categoryExpanded !== undefined) setCategoryExpanded(updates.categoryExpanded);
                    if (updates.statusExpanded !== undefined) setStatusExpanded(updates.statusExpanded);
                    if (updates.showOriginalNames !== undefined) setShowOriginalNames(updates.showOriginalNames);
                    if (updates.expandedPrimaryCategories !== undefined) setExpandedPrimaryCategories(updates.expandedPrimaryCategories);
                    
                    console.log('필터 설정이 복원되었습니다:', settings);
                }
            } catch (error) {
                console.error('저장된 필터 설정을 불러오는데 실패했습니다:', error);
                localStorage.removeItem('case_list_filter_settings');
            }
        }
    };

    // 라우트 변경 시 필터 설정 복원 - 깜빡임 방지를 위해 조건부 실행
    useEffect(() => {
        const currentPath = location.pathname;
        const prevPath = prevLocationRef.current;
        
        // /cases 경로에 처음 진입하거나 실습 관련 페이지에서 돌아올 때 필터 설정 복원
        if (currentPath === '/cases') {
            // 실습 관련 경로에서 돌아온 경우에만 복원 (초기 로드는 위의 useEffect에서 처리)
            if (prevPath.includes('/cases/practice') || prevPath.includes('/cases/results')) {
                // 이미 초기화된 상태에서만 필터 설정을 복원하여 깜빡임 방지
                if (filtersInitialized) {
                    loadFilterSettings();
                }
            }
        }
        
        prevLocationRef.current = currentPath;
    }, [location.pathname, filtersInitialized]);

    useEffect(() => {
        if (!filtersInitialized) return;
        
        // 디바운스 시간을 줄여서 더 빠른 응답 제공
        const handler = setTimeout(() => {
            dispatch(fetchScenarios({ 
                page: 1, 
                limit: 1000, // 모든 증례를 한 번에 가져오기 위해 큰 값 설정
                search: searchTerm, 
                category: selectedCategories.join(','),
                status: status 
            }));
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, selectedCategories, status, dispatch, filtersInitialized]);
    
    useEffect(() => {
        if (!filtersInitialized) return;
        
        dispatch(fetchCategories());
        dispatch(fetchBookmarks());
        dispatch(fetchLearningHistory());
    }, [dispatch, filtersInitialized]);

    // 즐겨찾기 목록이 업데이트되면 낙관적 업데이트 상태 초기화
    useEffect(() => {
        if (bookmarks) {
            setOptimisticBookmarks(new Map());
        }
    }, [bookmarks]);

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

    // 대분류 카테고리 토글 함수 - 수정된 버전
    const handlePrimaryCategoryToggle = (primaryCategory) => {
        console.log('handlePrimaryCategoryToggle called:', primaryCategory);
        console.log('Current expandedPrimaryCategories:', Array.from(expandedPrimaryCategories));
        
        setExpandedPrimaryCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(primaryCategory)) {
                newSet.delete(primaryCategory);
                console.log('Removing category:', primaryCategory);
            } else {
                newSet.add(primaryCategory);
                console.log('Adding category:', primaryCategory);
                // 중분류 카테고리가 로드되지 않았다면 로드
                if (!subCategories[primaryCategory]) {
                    dispatch(fetchSubCategories(primaryCategory));
                }
            }
            console.log('New expandedPrimaryCategories:', Array.from(newSet));
            return newSet;
        });
    };
    
    const handleBookmarkToggle = useCallback((scenarioId, isBookmarked) => {
        if (status === 'bookmarked' && isBookmarked) {
            setToast({ show: true, message: '즐겨찾기 필터가 활성화된 상태에서는 즐겨찾기를 해제할 수 없습니다.', type: 'error', visible: false });
            // 페이드 인 효과
            setTimeout(() => setToast(prev => ({ ...prev, visible: true })), 10);
            // 페이드 아웃 효과
            setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 800);
            setTimeout(() => setToast({ show: false, message: '', type: '', visible: false }), 1100);
            return;
        }
        
        // 낙관적 업데이트: 즉시 로컬 상태 변경
        setOptimisticBookmarks(prev => {
            const newMap = new Map(prev);
            newMap.set(scenarioId, !isBookmarked); // 현재 상태의 반대값으로 설정
            return newMap;
        });
        
        // 즉시 팝업 표시
        const message = isBookmarked ? '즐겨찾기에서 제거되었습니다.' : '즐겨찾기에 추가되었습니다.';
        setToast({ show: true, message, type: 'success', visible: false });
        
        // 페이드 인 효과
        setTimeout(() => setToast(prev => ({ ...prev, visible: true })), 10);
        // 페이드 아웃 효과
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 800);
        setTimeout(() => setToast({ show: false, message: '', type: '', visible: false }), 1100);
        
        // 서버 요청을 비동기로 처리 (UI 블로킹 방지)
        const performServerRequest = async () => {
            try {
                if (isBookmarked) {
                    await dispatch(removeBookmark(scenarioId)).unwrap();
                } else {
                    await dispatch(addBookmark(scenarioId)).unwrap();
                }
            } catch (error) {
                // 에러 발생 시 낙관적 업데이트 롤백
                setOptimisticBookmarks(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(scenarioId); // 낙관적 업데이트 제거
                    return newMap;
                });
                
                // 에러 팝업 표시
                setToast({ show: true, message: '즐겨찾기 변경에 실패했습니다.', type: 'error', visible: false });
                setTimeout(() => setToast(prev => ({ ...prev, visible: true })), 10);
                setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 800);
                setTimeout(() => setToast({ show: false, message: '', type: '', visible: false }), 1100);
            }
        };
        
        // 즉시 서버 요청 시작
        performServerRequest();
    }, [status, dispatch]);
    
    const personalizedScenarios = useMemo(() => {
        const bookmarkSet = new Set((bookmarks || []).map(b => b.scenarioId));
        const historySet = new Set((history || []).map(h => h.scenarioId));

        let filteredScenarios = (scenarios || []).map(scenario => {
            const isOptimisticallyUpdated = optimisticBookmarks.has(scenario.scenarioId);
            const isServerBookmarked = bookmarkSet.has(scenario.scenarioId);
            
            // 낙관적 업데이트가 있으면 그 값을 사용, 없으면 서버 상태 사용
            const isBookmarked = isOptimisticallyUpdated 
                ? optimisticBookmarks.get(scenario.scenarioId) 
                : isServerBookmarked;
            
            return {
                ...scenario,
                isBookmarked,
                isCompleted: historySet.has(scenario.scenarioId),
            };
        });

        // 학습 상태 필터 적용
        if (status === 'completed') {
            filteredScenarios = filteredScenarios.filter(scenario => scenario.isCompleted);
        } else if (status === 'incomplete') {
            filteredScenarios = filteredScenarios.filter(scenario => !scenario.isCompleted);
        } else if (status === 'bookmarked') {
            filteredScenarios = filteredScenarios.filter(scenario => scenario.isBookmarked);
        }

        return filteredScenarios;
    }, [scenarios, bookmarks, history, status, optimisticBookmarks]);

    // --- 추가: 중분류별로 personalizedScenarios를 그룹화 ---
    const scenariosGroupedBySecondary = useMemo(() => {
        const groups = {};
        (personalizedScenarios || []).forEach((scenario) => {
            const key = scenario.secondaryCategory || '기타';
            if (!groups[key]) groups[key] = [];
            groups[key].push(scenario);
        });
        return groups;
    }, [personalizedScenarios]);

    // --- 추가: scenarioId별로 넘버링 인덱스 맵 생성 ---
    const scenarioNumberingMap = useMemo(() => {
        const map = {};
        Object.entries(scenariosGroupedBySecondary).forEach(([secondary, scenarios]) => {
            scenarios.forEach((scenario, idx) => {
                map[scenario.scenarioId] = idx + 1;
            });
        });
        return map;
    }, [scenariosGroupedBySecondary]);

    // --- 수정: 넘버링 및 상세질환명 스위치 반영한 이름 생성 함수 ---
    const getDisplayName = (scenario) => {
        const secondary = scenario.secondaryCategory || '기타';
        const number = scenarioNumberingMap[scenario.scenarioId] || 1;
        if (showOriginalNames) {
            // 중분류+번호 - 기존이름
            return `${secondary}${number} - ${scenario.name}`;
        } else {
            // 중분류+번호
            return `${secondary}${number}`;
        }
    };

    return (
        <>
            {!filtersInitialized && (
                <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                    <LoadingSpinner text="필터 설정을 불러오는 중..." />
                </div>
            )}
            
            {filtersInitialized && (
                <div className="min-h-screen bg-gray-50">
                    {/* 상단 검색바 */}
                    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex items-center justify-between h-16">
                                {/* 모바일 메뉴 버튼 */}
                                <button
                                    onClick={() => setSidebarOpen(!sidebarOpen)}
                                    className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>

                                {/* 검색바 - 중앙 정렬 */}
                                <div className="flex-1 flex justify-center">
                                    <div className="w-full max-w-2xl">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="증례 검색 (예: 복통, 두통)"
                                                value={searchTerm}
                                                onChange={handleSearchChange}
                                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 우측 여백 - 모바일에서만 */}
                                <div className="w-8 lg:hidden"></div>
                            </div>
                        </div>
                    </div>

                    {/* 설명 텍스트와 질환명 토글 스위치 */}
                    <div className="bg-white border-b border-gray-200 relative">
                        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4">
                            <p className="text-gray-600 text-center">다양한 임상 증례를 통해 CPX 실습 능력을 향상시켜 보세요! 상세질환명을 보시고 싶으시면 우측 스위치를 켜주세요. </p>
                        </div>
                        <div className="absolute right-6 sm:right-10 top-1/2 transform -translate-y-1/2">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">상세 질환명</span>
                                <button
                                    onClick={() => setShowOriginalNames(!showOriginalNames)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                        showOriginalNames ? 'bg-green-600' : 'bg-gray-200'
                                    }`}
                                    role="switch"
                                    aria-checked={showOriginalNames}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            showOriginalNames ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex">
                        {/* 사이드바 */}
                        <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0 transition duration-200 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
                            <div className="h-full flex flex-col">
                                {/* 사이드바 헤더 */}
                                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                    {!sidebarCollapsed && <h2 className="text-lg font-semibold text-gray-900">필터</h2>}
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                            className="hidden lg:block p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                                            title={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setSidebarOpen(false)}
                                            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                                        >
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* 사이드바 내용 */}
                                <div className={`flex-1 overflow-y-auto transition-all duration-200 ${sidebarCollapsed ? 'p-2' : 'p-4'} space-y-6`}>
                                    {/* 카테고리 필터 */}
                                    <div>
                                        {sidebarCollapsed ? (
                                            <div className="flex flex-col items-center space-y-2">
                                                <button
                                                    onClick={() => setCategoryExpanded(!categoryExpanded)}
                                                    className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                    title="카테고리"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                </button>
                                                {categoryExpanded && (
                                                    <div className="flex flex-col items-center space-y-1">
                                                        <button
                                                            onClick={handleSelectAllCategories}
                                                            className={`p-1 rounded text-xs transition-colors ${
                                                                selectedCategories.length === 0 
                                                                    ? 'bg-blue-100 text-blue-700' 
                                                                    : 'text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                            title={selectedCategories.length === categories.length ? '전체 해제' : '전체 선택'}
                                                        >
                                                            전체
                                                        </button>
                                                        {(categories || []).slice(0, 3).map(cat => (
                                                            <button
                                                                key={cat}
                                                                onClick={() => handlePrimaryCategoryToggle(cat)}
                                                                className={`p-1 rounded text-xs transition-colors ${
                                                                    expandedPrimaryCategories.has(cat)
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'text-gray-600 hover:bg-gray-100'
                                                                }`}
                                                                title={cat}
                                                            >
                                                                {cat.slice(0, 2)}
                                                            </button>
                                                        ))}
                                                        {(categories || []).length > 3 && (
                                                            <span className="text-xs text-gray-400">+{categories.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setCategoryExpanded(!categoryExpanded)}
                                                    className="w-full flex items-center justify-between text-sm font-bold text-gray-700 mb-3 hover:text-gray-900 transition-colors"
                                                >
                                                    <span>카테고리</span>
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform duration-200 ${categoryExpanded ? 'rotate-180' : ''}`} 
                                                        fill="none" 
                                                        viewBox="0 0 24 24" 
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                <div className={`space-y-2 transition-all duration-200 overflow-hidden ${categoryExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                    <button
                                                        onClick={handleSelectAllCategories}
                                                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                            selectedCategories.length === 0 
                                                                ? 'bg-blue-100 text-blue-700' 
                                                                : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {selectedCategories.length === categories.length ? '전체 해제' : '전체 선택'}
                                                    </button>
                                                    {(categories || []).map(primaryCat => (
                                                        <div key={primaryCat} className="space-y-1">
                                                            <button
                                                                onClick={() => handlePrimaryCategoryToggle(primaryCat)}
                                                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                                                                    expandedPrimaryCategories.has(primaryCat)
                                                                        ? 'bg-blue-50 text-blue-700'
                                                                        : 'text-gray-600 hover:bg-gray-100'
                                                                }`}
                                                            >
                                                                <span>{primaryCat}</span>
                                                                <svg 
                                                                    className={`w-4 h-4 transition-transform duration-200 ${expandedPrimaryCategories.has(primaryCat) ? 'rotate-90' : ''}`} 
                                                                    fill="none" 
                                                                    viewBox="0 0 24 24" 
                                                                    stroke="currentColor"
                                                                >
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </button>
                                                            {expandedPrimaryCategories.has(primaryCat) && subCategories[primaryCat] && (
                                                                <div className="ml-4 space-y-1">
                                                                    {subCategories[primaryCat].map(subCat => (
                                                                        <button
                                                                            key={subCat}
                                                                            onClick={() => handleCategoryToggle(subCat)}
                                                                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                                                                                selectedCategories.includes(subCat)
                                                                                    ? 'bg-blue-100 text-blue-700'
                                                                                    : 'text-gray-500 hover:bg-gray-50'
                                                                            }`}
                                                                        >
                                                                            {subCat}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* 학습 상태 필터 */}
                                    <div>
                                        {sidebarCollapsed ? (
                                            <div className="flex flex-col items-center space-y-2">
                                                <button
                                                    onClick={() => setStatusExpanded(!statusExpanded)}
                                                    className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                    title="학습 상태"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </button>
                                                {statusExpanded && (
                                                    <div className="flex flex-col items-center space-y-1">
                                                        {[
                                                            { value: 'all', label: '전체', short: '전' },
                                                            { value: 'completed', label: '실습 완료', short: '완' },
                                                            { value: 'incomplete', label: '미완료', short: '미' },
                                                            { value: 'bookmarked', label: '즐겨찾기', short: '즐' }
                                                        ].map(option => (
                                                            <button
                                                                key={option.value}
                                                                onClick={() => setStatus(option.value)}
                                                                className={`p-1 rounded text-xs transition-colors ${
                                                                    status === option.value
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'text-gray-600 hover:bg-gray-100'
                                                                }`}
                                                                title={option.label}
                                                            >
                                                                {option.short}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setStatusExpanded(!statusExpanded)}
                                                    className="w-full flex items-center justify-between text-sm font-bold text-gray-700 mb-3 hover:text-gray-900 transition-colors"
                                                >
                                                    <span>학습 상태</span>
                                                    <svg 
                                                        className={`w-4 h-4 transition-transform duration-200 ${statusExpanded ? 'rotate-180' : ''}`} 
                                                        fill="none" 
                                                        viewBox="0 0 24 24" 
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                <div className={`space-y-2 transition-all duration-200 overflow-hidden ${statusExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                    {[
                                                        { value: 'all', label: '전체' },
                                                        { value: 'completed', label: '실습 완료' },
                                                        { value: 'incomplete', label: '미완료' },
                                                        { value: 'bookmarked', label: '즐겨찾기' }
                                                    ].map(option => (
                                                        <button
                                                            key={option.value}
                                                            onClick={() => setStatus(option.value)}
                                                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                                                status === option.value
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 모바일 오버레이 */}
                        {sidebarOpen && (
                            <div 
                                className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                                onClick={() => setSidebarOpen(false)}
                            ></div>
                        )}

                        {/* 메인 콘텐츠 */}
                        <div className="flex-1 min-w-0">
                            {isLoading && scenarios.length === 0 && (
                                <div className="flex justify-center items-center h-64">
                                    <LoadingSpinner text="증례를 불러오는 중..." />
                                </div>
                            )}
                            
                            {error && (
                                <div className="text-center p-20 bg-red-50 text-red-600 rounded-lg m-4">
                                    <p>오류가 발생했습니다: {error}</p>
                                </div>
                            )}
                            
                            {!error && (personalizedScenarios || []).length > 0 && (
                                <div className="p-4 sm:p-6 lg:p-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                                        {/* 카드 리스트 렌더링 부분 수정: personalizedScenarios.map -> 중분류 그룹 순회 */}
                                        {Object.entries(scenariosGroupedBySecondary).flatMap(([secondary, scenarios]) =>
                                            scenarios.map((scenario) => (
                                                <div key={scenario.scenarioId} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                                                    {/* 썸네일 영역 - 환자 설명 */}
                                                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                                                        <div className="text-center w-full">
                                                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-800 leading-relaxed line-clamp-4">
                                                                {scenario.shortDescription}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* 콘텐츠 영역 */}
                                                    <div className="p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                                                                {getDisplayName(scenario)}
                                                            </h3>
                                                            <BookmarkIcon 
                                                                isBookmarked={scenario.isBookmarked} 
                                                                onClick={() => handleBookmarkToggle(scenario.scenarioId, scenario.isBookmarked)} 
                                                                isLoading={isLoading}
                                                                disabled={status === 'bookmarked' && scenario.isBookmarked}
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {scenario.primaryCategory}
                                                            </span>
                                                            {scenario.secondaryCategory && (
                                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 ml-2">
                                                                    {scenario.secondaryCategory}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* 상태 및 버튼 */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                {scenario.isCompleted ? (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                        실습 완료
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                        </svg>
                                                                        미완료
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <Link to={`/cases/practice/${scenario.scenarioId}`}>
                                                                <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                                                                    실습 시작
                                                                </button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {!error && (!personalizedScenarios || personalizedScenarios.length === 0) && !isLoading && (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">표시할 증례가 없습니다</h3>
                                        <p className="mt-1 text-sm text-gray-500">다른 검색어나 필터를 사용해 보세요.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 푸터 - 모든 콘텐츠가 로드된 후에만 표시 */}
                    {!error && personalizedScenarios && personalizedScenarios.length > 0 && (
                        <footer className="bg-white border-t border-gray-200 mt-8">
                            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">
                                        총 {personalizedScenarios.length}개의 증례를 모두 확인했습니다.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        © 2024 AI CPX Tutor. 모든 권리 보유.
                                    </p>
                                </div>
                            </div>
                        </footer>
                    )}

                    {/* 토스트 팝업 */}
                    {toast.show && (
                        <div className={`fixed top-20 right-6 z-50 transition-all duration-300 ease-in-out transform ${
                            toast.visible 
                                ? 'opacity-100 scale-100 translate-x-0' 
                                : 'opacity-0 scale-95 translate-x-4'
                        }`}>
                            <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${
                                toast.type === 'success' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-red-500 text-white'
                            }`}>
                                {toast.type === 'success' ? (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                )}
                                <span className="text-sm font-medium">{toast.message}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default CaseListPage;
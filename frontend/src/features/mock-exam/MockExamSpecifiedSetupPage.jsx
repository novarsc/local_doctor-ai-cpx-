/**
 * @file MockExamSpecifiedSetupPage.jsx
 * @description Page for setting up a specified mock exam by selecting cases.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCases, startNewMockExam, setCaseSelection } from '../../store/slices/mockExamSlice';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MockExamSpecifiedSetupPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { categories, status, error, caseSelection } = useSelector(state => state.mockExam);
    
    const [selectedCases, setSelectedCases] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [selectedMiddleCategories, setSelectedMiddleCategories] = useState([]);
    const [expandedMiddleCategories, setExpandedMiddleCategories] = useState([]);
    const [middleCategoryCounts, setMiddleCategoryCounts] = useState({});

    // 진입 시 Redux에 저장된 선택 상태가 있으면 복원
    useEffect(() => {
        if (caseSelection && (caseSelection.selectedCases.length > 0 || caseSelection.selectedMiddleCategories.length > 0)) {
            setSelectedCases(caseSelection.selectedCases || []);
            setSelectedMiddleCategories(caseSelection.selectedMiddleCategories || []);
            setMiddleCategoryCounts(caseSelection.middleCategoryCounts || {});
        }
    }, [caseSelection]);

    // 케이스 목록 로드
    useEffect(() => {
        if (!categories) {
            dispatch(fetchCases());
        }
    }, [dispatch, categories]);

    // 검색 결과 필터링
    const filteredCategories = useMemo(() => {
        if (!categories || !searchTerm.trim()) {
            return categories;
        }

        const searchLower = searchTerm.toLowerCase();
        const filtered = {};

        Object.entries(categories).forEach(([primaryCategory, cases]) => {
            const matchingCases = cases.filter(caseItem =>
                caseItem.name.toLowerCase().includes(searchLower) ||
                caseItem.secondaryCategory.toLowerCase().includes(searchLower)
            );

            if (matchingCases.length > 0) {
                filtered[primaryCategory] = matchingCases;
            }
        });

        return filtered;
    }, [categories, searchTerm]);

    // 검색 결과 목록 생성
    const allSearchResults = useMemo(() => {
        if (!categories || !searchTerm.trim()) {
            return [];
        }

        const searchLower = searchTerm.toLowerCase();
        const results = [];

        Object.entries(categories).forEach(([primaryCategory, cases]) => {
            cases.forEach(caseItem => {
                if (caseItem.name.toLowerCase().includes(searchLower) ||
                    caseItem.secondaryCategory.toLowerCase().includes(searchLower)) {
                    results.push({
                        primaryCategory,
                        caseItem,
                        displayText: `${primaryCategory} > ${caseItem.secondaryCategory} > ${caseItem.name}`
                    });
                }
            });
        });

        return results;
    }, [categories, searchTerm]);

    // 카테고리 확장/축소 토글
    const toggleCategory = (primaryCategory) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(primaryCategory)) {
            newExpanded.delete(primaryCategory);
        } else {
            newExpanded.add(primaryCategory);
        }
        setExpandedCategories(newExpanded);
    };

    // 케이스 선택/해제
    const toggleCase = (caseItem) => {
        setSelectedCases(prev => {
            if (prev.find(c => c.scenarioId === caseItem.scenarioId)) {
                return prev.filter(c => c.scenarioId !== caseItem.scenarioId);
            } else if (prev.length < 6) {
                return [...prev, caseItem];
            }
            return prev;
        });
    };

    // 중복 선택 방지를 위한 함수
    const isAlreadySelected = (scenarioId) => {
        return selectedCases.find(c => c.scenarioId === scenarioId);
    };

    // 검색어 변경 핸들러
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setShowSearchResults(value.trim().length > 0);
    };

    // 검색 결과에서 선택 (중복 방지 포함)
    const handleSearchResultSelect = (caseItem) => {
        // 이미 선택된 경우 선택하지 않음
        if (isAlreadySelected(caseItem.scenarioId)) {
            return;
        }
        
        toggleCase(caseItem);
        setSearchTerm('');
        setShowSearchResults(false);
    };

    // 엔터키 처리 (중복 방지 포함)
    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter' && allSearchResults.length > 0) {
            e.preventDefault();
            // 첫 번째 선택 가능한 검색 결과 선택
            const firstSelectableResult = allSearchResults.find(result => 
                !isAlreadySelected(result.caseItem.scenarioId)
            );
            
            if (firstSelectableResult) {
                handleSearchResultSelect(firstSelectableResult.caseItem);
            }
        }
    };

    // 검색 결과 클릭 시 해당 카테고리 확장 (중복 방지 포함)
    const handleSearchResultClick = (primaryCategory, caseItem) => {
        // 이미 선택된 경우 선택하지 않음
        if (isAlreadySelected(caseItem.scenarioId)) {
            return;
        }
        
        // 해당 대분류 확장
        if (!expandedCategories.has(primaryCategory)) {
            setExpandedCategories(prev => new Set([...prev, primaryCategory]));
        }
        
        // 케이스 선택
        handleSearchResultSelect(caseItem);
    };

    // 중분류별로 케이스를 그룹핑하는 함수
    const getMiddleCategoryGroups = (cases) => {
        const groups = {};
        cases.forEach((caseItem) => {
            if (!groups[caseItem.secondaryCategory]) {
                groups[caseItem.secondaryCategory] = [];
            }
            groups[caseItem.secondaryCategory].push(caseItem);
        });
        return groups;
    };

    // 중분류별로 n개 랜덤 케이스 뽑기
    const getRandomCasesFromMiddleCategories = (categories, selectedMiddleCategories, middleCategoryCounts) => {
        const selected = [];
        Object.entries(categories).forEach(([primaryCategory, cases]) => {
            const groups = {};
            cases.forEach((caseItem) => {
                if (!groups[caseItem.secondaryCategory]) {
                    groups[caseItem.secondaryCategory] = [];
                }
                groups[caseItem.secondaryCategory].push(caseItem);
            });
            selectedMiddleCategories.forEach((middleCategory) => {
                if (groups[middleCategory]) {
                    const groupCases = [...groups[middleCategory]];
                    const n = Math.min(
                        middleCategoryCounts[middleCategory] || 1,
                        groupCases.length
                    );
                    // 랜덤 n개 추출
                    for (let i = 0; i < n; i++) {
                        if (groupCases.length === 0) break;
                        const randomIdx = Math.floor(Math.random() * groupCases.length);
                        selected.push(groupCases[randomIdx]);
                        groupCases.splice(randomIdx, 1);
                    }
                }
            });
        });
        return selected;
    };

    // 모의고사 시작
    const handleStartExam = () => {
        // 1. 중분류 선택분에서 n개씩 랜덤으로 뽑기
        const middleCategoryCases = getRandomCasesFromMiddleCategories(categories, selectedMiddleCategories, middleCategoryCounts);
        // 2. 개별 선택분과 합치기(중복 제거)
        const allSelected = [...middleCategoryCases, ...selectedCases].filter((caseItem, idx, arr) =>
            arr.findIndex(c => c.scenarioId === caseItem.scenarioId) === idx
        );
        // 3. 6개 미만이면, 나머지는 전체 pool에서 랜덤으로 채움(중복 없이)
        let finalCases = [...allSelected];
        if (finalCases.length < 6) {
            // 전체 케이스 pool 만들기
            const allCases = Object.values(categories).flat();
            // 중복/이미 선택된 것 제외
            const remainingPool = allCases.filter(
                c => !finalCases.some(sel => sel.scenarioId === c.scenarioId)
            );
            // 랜덤하게 남은 자리만큼 뽑기
            while (finalCases.length < 6 && remainingPool.length > 0) {
                const idx = Math.floor(Math.random() * remainingPool.length);
                finalCases.push(remainingPool[idx]);
                remainingPool.splice(idx, 1);
            }
        }
        // 4. 6개 초과면 앞에서 6개만
        finalCases = finalCases.slice(0, 6);
        // 선택 상태 Redux에 저장
        dispatch(setCaseSelection({
            selectedCases,
            selectedMiddleCategories,
            middleCategoryCounts
        }));
        const examConfig = {
            examType: 'specified',
            specifiedCases: finalCases.map(c => c.scenarioId)
        };
        dispatch(startNewMockExam(examConfig))
            .unwrap()
            .then((session) => {
                if (session && session.mockExamSessionId) {
                    navigate(`/mock-exams/pre-practice/${session.mockExamSessionId}/1`);
                } else {
                    alert("모의고사 세션을 생성했지만, 세션 ID를 받지 못했습니다. 다시 시도해 주세요.");
                }
            })
            .catch((err) => {
                console.error('Failed to start specified mock exam:', err);
                alert(`모의고사 시작에 실패했습니다: ${err}`);
            });
    };

    if (status === 'loading' && !categories) {
        return <div className="flex items-center justify-center h-screen"><LoadingSpinner text="증례 목록을 불러오는 중입니다..."/></div>;
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 className="text-red-800 font-semibold">오류 발생</h2>
                    <p className="text-red-600">{error}</p>
                    <Button 
                        onClick={() => navigate('/mock-exams')}
                        className="mt-4"
                    >
                        모의고사 홈으로 돌아가기
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
            {/* 헤더: h1 + 메인으로 돌아가기 버튼 */}
            <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-4xl font-bold text-gray-800">지정 모의고사 증례 선택</h1>
                <button
                    onClick={() => navigate('/mock-exams')}
                    className="flex items-center border border-blue-500 text-blue-700 hover:bg-blue-50 hover:border-blue-600 focus:ring-2 focus:ring-blue-200 font-semibold rounded-lg px-4 py-2 transition-colors duration-150 shadow-sm bg-white"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                    모의고사 메인으로 돌아가기
                </button>
            </header>
            <p className="text-lg text-gray-600 mt-2">
                응시하고 싶은 증례를 최대 6개까지 선택해주세요.
            </p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                    <strong>안내:</strong> 최종적으로 6개의 증례가 선정되며, 같은 주요 질환 계통(대분류)에서도 선택이 가능합니다. 
                    선택하지 않은 증례는 나머지 질환 계통에서 랜덤으로 출제되며, 6개 이상 선택시 먼저 선택한 증례들로 출제됩니다.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* 케이스 선택 영역 */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800">증례 선택</h2>
                        
                        {/* 검색 입력 필드 */}
                        <div className="mb-6 relative">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="증례명을 검색하세요 (예: 복통, 두통, 흉통)"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    onKeyPress={handleSearchKeyPress}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => {
                                            setSearchTerm('');
                                            setShowSearchResults(false);
                                        }}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            
                            {/* 검색 결과 드롭다운 */}
                            {showSearchResults && allSearchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {allSearchResults.map((result, index) => {
                                        const isSelected = isAlreadySelected(result.caseItem.scenarioId);
                                        return (
                                            <button
                                                key={`${result.primaryCategory}-${result.caseItem.scenarioId}`}
                                                onClick={() => handleSearchResultClick(result.primaryCategory, result.caseItem)}
                                                disabled={isSelected}
                                                className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                                                    isSelected 
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                                        : 'hover:bg-blue-50 text-gray-700 cursor-pointer'
                                                }`}
                                            >
                                                <div className="font-medium">{result.caseItem.name}</div>
                                                <div className="text-sm text-gray-500">{result.primaryCategory} &gt; {result.caseItem.secondaryCategory}</div>
                                                {isSelected && (
                                                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                                                        <span className="mr-1">✓</span>
                                                        이미 선택됨
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {/* 검색 결과가 없을 때 */}
                            {showSearchResults && searchTerm.trim() && allSearchResults.length === 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
                                    검색 결과가 없습니다.
                                </div>
                            )}
                        </div>

                        {/* 검색어가 있을 때 필터링된 결과만 표시 */}
                        {searchTerm.trim() && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-yellow-800 text-sm">
                                    <strong>검색 결과:</strong> "{searchTerm}"에 대한 필터링된 증례만 표시됩니다.
                                </p>
                            </div>
                        )}

                        {/* 케이스 목록 */}
                        {filteredCategories && Object.entries(filteredCategories).map(([primaryCategory, cases]) => (
                            <div key={primaryCategory} className="mb-6">
                                <button
                                    onClick={() => toggleCategory(primaryCategory)}
                                    className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <span className="font-semibold text-gray-800">{primaryCategory}</span>
                                    <span className="text-gray-600">
                                        {expandedCategories.has(primaryCategory) ? '▼' : '▶'}
                                    </span>
                                </button>
                                
                                {expandedCategories.has(primaryCategory) && (
                                    <div className="mt-2 ml-4 space-y-2">
                                        {/* 중분류별 그룹핑 */}
                                        {Object.entries(getMiddleCategoryGroups(cases)).map(([middleCategory, groupCases]) => {
                                            const isExpanded = expandedMiddleCategories.includes(middleCategory);
                                            const n = middleCategoryCounts[middleCategory] || 1;
                                            // 전체 중분류 n값 합계 계산
                                            const totalMiddleCount = Object.entries(middleCategoryCounts).reduce((sum, [cat, val]) =>
                                                selectedMiddleCategories.includes(cat) ? sum + val : sum, 0
                                            );
                                            return (
                                                <div key={middleCategory} className="mb-2">
                                                    <div className="flex items-center">
                                                        <label className="flex items-center p-2 bg-gray-50 rounded cursor-pointer flex-1">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedMiddleCategories.includes(middleCategory)}
                                                                onChange={() => {
                                                                    setSelectedMiddleCategories((prev) =>
                                                                        prev.includes(middleCategory)
                                                                            ? prev.filter((cat) => cat !== middleCategory)
                                                                            : [...prev, middleCategory]
                                                                    );
                                                                    // 체크 해제 시 n값도 1로 초기화
                                                                    setMiddleCategoryCounts((prev) => {
                                                                        const copy = { ...prev };
                                                                        if (!selectedMiddleCategories.includes(middleCategory)) {
                                                                            copy[middleCategory] = 1;
                                                                        } else {
                                                                            delete copy[middleCategory];
                                                                        }
                                                                        return copy;
                                                                    });
                                                                }}
                                                                className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                            />
                                                            <span className="font-semibold text-green-700">{middleCategory}</span>
                                                            <span className="ml-2 text-xs text-gray-400">({groupCases.length}개)</span>
                                                            {/* n값 입력 UI */}
                                                            {selectedMiddleCategories.includes(middleCategory) && (
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={Math.min(groupCases.length, 6 - (totalMiddleCount - n))}
                                                                    value={n}
                                                                    onChange={e => {
                                                                        let value = parseInt(e.target.value, 10);
                                                                        if (isNaN(value) || value < 1) value = 1;
                                                                        if (value > groupCases.length) value = groupCases.length;
                                                                        // 전체 합이 6을 넘지 않도록 제한
                                                                        const otherTotal = totalMiddleCount - n;
                                                                        if (value + otherTotal > 6) value = 6 - otherTotal;
                                                                        setMiddleCategoryCounts(prev => ({ ...prev, [middleCategory]: value }));
                                                                    }}
                                                                    className="ml-2 w-14 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                                                                    style={{ minWidth: 0 }}
                                                                />
                                                            )}
                                                            {selectedMiddleCategories.includes(middleCategory) && (
                                                                <span className="ml-1 text-xs text-gray-500">개</span>
                                                            )}
                                                        </label>
                                                        <button
                                                            type="button"
                                                            className="ml-2 text-gray-500 hover:text-gray-700 text-lg focus:outline-none"
                                                            onClick={() => {
                                                                setExpandedMiddleCategories((prev) =>
                                                                    prev.includes(middleCategory)
                                                                        ? prev.filter((cat) => cat !== middleCategory)
                                                                        : [...prev, middleCategory]
                                                                );
                                                            }}
                                                            aria-label={isExpanded ? '질환명 접기' : '질환명 펼치기'}
                                                        >
                                                            {isExpanded ? '▼' : '▶'}
                                                        </button>
                                                    </div>
                                                    {/* 중분류가 펼쳐져 있으면 해당 케이스 목록도 보여줌 */}
                                                    {isExpanded && (
                                                        <div className="ml-6 mt-1 space-y-1">
                                                            {groupCases.map((caseItem) => (
                                                                <label key={caseItem.scenarioId} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isAlreadySelected(caseItem.scenarioId)}
                                                                        onChange={() => toggleCase(caseItem)}
                                                                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                        disabled={selectedMiddleCategories.includes(middleCategory)}
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="text-gray-700 font-medium">{caseItem.name}</div>
                                                                    </div>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 선택 요약 및 시작 버튼 */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-lg sticky top-6">
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">선택 요약</h3>
                        
                        <div className="mb-6">
                            <p className="text-sm text-gray-600 mb-2">
                                선택된 증례: <span className="font-semibold text-blue-600">{Object.entries(middleCategoryCounts).reduce((sum, [cat, val]) => selectedMiddleCategories.includes(cat) ? sum + val : sum, 0) + selectedCases.length}/6</span>
                            </p>
                            
                            {/* 중분류 선택 요약 */}
                            {selectedMiddleCategories.length > 0 && (
                                <div className="mb-2">
                                    <div className="text-xs text-green-700 font-semibold">중분류 선택:</div>
                                    <ul className="list-disc ml-5 text-green-700 text-xs">
                                        {selectedMiddleCategories.map((cat) => (
                                            <li key={cat}>{cat} <span className="text-gray-500">({middleCategoryCounts[cat] || 1}개)</span></li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {/* 개별 케이스 선택 요약 */}
                            {selectedCases.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedCases.map((caseItem) => (
                                        <div key={caseItem.scenarioId} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="text-sm text-blue-800 font-medium">{caseItem.name}</div>
                                                <div className="text-xs text-blue-600">{caseItem.secondaryCategory}</div>
                                            </div>
                                            <button
                                                onClick={() => toggleCase(caseItem)}
                                                className="text-blue-600 hover:text-blue-800 text-sm ml-2"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">선택된 증례가 없습니다.</p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={handleStartExam}
                                disabled={status === 'loading'}
                                className="w-full"
                            >
                                {status === 'loading' ? '모의고사 준비 중...' : '선택 완료 및 모의고사 시작'}
                            </Button>
                            
                            <Button
                                onClick={() => navigate('/mock-exams')}
                                variant="outline"
                                className="w-full"
                            >
                                취소
                            </Button>
                        </div>

                        {selectedCases.length === 0 && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-yellow-800 text-sm">
                                    아무것도 선택하지 않으면 랜덤 모의고사와 동일하게 진행됩니다.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MockExamSpecifiedSetupPage; 
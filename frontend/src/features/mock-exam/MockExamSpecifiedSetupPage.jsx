/**
 * @file MockExamSpecifiedSetupPage.jsx
 * @description Page for setting up a specified mock exam by selecting secondary categories.
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchSecondaryCategories, startNewMockExam } from '../../store/slices/mockExamSlice';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const MockExamSpecifiedSetupPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { categories, status, error } = useSelector(state => state.mockExam);
    
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState(new Set());

    // 중분류 목록 로드
    useEffect(() => {
        if (!categories) {
            dispatch(fetchSecondaryCategories());
        }
    }, [dispatch, categories]);

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

    // 중분류 선택/해제
    const toggleSecondaryCategory = (secondaryCategory) => {
        setSelectedCategories(prev => {
            if (prev.includes(secondaryCategory)) {
                return prev.filter(cat => cat !== secondaryCategory);
            } else if (prev.length < 6) {
                return [...prev, secondaryCategory];
            }
            return prev;
        });
    };

    // 모의고사 시작
    const handleStartExam = () => {
        const examConfig = {
            examType: 'specified',
            specifiedCategories: selectedCategories
        };

        dispatch(startNewMockExam(examConfig))
            .unwrap()
            .then((session) => {
                if (session && session.mockExamSessionId) {
                    navigate(`/mock-exams/live/${session.mockExamSessionId}/1`);
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
        return <div className="flex items-center justify-center h-screen"><LoadingSpinner text="증례 분류를 불러오는 중입니다..."/></div>;
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
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800">지정 모의고사 증례 선택</h1>
                <p className="text-lg text-gray-600 mt-2">
                    응시하고 싶은 증례의 중분류를 최대 6개까지 선택해주세요.
                </p>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-blue-800 text-sm">
                        <strong>안내:</strong> 최종적으로 6개의 증례가 선정되며, 각 증례는 서로 다른 주요 질환 계통(대분류)에 속해야 합니다. 
                        선택하지 않은 증례는 나머지 질환 계통에서 랜덤으로 출제됩니다.
                    </p>
                </div>
            </header>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* 중분류 선택 영역 */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold mb-6 text-gray-800">증례 중분류 선택</h2>
                        
                        {categories && Object.entries(categories).map(([primaryCategory, secondaryCategories]) => (
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
                                        {secondaryCategories.map((secondaryCategory) => (
                                            <label key={secondaryCategory} className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(secondaryCategory)}
                                                    onChange={() => toggleSecondaryCategory(secondaryCategory)}
                                                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <span className="text-gray-700">{secondaryCategory}</span>
                                            </label>
                                        ))}
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
                                선택된 중분류: <span className="font-semibold text-blue-600">{selectedCategories.length}/6</span>
                            </p>
                            
                            {selectedCategories.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedCategories.map((category) => (
                                        <div key={category} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                            <span className="text-sm text-blue-800">{category}</span>
                                            <button
                                                onClick={() => toggleSecondaryCategory(category)}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">선택된 중분류가 없습니다.</p>
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

                        {selectedCategories.length === 0 && (
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
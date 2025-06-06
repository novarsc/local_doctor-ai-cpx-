/**
 * @file CaseListPage.jsx
 * @description Page component for displaying the list of all scenarios (cases).
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom'; // Import Link
import { fetchScenarios } from '../../store/slices/caseSlice';

const CaseListPage = () => {
  const dispatch = useDispatch();
  const { scenarios, pagination, isLoading, error } = useSelector((state) => state.cases);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Fetch scenarios when the component mounts or when currentPage changes
    dispatch(fetchScenarios({ page: currentPage, keyword: searchTerm }));
  }, [dispatch, currentPage, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    dispatch(fetchScenarios({ page: 1, keyword: searchTerm }));
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-2">증례 라이브러리 (실습)</h1>
      <p className="text-gray-600 mb-6">다양한 증례를 통해 실전 감각을 키워보세요.</p>

      {/* Search and Filter Section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="임상 증상, 시스템 또는 키워드로 증례 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
          >
            검색
          </button>
        </form>
        {/* TODO: Add dropdown filters for categories */}
      </div>

      {/* Scenarios Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">증례명</th>
              <th scope="col" className="px-6 py-3">환자의 한 마디</th>
              <th scope="col" className="px-6 py-3">대분류</th>
              <th scope="col" className="px-6 py-3">중분류</th>
              <th scope="col" className="px-6 py-3">최고 점수</th>
              <th scope="col" className="px-6 py-3">작업</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan="6" className="text-center p-6">로딩 중...</td></tr>}
            {error && <tr><td colSpan="6" className="text-center p-6 text-red-500">{error}</td></tr>}
            {!isLoading && !error && scenarios.map((scenario) => (
              <tr key={scenario.scenarioId} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{scenario.name}</td>
                <td className="px-6 py-4">{scenario.shortDescription}</td>
                <td className="px-6 py-4">{scenario.primaryCategory}</td>
                <td className="px-6 py-4">{scenario.secondaryCategory}</td>
                <td className="px-6 py-4">{scenario.highestScore ? `${scenario.highestScore}점` : 'N/A'}</td>
                <td className="px-6 py-4">
                  {/* Updated button to link to the pre-practice page */}
                  <Link to={`/cases/${scenario.scenarioId}/practice`} className="font-medium text-blue-600 hover:underline">
                    실습 시작
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* TODO: Implement Pagination Component */}
      <div className="mt-6 flex justify-center">
        {/* Pagination controls will go here */}
      </div>
    </div>
  );
};

export default CaseListPage;

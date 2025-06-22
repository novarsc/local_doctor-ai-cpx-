import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// [수정] import 경로 변경
import { fetchMyStats } from '../../store/slices/userSettingsSlice';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProgressBar from '../../components/common/ProgressBar';

// MOCK 데이터 제거
// const mockStatsData = { ... };

const StatisticsTabPage = () => {
  const dispatch = useDispatch();
  // rootReducer에 'myPage' 키로 등록했으므로 state.myPage로 접근
  const { stats, status, error } = useSelector((state) => state.myPage);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchMyStats());
    }
  }, [status, dispatch]);

  if (status === 'loading' || status === 'idle') {
    return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
  }

  if (status === 'failed') {
    return <div className="text-red-500 p-4 bg-red-100 rounded-md">오류가 발생했습니다: {error?.message || 'Unknown error'}</div>;
  }

  // stats 객체가 null이 아닌지 확인
  if (!stats) {
    return <div className="text-center p-4">통계 데이터가 없습니다.</div>;
  }

  return (
    <div className="space-y-8">
      {/* 요약 지표 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">총 학습 시간</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudyMinutes}분</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">완료 증례 수</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completedCases.count} / {stats.completedCases.total}개</p>
          {stats.completedCases.total > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>진행률</span>
                <span>{Math.round((stats.completedCases.count / stats.completedCases.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.completedCases.count / stats.completedCases.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">전체 평균 점수</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.overallAverageScore}점</p>
        </div>
      </div>

      {/* 분류별 성취도 섹션 */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">분류별 성취도</h3>
        <div className="space-y-4 p-6 bg-white rounded-lg shadow">
          {stats.performanceByCategory && stats.performanceByCategory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.performanceByCategory.map((item) => (
                <div key={item.category} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">{item.category}</h4>
                    <span className="text-xs text-gray-500">
                      {item.completedCount}/{item.totalCount}
                    </span>
                  </div>
                  
                  {/* 완료율 프로그레스 바 */}
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>완료율</span>
                      <span>{item.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* 평균 점수 */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">평균 점수</span>
                    <span className={`text-sm font-bold ${
                      item.averageScore >= 80 ? 'text-green-600' :
                      item.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {item.completedCount > 0 ? `${item.averageScore}점` : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">아직 분류별 성취도 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsTabPage;
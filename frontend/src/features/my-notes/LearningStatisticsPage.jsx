import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyStats } from '../../store/slices/userSettingsSlice'; // 기존 로직을 유지
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProgressBar from '../../components/common/ProgressBar';

const LearningStatisticsPage = () => {
  const dispatch = useDispatch();
  // 참고: 기존 StatisticsTabPage.jsx의 useSelector 로직을 그대로 사용합니다.
  // state.myPage가 아닌 다른 slice에 통계가 있다면 이 부분을 수정해야 합니다.
  const { stats, status, error } = useSelector((state) => state.myPage);

  useEffect(() => {
    // 페이지가 로드될 때 통계 데이터가 없으면 불러옵니다.
    if (status === 'idle') {
      dispatch(fetchMyStats());
    }
  }, [status, dispatch]);

  if (status === 'loading' || status === 'idle') {
    return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
  }

  if (status === 'failed') {
    return <div className="text-red-500 p-4 bg-red-100 rounded-md">오류가 발생했습니다: {error?.message || 'Unknown error'}</div>;
  }

  if (!stats) {
    return <div className="text-center p-4">통계 데이터가 없습니다.</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">나의 학습 통계</h1>

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
            <ProgressBar percentage={(stats.completedCases.count / stats.completedCases.total) * 100} />
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
            stats.performanceByCategory.map((item) => (
              <div key={item.category}>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-gray-700">{item.category}</span>
                  <span className="text-gray-600">{item.averageScore}점</span>
                </div>
                <ProgressBar percentage={item.averageScore} />
              </div>
            ))
          ) : (
            <p className="text-gray-500">아직 분류별 성취도 데이터가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearningStatisticsPage;
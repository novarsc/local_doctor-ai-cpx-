// 생성할 파일 경로: frontend/src/store/slices/dashboardSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../services/apiClient';

// 백엔드 API를 호출하는 비동기 Thunk 액션
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/dashboard/summary');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || '대시보드 데이터를 불러오는데 실패했습니다.');
    }
  }
);

const initialState = {
  summary: null,
  isLoading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  // 비동기 액션의 상태(pending, fulfilled, rejected)에 따라 state를 변경
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;
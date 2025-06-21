/**
 * @file caseSlice.js
 * @description Redux Toolkit slice for managing scenario (case) state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { caseService } from '../../services/caseService';
import { myNotesService } from '../../services/myNotesService';
import { fetchBookmarks } from './myNotesSlice';

const initialState = {
  scenarios: [],
  pagination: null,
  categories: [], // 기존 카테고리 상태 유지
  currentScenario: null, // [추가] 현재 선택된 단일 증례 정보
  isLoading: false,
  error: null,
};

// [추가] 단일 증례 정보를 가져오는 Thunk
export const fetchScenarioById = createAsyncThunk(
  'cases/fetchById',
  async (scenarioId, { rejectWithValue }) => {
    try {
      const data = await caseService.getScenarioById(scenarioId);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 기존 Thunk 함수들 (변경 없음)
export const fetchScenarios = createAsyncThunk(
  'cases/fetchScenarios',
  async (params, { rejectWithValue }) => {
    try {
      const data = await caseService.getScenarios(params);
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'cases/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await caseService.getCaseCategories();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addBookmark = createAsyncThunk(
  'cases/addBookmark',
  async (scenarioId, { dispatch, rejectWithValue }) => {
    try {
      await myNotesService.addBookmark(scenarioId);
      dispatch(fetchBookmarks());
      return scenarioId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeBookmark = createAsyncThunk(
  'cases/removeBookmark',
  async (scenarioId, { dispatch, rejectWithValue }) => {
    try {
      await myNotesService.removeBookmark(scenarioId);
      dispatch(fetchBookmarks());
      return scenarioId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const caseSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 목록 조회
      .addCase(fetchScenarios.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchScenarios.fulfilled, (state, action) => {
        state.isLoading = false;
        state.scenarios = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchScenarios.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // [추가] 단일 증례 조회 로직
      .addCase(fetchScenarioById.pending, (state) => {
        state.isLoading = true;
        state.currentScenario = null;
        state.error = null;
      })
      .addCase(fetchScenarioById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentScenario = action.payload;
      })
      .addCase(fetchScenarioById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // 카테고리 (기존 코드 유지)
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        console.error('Failed to fetch categories:', action.payload);
      })
      // 북마크 (기존 코드 유지)
      .addCase(addBookmark.fulfilled, (state, action) => {
        const scenario = state.scenarios.find(s => s.id === action.payload);
        if (scenario) {
          scenario.isBookmarked = true;
        }
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        const scenario = state.scenarios.find(s => s.id === action.payload);
        if (scenario) {
          scenario.isBookmarked = false;
        }
      });
  },
});

export default caseSlice.reducer;
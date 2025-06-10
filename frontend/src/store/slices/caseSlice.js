/**
 * @file caseSlice.js
 * @description Redux Toolkit slice for managing scenario (case) state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { caseService } from '../../services/caseService';
import { myNotesService } from '../../services/myNotesService';
// 1. myNotesSlice에서 fetchBookmarks 액션을 추가로 import 합니다.
import { fetchBookmarks } from './myNotesSlice';

const initialState = {
  scenarios: [],
  pagination: null,
  isLoading: false,
  error: null,
};

// Async thunk for fetching scenarios
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

// 북마크 추가 Thunk
export const addBookmark = createAsyncThunk(
  'cases/addBookmark',
  // 2. 두 번째 인자로 dispatch를 포함한 thunkAPI 객체를 받습니다.
  async (scenarioId, { dispatch, rejectWithValue }) => {
    try {
      await myNotesService.addBookmark(scenarioId);
      // 3. 북마크 추가 성공 후, 최신 북마크 목록을 다시 불러오는 액션을 실행합니다.
      dispatch(fetchBookmarks());
      return scenarioId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 북마크 삭제 Thunk
export const removeBookmark = createAsyncThunk(
  'cases/removeBookmark',
  // 4. 여기에도 thunkAPI 객체를 받습니다.
  async (scenarioId, { dispatch, rejectWithValue }) => {
    try {
      await myNotesService.removeBookmark(scenarioId);
      // 5. 북마크 삭제 성공 후, 최신 북마크 목록을 다시 불러오는 액션을 실행합니다.
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
      .addCase(fetchScenarios.pending, (state) => {
        state.isLoading = true;
        state.error = null;
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
      // 이 부분은 즉각적인 UI 반응을 위해 그대로 둡니다.
      // (실제 데이터 소스는 fetchBookmarks를 통해 갱신됩니다)
      .addCase(addBookmark.fulfilled, (state, action) => {
        const scenarioId = action.payload;
        const scenario = state.scenarios.find(s => s.id === scenarioId);
        if (scenario) {
          scenario.isBookmarked = true;
        }
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        const scenarioId = action.payload;
        const scenario = state.scenarios.find(s => s.id === scenarioId);
        if (scenario) {
          scenario.isBookmarked = false;
        }
      });
  },
});

export default caseSlice.reducer;

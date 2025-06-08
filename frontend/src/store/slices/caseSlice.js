/**
 * @file caseSlice.js
 * @description Redux Toolkit slice for managing scenario (case) state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { caseService } from '../../services/caseService';
// 1. myNotesService를 새로 import 합니다.
import { myNotesService } from '../../services/myNotesService';

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

// --- 2. 북마크 추가/삭제를 위한 Thunk 추가 ---
// 북마크 추가 Thunk
export const addBookmark = createAsyncThunk(
  'cases/addBookmark',
  async (scenarioId, { rejectWithValue }) => {
    try {
      await myNotesService.addBookmark(scenarioId);
      return scenarioId; // 성공 시 어떤 증례가 북마크되었는지 ID를 반환
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 북마크 삭제 Thunk
export const removeBookmark = createAsyncThunk(
  'cases/removeBookmark',
  async (scenarioId, { rejectWithValue }) => {
    try {
      await myNotesService.removeBookmark(scenarioId);
      return scenarioId; // 성공 시 어떤 증례가 해제되었는지 ID를 반환
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
// --- 여기까지 추가 ---

const caseSlice = createSlice({
  name: 'cases',
  initialState,
  reducers: {
    // standard reducers can go here if needed
  },
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
      
      // --- 3. 북마크 Thunk 상태 처리 로직 추가 ---
      .addCase(addBookmark.fulfilled, (state, action) => {
        const scenarioId = action.payload;
        // 시나리오 목록에서 해당 ID를 찾아 isBookmarked 상태를 true로 변경
        const scenario = state.scenarios.find(s => s.scenarioId === scenarioId);
        if (scenario) {
          scenario.isBookmarked = true;
        }
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        const scenarioId = action.payload;
        // 시나리오 목록에서 해당 ID를 찾아 isBookmarked 상태를 false로 변경
        const scenario = state.scenarios.find(s => s.scenarioId === scenarioId);
        if (scenario) {
          scenario.isBookmarked = false;
        }
      });
      // --- 여기까지 추가 ---
  },
});

export default caseSlice.reducer;
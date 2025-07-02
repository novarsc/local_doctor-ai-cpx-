/**
 * @file mockExamSlice.js
 * @description Redux Toolkit slice for managing mock exam state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { mockExamService } from '../../services/mockExamService';

const initialState = {
  currentSession: null,
  history: [],
  categories: null,
  status: 'idle', // 'idle' | 'loading' | 'active' | 'completed' | 'error'
  error: null,
};

// Existing async thunks (startNewMockExam, fetchMockExamSession) ...
export const startNewMockExam = createAsyncThunk('mockExam/startNew', async (config, { rejectWithValue }) => { try { return await mockExamService.startMockExam(config); } catch (e) { return rejectWithValue(e.message); }});
export const fetchMockExamSession = createAsyncThunk(
  'mockExam/fetchSession', 
  async (id, { rejectWithValue }) => { 
    try { 
      console.log('fetchMockExamSession 호출:', id);
      console.log('API 호출 시작 (결과 페이지에서 최신 정보를 위해 항상 호출)');
      const result = await mockExamService.getMockExamSession(id);
      console.log('API 호출 성공:', result);
      return result;
    } catch (e) { 
      console.error('fetchMockExamSession 실패:', e);
      return rejectWithValue(e.message || '세션 정보를 불러오는데 실패했습니다.'); 
    }
  }
);

// Async thunk for fetching secondary categories
export const fetchCases = createAsyncThunk(
    'mockExam/fetchCases',
    async () => {
        return await mockExamService.getCases();
    }
);

// Async thunk for completing a mock exam session
export const completeMockExam = createAsyncThunk(
    'mockExam/complete',
    async (sessionId, { rejectWithValue }) => {
        try {
            return await mockExamService.completeMockExam(sessionId);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const mockExamSlice = createSlice({
  name: 'mockExam',
  initialState,
  reducers: {
    clearCurrentMockExam: (state) => {
      state.currentSession = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Existing lifecycles...
      .addCase(startNewMockExam.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(startNewMockExam.fulfilled, (state, action) => { state.status = 'active'; state.currentSession = action.payload; })
      .addCase(startNewMockExam.rejected, (state, action) => { state.status = 'error'; state.error = action.payload; })
      .addCase(fetchMockExamSession.pending, (state) => { state.status = 'loading'; state.error = null; })
      .addCase(fetchMockExamSession.fulfilled, (state, action) => { state.status = 'active'; state.currentSession = action.payload; })
      .addCase(fetchMockExamSession.rejected, (state, action) => { state.status = 'error'; state.error = action.payload; })
      
      // Categories lifecycle
      .addCase(fetchCases.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCases.fulfilled, (state, action) => {
        state.status = 'idle';
        state.categories = action.payload;
      })
      .addCase(fetchCases.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.error.message;
      })
      
      // New lifecycle for completing a mock exam
      .addCase(completeMockExam.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(completeMockExam.fulfilled, (state, action) => {
        state.status = 'completed';
        state.currentSession = action.payload; // Update with the final session data including score
      })
      .addCase(completeMockExam.rejected, (state, action) => {
        state.status = 'error';
        state.error = action.payload;
      });
  },
});

export const { clearCurrentMockExam } = mockExamSlice.actions;

export default mockExamSlice.reducer;

/**
 * @file myNotesSlice.js
 * @description Redux slice for managing state related to the 'MY 노트' feature.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { myNotesService } from '../../services/myNotesService';

// 학습 완료된 증례 목록 조회 Thunk
export const fetchPracticedScenarios = createAsyncThunk(
  'myNotes/fetchPracticedScenarios',
  async (_, { rejectWithValue }) => {
    try {
      const scenarios = await myNotesService.getPracticedScenarios();
      return scenarios;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 학습 기록 조회 Thunk
export const fetchLearningHistory = createAsyncThunk(
  'myNotes/fetchLearningHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await myNotesService.getLearningHistory();
      return response; 
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Unknown error' });
    }
  }
);

// 즐겨찾기 조회 Thunk
export const fetchBookmarks = createAsyncThunk(
  'myNotes/fetchBookmarks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await myNotesService.getBookmarks();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Unknown error' });
    }
  }
);

// 오답노트 조회 Thunk
export const fetchIncorrectNotes = createAsyncThunk(
  'myNotes/fetchIncorrectNotes',
  async (scenarioId, { rejectWithValue }) => {
    try {
      const response = await myNotesService.getIncorrectNotes(scenarioId);
      return { scenarioId, data: response };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Unknown error' });
    }
  }
);

// 사용자 메모 저장 Thunk
export const saveUserMemo = createAsyncThunk(
  'myNotes/saveUserMemo',
  async ({ scenarioId, memo }, { rejectWithValue }) => {
    try {
      const response = await myNotesService.saveIncorrectNoteMemo(scenarioId, memo);
      return { scenarioId, data: response };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Unknown error' });
    }
  }
);

// 초기 상태 정의
const initialState = {
  learningHistory: [],
  bookmarks: [],
  incorrectNotes: {},
  practicedScenarios: [],
  status: {
    learningHistory: 'idle',
    bookmarks: 'idle',
    incorrectNotes: 'idle',
    practicedScenarios: 'idle',
  },
  error: null,
};

const myNotesSlice = createSlice({
  name: 'myNotes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 학습 완료된 증례 목록 상태 처리
      .addCase(fetchPracticedScenarios.pending, (state) => {
        state.status.practicedScenarios = 'loading';
      })
      .addCase(fetchPracticedScenarios.fulfilled, (state, action) => {
        state.status.practicedScenarios = 'succeeded';
        if (Array.isArray(action.payload)) {
          state.practicedScenarios = action.payload;
        } else if (action.payload && Array.isArray(action.payload.data)) {
          state.practicedScenarios = action.payload.data;
        } else {
          state.practicedScenarios = [];
        }
      })
      .addCase(fetchPracticedScenarios.rejected, (state, action) => {
        state.status.practicedScenarios = 'failed';
        state.error = action.payload?.message || 'Failed to fetch practiced scenarios';
      })
      
      // 학습 기록 상태 처리
      .addCase(fetchLearningHistory.pending, (state) => {
        state.status.learningHistory = 'loading';
      })
      .addCase(fetchLearningHistory.fulfilled, (state, action) => {
        state.status.learningHistory = 'succeeded';
        if (Array.isArray(action.payload)) {
          state.learningHistory = action.payload;
        } else if (action.payload && Array.isArray(action.payload.data)) {
          state.learningHistory = action.payload.data;
        } else {
          state.learningHistory = [];
        }
      })
      .addCase(fetchLearningHistory.rejected, (state, action) => {
        state.status.learningHistory = 'failed';
        state.error = action.payload?.message || 'Failed to fetch learning history';
      })
      
      // 즐겨찾기 상태 처리
      .addCase(fetchBookmarks.pending, (state) => {
        state.status.bookmarks = 'loading';
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.status.bookmarks = 'succeeded';
        if (Array.isArray(action.payload)) {
          state.bookmarks = action.payload;
        } else if (action.payload && Array.isArray(action.payload.data)) {
          state.bookmarks = action.payload.data;
        } else {
          state.bookmarks = [];
        }
      })
      .addCase(fetchBookmarks.rejected, (state, action) => {
        state.status.bookmarks = 'failed';
        state.error = action.payload?.message || 'Failed to fetch bookmarks';
      })
      
      // 오답노트 상태 처리
      .addCase(fetchIncorrectNotes.pending, (state) => {
        state.status.incorrectNotes = 'loading';
      })
      .addCase(fetchIncorrectNotes.fulfilled, (state, action) => {
        state.status.incorrectNotes = 'succeeded';
        state.incorrectNotes[action.payload.scenarioId] = action.payload.data;
      })
      .addCase(fetchIncorrectNotes.rejected, (state, action) => {
        state.status.incorrectNotes = 'failed';
        state.error = action.payload?.message || 'Failed to fetch incorrect notes';
      })
      
      // 사용자 메모 저장 상태 처리
      .addCase(saveUserMemo.pending, (state) => {
        state.status.incorrectNotes = 'saving';
      })
      .addCase(saveUserMemo.fulfilled, (state, action) => {
        state.status.incorrectNotes = 'succeeded';
        if (state.incorrectNotes[action.payload.scenarioId]) {
          state.incorrectNotes[action.payload.scenarioId].userMemo = action.payload.data.userMemo;
        }
      })
      .addCase(saveUserMemo.rejected, (state, action) => {
        state.status.incorrectNotes = 'failed';
        state.error = action.payload?.message || 'Failed to save user memo';
      });
  },
});

export default myNotesSlice.reducer;
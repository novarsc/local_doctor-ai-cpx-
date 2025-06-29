/**
 * @file myNotesSlice.js
 * @description Redux slice for managing state related to the '학습 노트' feature.
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

// 즐겨찾기 해제 Thunk
export const removeBookmark = createAsyncThunk(
  'myNotes/removeBookmark',
  async (scenarioId, { rejectWithValue }) => {
    try {
      await myNotesService.removeBookmark(scenarioId);
      return scenarioId;
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

// 상세 오답노트 조회 Thunk
export const fetchDetailedIncorrectNotes = createAsyncThunk(
  'myNotes/fetchDetailedIncorrectNotes',
  async (scenarioId, { rejectWithValue }) => {
    try {
      const response = await myNotesService.getDetailedIncorrectNotes(scenarioId);
      return { scenarioId, data: response };
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Unknown error' });
    }
  }
);

// 노트 상태 업데이트 Thunk
export const updateNoteStatus = createAsyncThunk(
  'myNotes/updateNoteStatus',
  async ({ scenarioId, hasNote }, { rejectWithValue }) => {
    try {
      const response = await myNotesService.updateNoteStatus(scenarioId, hasNote);
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
  detailedIncorrectNotes: {},
  practicedScenarios: [],
  status: {
    learningHistory: 'idle',
    bookmarks: 'idle',
    incorrectNotes: 'idle',
    detailedIncorrectNotes: 'idle',
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
      
      // 즐겨찾기 해제 상태 처리
      .addCase(removeBookmark.pending, (state) => {
        state.status.bookmarks = 'removing';
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        state.status.bookmarks = 'succeeded';
        // 즐겨찾기 목록에서 해당 시나리오 제거
        state.bookmarks = state.bookmarks.filter(bookmark => bookmark.scenarioId !== action.payload);
      })
      .addCase(removeBookmark.rejected, (state, action) => {
        state.status.bookmarks = 'failed';
        state.error = action.payload?.message || 'Failed to remove bookmark';
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
      
      // 상세 오답노트 상태 처리
      .addCase(fetchDetailedIncorrectNotes.pending, (state) => {
        state.status.detailedIncorrectNotes = 'loading';
      })
      .addCase(fetchDetailedIncorrectNotes.fulfilled, (state, action) => {
        state.status.detailedIncorrectNotes = 'succeeded';
        state.detailedIncorrectNotes[action.payload.scenarioId] = action.payload.data;
      })
      .addCase(fetchDetailedIncorrectNotes.rejected, (state, action) => {
        state.status.detailedIncorrectNotes = 'failed';
        state.error = action.payload?.message || 'Failed to fetch detailed incorrect notes';
      })
      
      // 노트 상태 업데이트 처리
      .addCase(updateNoteStatus.pending, (state) => {
        state.status.incorrectNotes = 'updating';
      })
      .addCase(updateNoteStatus.fulfilled, (state, action) => {
        state.status.incorrectNotes = 'succeeded';
        // practicedScenarios에서 해당 증례의 hasNote 상태 업데이트
        const scenarioIndex = state.practicedScenarios.findIndex(
          scenario => scenario.scenarioId === action.payload.scenarioId
        );
        if (scenarioIndex !== -1) {
          state.practicedScenarios[scenarioIndex].hasNote = action.payload.data.hasNote;
        }
        // incorrectNotes에서도 업데이트
        if (state.incorrectNotes[action.payload.scenarioId]) {
          state.incorrectNotes[action.payload.scenarioId].hasNote = action.payload.data.hasNote;
        }
      })
      .addCase(updateNoteStatus.rejected, (state, action) => {
        state.status.incorrectNotes = 'failed';
        state.error = action.payload?.message || 'Failed to update note status';
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
/**
 * @file myNotesSlice.js
 * @description Redux slice for managing state related to the 'MY 노트' feature.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { myNotesService } from '../../services/myNotesService';

// 1. 학습 기록 조회 Thunk: 백엔드 API를 호출합니다.
export const fetchLearningHistory = createAsyncThunk(
  'myNotes/fetchLearningHistory',
  async (_, { rejectWithValue }) => {
    try {
      // myNotesService를 통해 백엔드에서 데이터를 가져옵니다.
      const response = await myNotesService.getLearningHistory();
      // 성공하면 응답 데이터 전체를 반환합니다. (응답은 { data: [...] } 형태일 수 있음)
      return response; 
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Unknown error' });
    }
  }
);

// 2. 즐겨찾기 조회 Thunk
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

// 3. 오답노트 조회 Thunk
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

// 4. 사용자 메모 저장 Thunk
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
  status: {
    learningHistory: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    bookmarks: 'idle',
    incorrectNotes: 'idle',
  },
  error: null,
};

const myNotesSlice = createSlice({
  name: 'myNotes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 학습 기록 로딩 상태 처리
      .addCase(fetchLearningHistory.pending, (state) => {
        state.status.learningHistory = 'loading';
      })
      // 학습 기록 로딩 성공 상태 처리
      .addCase(fetchLearningHistory.fulfilled, (state, action) => {
        state.status.learningHistory = 'succeeded';
        // 2. [핵심 수정] 백엔드 응답 데이터 구조에 맞게 상태를 업데이트합니다.
        // API가 { data: [...] } 형태로 응답할 가능성이 높으므로, action.payload.data를 저장합니다.
        // 만약 배열을 직접 반환한다면 action.payload를 사용합니다.
        // Array.isArray로 확인하여 두 경우 모두 안전하게 처리합니다.
        if (Array.isArray(action.payload)) {
          state.learningHistory = action.payload;
        } else if (action.payload && Array.isArray(action.payload.data)) {
          state.learningHistory = action.payload.data;
        } else {
          console.error("Received unexpected data structure for learning history:", action.payload);
          state.learningHistory = []; // 예상치 못한 구조일 경우 비워줍니다.
        }
      })
      // 학습 기록 로딩 실패 상태 처리
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
          console.error("Received unexpected data structure for bookmarks:", action.payload);
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

/**
 * @file practiceSessionSlice.js
 * @description Redux Toolkit slice for managing the state of an active practice session.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { caseService } from '../../services/caseService';
import { practiceSessionService } from '../../services/practiceSessionService';

const initialState = {
  // Session info
  sessionId: null,
  currentScenario: null,
  status: 'idle', // 'idle' | 'active' | 'completed' | 'error'
  
  // Chat state
  chatLog: [],
  isAiResponding: false,

  // Feedback state
  feedback: null,
  evaluationStatus: 'idle', // 'idle' | 'evaluating' | 'completed' | 'error'

  // General state
  isLoading: false,
  error: null,
};

// Existing async thunks
export const fetchScenarioForPractice = createAsyncThunk('practiceSession/fetchScenario', async (id, { rejectWithValue }) => { try { return await caseService.getScenarioById(id); } catch (e) { return rejectWithValue(e.message); }});
export const startNewPracticeSession = createAsyncThunk('practiceSession/startNew', async (config, { rejectWithValue }) => { try { return await practiceSessionService.startPracticeSession(config); } catch (e) { return rejectWithValue(e.message); }});

// Async thunk for completing a session
export const completeSession = createAsyncThunk(
  'practiceSession/complete',
  async (sessionId, { rejectWithValue }) => {
    try {
      return await practiceSessionService.completePracticeSession(sessionId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// --- 여기가 수정된 부분입니다 ---
// 기존 fetchFeedback 함수의 이름을 PostPracticePage.jsx가 사용하는 이름으로 변경합니다.
export const fetchFeedbackForSession = createAsyncThunk(
  'practiceSession/fetchFeedback',
  async (sessionId, { rejectWithValue }) => {
    try {
      const result = await practiceSessionService.getFeedback(sessionId);
      // 백엔드에서 받은 응답 전체를 반환하여 리듀서에서 상태를 처리하도록 합니다.
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const practiceSessionSlice = createSlice({
  name: 'practiceSession',
  initialState,
  reducers: {
    addUserMessage: (state, action) => { state.chatLog.push({ id: Date.now(), sender: 'user', content: action.payload }); state.isAiResponding = true; },
    appendAiMessageChunk: (state, action) => { const last = state.chatLog[state.chatLog.length - 1]; if (last?.sender === 'ai') { last.content += action.payload.chunk; } else { state.chatLog.push({ id: Date.now(), sender: 'ai', content: action.payload.chunk }); } },
    endAiResponse: (state) => { state.isAiResponding = false; },
    setPracticeError: (state, action) => { state.isAiResponding = false; state.error = action.payload; },
    clearPracticeSession: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Existing extra reducers...
      .addCase(fetchScenarioForPractice.pending, (state) => { state.isLoading = true; state.currentScenario = null; })
      .addCase(fetchScenarioForPractice.fulfilled, (state, action) => { state.isLoading = false; state.currentScenario = action.payload; })
      .addCase(fetchScenarioForPractice.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      .addCase(startNewPracticeSession.pending, (state) => { state.isLoading = true; })
      .addCase(startNewPracticeSession.fulfilled, (state, action) => { state.isLoading = false; state.status = 'active'; state.sessionId = action.payload.practiceSessionId; state.chatLog = [action.payload.aiPatientInitialInteraction.data]; })
      .addCase(startNewPracticeSession.rejected, (state, action) => { state.isLoading = false; state.status = 'error'; state.error = action.payload; })

      // New extra reducers for session completion and feedback
      .addCase(completeSession.fulfilled, (state) => {
        state.status = 'completed';
        state.evaluationStatus = 'evaluating';
      })
      // fetchFeedbackForSession에 대한 리듀서 로직을 추가합니다.
      .addCase(fetchFeedbackForSession.pending, (state) => {
        // 폴링 중에는 전체 로딩 상태를 변경하지 않을 수 있습니다.
        // 필요하다면 별도의 상태 (e.g., isFeedbackLoading)를 추가할 수 있습니다.
      })
      .addCase(fetchFeedbackForSession.fulfilled, (state, action) => {
        state.feedback = action.payload; // 백엔드 응답을 그대로 저장
        if (action.payload.status === 'completed') {
            state.evaluationStatus = 'completed';
        } else {
            state.evaluationStatus = 'evaluating';
        }
      })
      .addCase(fetchFeedbackForSession.rejected, (state, action) => {
        state.evaluationStatus = 'error';
        state.error = action.payload;
      });
  },
});

export const { addUserMessage, appendAiMessageChunk, endAiResponse, setPracticeError, clearPracticeSession } = practiceSessionSlice.actions;
export default practiceSessionSlice.reducer;

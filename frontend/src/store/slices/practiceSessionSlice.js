/**
 * @file practiceSessionSlice.js
 * @description Redux Toolkit slice for managing the state of an active practice session.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
// [수정] caseService import 제거
import { practiceSessionService } from '../../services/practiceSessionService';

const initialState = {
  // Session info
  sessionId: null,
  currentScenario: null, // 현재 시나리오 정보 추가
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

// --- [제거] fetchScenarioForPractice Thunk 전체 제거 ---

// --- Async Thunks ---

export const startNewPracticeSession = createAsyncThunk(
  'practiceSession/startNew', 
  async (config, { rejectWithValue }) => { 
    try { 
      return await practiceSessionService.startPracticeSession(config); 
    } catch (e) { 
      return rejectWithValue(e.message); 
    }
  }
);

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

export const fetchFeedbackForSession = createAsyncThunk(
  'practiceSession/fetchFeedback',
  async (sessionId, { rejectWithValue }) => {
    try {
      const result = await practiceSessionService.getFeedback(sessionId);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const resumePracticeSession = createAsyncThunk(
  'practiceSession/resume',
  async (sessionId, { rejectWithValue }) => {
    try {
      const [sessionDetails, chatHistory] = await Promise.all([
        practiceSessionService.getSessionDetails(sessionId), // [수정] getPracticeSession -> getSessionDetails
        practiceSessionService.getChatLogs(sessionId)
      ]);
      
      const scenario = sessionDetails.scenario;

      return {
        sessionDetails,
        chatHistory: chatHistory.data,
        scenario,
      };
    } catch (error) {
      return rejectWithValue(error.message || '세션을 이어오는 데 실패했습니다.');
    }
  }
);


const practiceSessionSlice = createSlice({
  name: 'practiceSession',
  initialState,
  reducers: {
    // 모의고사용 실습 세션 시작 액션 추가
    startPracticeSession: (state, action) => {
      const { sessionId, scenarioId, scenarioName } = action.payload;
      state.sessionId = sessionId;
      state.currentScenario = {
        scenarioId,
        name: scenarioName
      };
      state.status = 'active';
      state.chatLog = [];
      state.isAiResponding = false;
      state.error = null;
    },
    addUserMessage: (state, action) => {
      state.chatLog.push({ id: `user-${Date.now()}`, sender: 'user', content: action.payload });
      state.isAiResponding = true;
    },
    appendAiMessageChunk: (state, action) => { 
      const last = state.chatLog[state.chatLog.length - 1]; 
      if (last?.sender === 'ai') { 
        last.content += action.payload.chunk; 
      } else { 
        state.chatLog.push({ id: `ai-${Date.now()}`, sender: 'ai', content: action.payload.chunk }); 
      } 
    },
    endAiResponse: (state) => { state.isAiResponding = false; },
    setPracticeError: (state, action) => { 
      state.isAiResponding = false; 
      state.error = action.payload; 
    },
    clearError: (state) => {
      state.error = null;
    },
    resetSession: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- [제거] fetchScenarioForPractice 관련 Reducer 로직 전체 제거 ---
      
      // Start New Session
      .addCase(startNewPracticeSession.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(startNewPracticeSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.practiceSessionId;
        state.currentScenario = action.payload.scenario;
        state.status = 'active';
        state.chatLog = [];
      })
      .addCase(startNewPracticeSession.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; state.status = 'error'; })

      // Complete Session & Fetch Feedback
      .addCase(completeSession.pending, (state) => {
        state.evaluationStatus = 'evaluating';
        state.isLoading = true;
      })
      .addCase(completeSession.fulfilled, (state, action) => {
        state.evaluationStatus = 'completed';
        state.isLoading = false;
        state.status = 'completed';
        state.feedback = action.payload;
      })
      .addCase(completeSession.rejected, (state, action) => {
        state.evaluationStatus = 'error';
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Resume Session
      .addCase(resumePracticeSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resumePracticeSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.sessionDetails.practiceSessionId;
        state.currentScenario = action.payload.scenario;
        state.status = 'active';
        state.chatLog = (action.payload.chatHistory || []).map(log => ({
          id: log.chatLogId,
          sender: log.sender,
          content: log.content,
          timestamp: log.createdAt
        }));
      })
      .addCase(resumePracticeSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.status = 'error';
      });
  },
});

export const {
  addUserMessage,
  appendAiMessageChunk,
  endAiResponse,
  setPracticeError,
  clearError,
  resetSession,
  startPracticeSession,
} = practiceSessionSlice.actions;
export default practiceSessionSlice.reducer;
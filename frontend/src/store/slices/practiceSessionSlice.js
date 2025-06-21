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

// --- Async Thunks ---

export const fetchScenarioForPractice = createAsyncThunk(
  'practiceSession/fetchScenario', 
  async (id, { rejectWithValue }) => { 
    try { 
      return await caseService.getScenarioById(id); 
    } catch (e) { 
      return rejectWithValue(e.message); 
    }
  }
);

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

/** ▼▼▼ [새로 추가] 이어하기를 위한 비동기 Thunk ▼▼▼ */
export const resumePracticeSession = createAsyncThunk(
  'practiceSession/resume',
  async (sessionId, { rejectWithValue }) => {
    try {
      const [sessionDetails, chatHistory] = await Promise.all([
        practiceSessionService.getPracticeSession(sessionId),
        practiceSessionService.getChatLogs(sessionId)
      ]);
      
      const scenario = await caseService.getScenarioById(sessionDetails.scenarioId);

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
    clearPracticeSession: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch Scenario
      .addCase(fetchScenarioForPractice.pending, (state) => { state.isLoading = true; state.currentScenario = null; })
      .addCase(fetchScenarioForPractice.fulfilled, (state, action) => { state.isLoading = false; state.currentScenario = action.payload; })
      .addCase(fetchScenarioForPractice.rejected, (state, action) => { state.isLoading = false; state.error = action.payload; })
      
      // Start New Session (중복 제거 후 최종 버전)
      .addCase(startNewPracticeSession.pending, (state) => { state.isLoading = true; })
      .addCase(startNewPracticeSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = 'active';
        state.sessionId = action.payload.practiceSessionId;
        state.chatLog = [action.payload.aiPatientInitialInteraction.data];
        state.currentScenario = action.payload.scenarioDetails;
      })
      .addCase(startNewPracticeSession.rejected, (state, action) => { state.isLoading = false; state.status = 'error'; state.error = action.payload; })

      // Complete Session & Fetch Feedback
      .addCase(completeSession.fulfilled, (state) => {
        state.status = 'completed';
        state.evaluationStatus = 'evaluating';
      })
      .addCase(fetchFeedbackForSession.pending, (state) => {
        // Polling 중에는 별도 로딩 상태를 표시하지 않음
      })
      .addCase(fetchFeedbackForSession.fulfilled, (state, action) => {
        state.feedback = action.payload;
        if (action.payload.status === 'completed') {
            state.evaluationStatus = 'completed';
        } else {
            state.evaluationStatus = 'evaluating';
        }
      })
      .addCase(fetchFeedbackForSession.rejected, (state, action) => {
        state.evaluationStatus = 'error';
        state.error = action.payload;
      })
      
      // ▼▼▼ [새로 추가] Resume Session 라이프사이클 로직 ▼▼▼
      .addCase(resumePracticeSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resumePracticeSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = 'active';
        state.sessionId = action.payload.sessionDetails.practiceSessionId;
        state.currentScenario = action.payload.scenario;
        state.chatLog = action.payload.chatHistory.map(log => ({
            id: log.messageId,
            sender: log.sender,
            content: log.content
        }));
      })
      .addCase(resumePracticeSession.rejected, (state, action) => {
        state.isLoading = false;
        state.status = 'error';
        state.error = action.payload;
      });
  },
});

export const { addUserMessage, appendAiMessageChunk, endAiResponse, setPracticeError, clearPracticeSession } = practiceSessionSlice.actions;
export default practiceSessionSlice.reducer;
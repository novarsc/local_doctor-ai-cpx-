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

// Existing async thunks (fetchScenarioForPractice, startNewPracticeSession) ...
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

// Async thunk for fetching feedback
export const fetchFeedback = createAsyncThunk(
  'practiceSession/fetchFeedback',
  async (sessionId, { rejectWithValue }) => {
    try {
      // Polling logic can be added here if needed, but for now, a single fetch
      const result = await practiceSessionService.getFeedback(sessionId);
      if (result.status === 'evaluating') {
        // We can handle the "evaluating" state in the component
        return result;
      }
      return result.data;
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
      .addCase(fetchFeedback.pending, (state) => {
        state.evaluationStatus = 'loading';
        state.feedback = null;
      })
      .addCase(fetchFeedback.fulfilled, (state, action) => {
        if (action.payload.status === 'evaluating') {
            state.evaluationStatus = 'evaluating';
        } else {
            state.evaluationStatus = 'completed';
            state.feedback = action.payload;
        }
      })
      .addCase(fetchFeedback.rejected, (state, action) => {
        state.evaluationStatus = 'error';
        state.error = action.payload;
      });
  },
});

export const { addUserMessage, appendAiMessageChunk, endAiResponse, setPracticeError, clearPracticeSession } = practiceSessionSlice.actions;
export default practiceSessionSlice.reducer;

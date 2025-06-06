/**
 * @file caseSlice.js
 * @description Redux Toolkit slice for managing scenario (case) state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { caseService } from '../../services/caseService';

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
      });
  },
});

export default caseSlice.reducer;

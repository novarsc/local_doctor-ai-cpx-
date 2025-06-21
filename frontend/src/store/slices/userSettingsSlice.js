import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUserStats } from '../../services/userService';

// 학습 통계 데이터를 가져오는 비동기 Thunk
export const fetchMyStats = createAsyncThunk(
  'myPage/fetchMyStats', // Thunk 이름은 고유해야 하므로 'myPage' 네임스페이스 사용
  async (_, { rejectWithValue }) => {
    try {
      const statsData = await getUserStats();
      return statsData;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  stats: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const userSettingsSlice = createSlice({
  name: 'myPage', // state 접근 시 'state.myPage'로 사용하기 위해 이 이름을 사용
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyStats.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMyStats.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchMyStats.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export default userSettingsSlice.reducer;
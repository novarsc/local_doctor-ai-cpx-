/**
 * @file authSlice.js
 * @description Redux Toolkit slice for managing authentication state.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/authService';
import { getUser, getToken } from '../../utils/localStorageHelper';

// Get initial state from localStorage to maintain session across page refreshes
const user = getUser();
const token = getToken();

const initialState = {
  user: user || null,
  isAuthenticated: !!token,
  isLoading: false,
  error: null,
};

// Async thunk for user login
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const userData = await authService.login(email, password);
      return userData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for user registration (doesn't log in automatically)
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for Naver social login
export const naverLogin = createAsyncThunk(
  'auth/naverLogin',
  async (code, { rejectWithValue }) => {
    try {
      const userData = await authService.naverLogin(code);
      return userData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for Kakao social login
export const kakaoLogin = createAsyncThunk(
  'auth/kakaoLogin',
  async (code, { rejectWithValue }) => {
    try {
      const userData = await authService.kakaoLogin(code);
      return userData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for finding user ID
export const findUserId = createAsyncThunk(
  'auth/findId',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.findId(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for finding password
export const findUserPassword = createAsyncThunk(
  'auth/findPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.findPassword(email);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for resetting password
export const resetUserPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(token, newPassword);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.updateProfile(profileData);
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for uploading profile image
export const uploadProfileImage = createAsyncThunk(
  'auth/uploadProfileImage',
  async (imageFile, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.uploadProfileImage(imageFile);
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting profile image
export const deleteProfileImage = createAsyncThunk(
  'auth/deleteProfileImage',
  async (_, { rejectWithValue }) => {
    try {
      const updatedUser = await authService.deleteProfileImage();
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for updating user password
export const updateUserPassword = createAsyncThunk(
  'auth/updatePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      await authService.updatePassword(passwordData);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for deleting user account
export const deleteUserAccount = createAsyncThunk(
  'auth/deleteAccount',
  async ({ password }, { rejectWithValue }) => {
    try {
      await authService.deleteAccount(password);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducer for logging out the user
    logout: (state) => {
      authService.logout(); // Clears localStorage
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    // Reducer for successful login (used by social login callback)
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login lifecycle
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Register lifecycle (doesn't change auth state, just handles loading/error)
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Naver Login lifecycle
      .addCase(naverLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(naverLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(naverLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Kakao Login lifecycle
      .addCase(kakaoLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(kakaoLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(kakaoLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Find ID lifecycle
      .addCase(findUserId.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(findUserId.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(findUserId.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Find Password lifecycle
      .addCase(findUserPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(findUserPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(findUserPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reset Password lifecycle
      .addCase(resetUserPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetUserPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resetUserPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Profile lifecycle
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true; // 또는 isUpdating 같은 별도 상태 사용 가능
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload; // 스토어의 user 정보를 새 정보로 교체
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Upload Profile Image lifecycle
      .addCase(uploadProfileImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Delete Profile Image lifecycle
      .addCase(deleteProfileImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProfileImage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(deleteProfileImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Password lifecycle
      .addCase(updateUserPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserPassword.fulfilled, (state) => {
        state.isLoading = false;
        // 비밀번호는 스토어에 저장하지 않으므로 특별한 상태 변경 없음
      })
      .addCase(updateUserPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // --- 계정 탈퇴 Thunk 로직 추가 ---
      .addCase(deleteUserAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUserAccount.fulfilled, (state) => {
        // 성공 시, 모든 사용자 정보를 초기화합니다 (logout과 동일).
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      .addCase(deleteUserAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, loginSuccess } = authSlice.actions;

export default authSlice.reducer;

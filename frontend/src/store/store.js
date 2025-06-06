/**
 * @file store.js
 * @description Configures the Redux store for the application.
 */

import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer'; // Path is now correct

const store = configureStore({
  reducer: rootReducer,
  // Redux DevTools are enabled by default in development mode
});

export default store;

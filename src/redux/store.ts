import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import usersReducer from './usersSlice';
import masjidsReducer from './masjidsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    masajids: masjidsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


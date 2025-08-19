import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import chatSlice from './slices/chatSlice';
import sessionsSlice from './slices/sessionsSlice';
import cbtSlice from './slices/cbtSlice';
import { apiSlice } from './api/apiSlice';

const persistConfig = {
  key: 'therapeuticAI',
  storage,
  whitelist: ['cbt', 'sessions'], // Persist drafts and session data
  blacklist: ['chat'], // Don't persist real-time chat state
};

const persistedCbtReducer = persistReducer(persistConfig, cbtSlice);

export const store = configureStore({
  reducer: {
    chat: chatSlice,
    sessions: sessionsSlice,
    cbt: persistedCbtReducer,
    api: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(apiSlice.middleware),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
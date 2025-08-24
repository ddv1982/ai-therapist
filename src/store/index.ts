import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import chatSlice from './slices/chatSlice';
import sessionsSlice from './slices/sessionsSlice';
import cbtSlice from './slices/cbtSlice';

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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
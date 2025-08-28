import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import chatSlice from './slices/chatSlice';
import sessionsSlice from './slices/sessionsSlice';

import cbtSessionSlice from './slices/cbt-session.slice';
import cbtDraftsSlice from './slices/cbt-drafts.slice';
import cbtFormSlice from './slices/cbt-form.slice';

const persistConfig = {
  key: 'therapeuticAI',
  storage,
  whitelist: ['cbtDrafts', 'cbtSession', 'sessions'], // Persist drafts and session data
  blacklist: ['chat', 'cbtForm'], // Don't persist real-time chat state or form state
};

const persistedCbtDraftsReducer = persistReducer(persistConfig, cbtDraftsSlice);
const persistedCbtSessionReducer = persistReducer(persistConfig, cbtSessionSlice);

export const store = configureStore({
  reducer: {
    chat: chatSlice,
    sessions: sessionsSlice,
    // New focused slices
    cbtSession: persistedCbtSessionReducer,
    cbtDrafts: persistedCbtDraftsReducer,
    cbtForm: cbtFormSlice,
    // Legacy slice for backward compatibility (to be removed)
    // cbt: persistReducer(persistConfig, cbtSlice),
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
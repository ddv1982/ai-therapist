import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import chatSlice from './slices/chatSlice';
import sessionsSlice from './slices/sessionsSlice';
import cbtSlice from './slices/cbtSlice';

// Root reducer
const rootReducer = combineReducers({
  chat: chatSlice,
  sessions: sessionsSlice,
  cbt: cbtSlice,
});

const persistConfig = {
  key: 'therapeuticAI',
  storage,
  whitelist: ['cbt', 'sessions'], // Persist drafts and session data
  blacklist: ['chat'], // Don't persist real-time chat state
};

type RootState = ReturnType<typeof rootReducer>;
const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
        ignoredPaths: ['_persist'],
      },
    }),
});

export const persistor = persistStore(store);

export type { RootState };
export type AppDispatch = typeof store.dispatch;

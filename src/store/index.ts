import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { createTransform } from 'redux-persist';

import chatSlice from './slices/chatSlice';
import sessionsSlice from './slices/sessionsSlice';
import cbtSlice from './slices/cbtSlice';

// Root reducer
const rootReducer = combineReducers({
  chat: chatSlice,
  sessions: sessionsSlice,
  cbt: cbtSlice,
});

// Transform to handle Date serialization
const dateTransform = createTransform(
  // Transform state on its way to being serialized and persisted
  (inboundState: unknown) => {
    // Convert Date objects to ISO strings
    return JSON.parse(JSON.stringify(inboundState));
  },
  // Transform state being rehydrated
  (outboundState: unknown) => {
    // State is already in the correct format (ISO strings)
    return outboundState;
  },
  // Define which reducers this transform is applied to
  { whitelist: ['cbt', 'sessions'] }
);

const persistConfig = {
  key: 'therapeuticAI',
  storage,
  version: 1,
  whitelist: ['cbt', 'sessions'], // Persist drafts and session data
  blacklist: ['chat'], // Don't persist real-time chat state
  transforms: [dateTransform],
  // Add error handling and debugging
  debug: process.env.NODE_ENV === 'development',
  // Reduce serialization complexity by limiting depth
  throttle: 100, // Throttle persist writes to prevent rapid firing
};

type RootState = ReturnType<typeof rootReducer>;
const persistedReducer = persistReducer<RootState>(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
          'persist/PAUSE', 
          'persist/PURGE',
          'persist/FLUSH'
        ],
        ignoredPaths: ['_persist'],
      },
    }),
});

export const persistor = persistStore(store);

export type { RootState };
export type AppDispatch = typeof store.dispatch;
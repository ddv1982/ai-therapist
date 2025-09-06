import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

import chatSlice from './slices/chatSlice';
import sessionsSlice from './slices/sessionsSlice';
import cbtSlice from './slices/cbtSlice';
import authSlice from './slices/authSlice';

// Root reducer
const rootReducer = combineReducers({
  chat: chatSlice,
  sessions: sessionsSlice,
  cbt: cbtSlice,
  auth: authSlice,
});

// Resilient storage for SSR and restricted environments (e.g., iOS private mode)
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, _value: string) {
      return Promise.resolve();
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
    // Required to satisfy Storage interface at compile time; never called
    clear() {},
    key(_index: number) { return null; },
    get length() { return 0; },
  } as unknown as Storage;
};

const safeStorage: Storage =
  typeof window === 'undefined'
    ? createNoopStorage()
    : (() => {
        try {
          return (createWebStorage('local') as unknown) as Storage;
        } catch {
          try {
            return (createWebStorage('session') as unknown) as Storage;
          } catch {
            return createNoopStorage();
          }
        }
      })();

const persistConfig = {
  key: 'therapeuticAI',
  storage: safeStorage,
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

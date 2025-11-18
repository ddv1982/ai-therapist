import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { persistStore, persistReducer } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';

import chatSlice from './slices/chat-slice';
import sessionsSlice from './slices/sessions-slice';
import cbtSlice from './slices/cbt-slice';
import { sessionsApi } from './slices/sessions-api';
import { sessionHeartbeatMiddleware } from './middleware/session-heartbeat-middleware';

const rootReducer = combineReducers({
  chat: chatSlice,
  sessions: sessionsSlice,
  cbt: cbtSlice,
  [sessionsApi.reducerPath]: sessionsApi.reducer,
});

const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem() {
      return Promise.resolve();
    },
    removeItem() {
      return Promise.resolve();
    },
    clear() {},
    key() {
      return null;
    },
    get length() {
      return 0;
    },
  } as unknown as Storage;
};

const safeStorage: Storage =
  typeof window === 'undefined'
    ? createNoopStorage()
    : (() => {
        try {
          return createWebStorage('local') as unknown as Storage;
        } catch {
          try {
            return createWebStorage('session') as unknown as Storage;
          } catch {
            return createNoopStorage();
          }
        }
      })();

const persistConfig = {
  key: 'therapeuticAI',
  storage: safeStorage,
  whitelist: ['sessions'],
  blacklist: ['chat'],
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
    }).concat(sessionsApi.middleware, sessionHeartbeatMiddleware),
});

setupListeners(store.dispatch);

export const persistor = persistStore(store);

export type { RootState };
export type AppDispatch = typeof store.dispatch;

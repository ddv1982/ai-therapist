'use client';

import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { logger } from '@/lib/utils/logger';

interface ReduxProviderProps {
  children: React.ReactNode;
}

// Simple loading component - no timeouts or forced loading
function PersistLoadingComponent() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading application...</p>
      </div>
    </div>
  );
}

// Simplified PersistGate wrapper - no error handling or forced timeouts
function SimplePersistGate({ children }: { children: React.ReactNode }) {
  return (
    <PersistGate
      loading={<PersistLoadingComponent />}
      persistor={persistor}
      onBeforeLift={() => {
        logger.info('Redux persist rehydration completed', {
          component: 'ReduxProvider',
          operation: 'rehydrationComplete'
        });
      }}
    >
      {children}
    </PersistGate>
  );
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <SimplePersistGate>
        {children}
      </SimplePersistGate>
    </Provider>
  );
}

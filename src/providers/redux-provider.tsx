'use client';

import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { logger } from '@/lib/utils/logger';
import { monitorAndCleanupStorage, repairPersistStorage } from '@/lib/utils/storage-management';

interface ReduxProviderProps {
  children: React.ReactNode;
}

// Enhanced loading component with timeout handling
function PersistLoadingComponent() {
  const [showTimeout, setShowTimeout] = useState(false);
  const [forceLoad, setForceLoad] = useState(false);

  useEffect(() => {
    // Show timeout warning after 10 seconds
    const timeoutWarning = setTimeout(() => {
      logger.warn('Redux persist taking longer than expected', {
        component: 'ReduxProvider',
        operation: 'persistRehydration',
        duration: 10000
      });
      setShowTimeout(true);
    }, 10000);

    // Force load after 15 seconds to prevent infinite hang
    const forceTimeout = setTimeout(() => {
      logger.error('Redux persist timed out, forcing load', {
        component: 'ReduxProvider',
        operation: 'persistRehydration',
        duration: 15000
      });
      setForceLoad(true);
    }, 15000);

    return () => {
      clearTimeout(timeoutWarning);
      clearTimeout(forceTimeout);
    };
  }, []);

  // If force load is triggered, bypass PersistGate
  if (forceLoad) {
    return null; // Let the app load without persistence
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading application...</p>
        {showTimeout && (
          <div className="mt-4 text-sm text-muted-foreground">
            <p>This is taking longer than usual.</p>
            <p className="text-xs opacity-60">Your data is being restored...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced PersistGate wrapper with error handling
function EnhancedPersistGate({ children }: { children: React.ReactNode }) {
  const [persistError] = useState<Error | null>(null);
  const [forceLoad, setForceLoad] = useState(false);

  useEffect(() => {
    // Monitor storage and repair if needed
    const initStorage = async () => {
      try {
        // Check for corrupted storage and repair
        const wasCorrupted = repairPersistStorage();
        if (wasCorrupted) {
          logger.info('Repaired corrupted persist storage on init', {
            component: 'ReduxProvider',
            operation: 'storageRepair'
          });
        }

        // Monitor storage usage
        await monitorAndCleanupStorage();
      } catch (error) {
        logger.error('Storage initialization failed', {
          component: 'ReduxProvider',
          operation: 'storageInit'
        }, error as Error);
      }
    };

    initStorage();

    // Listen for persist errors (future enhancement point)
    // const handlePersistError = (error: Error) => {
    //   logger.error('Redux persist error detected', {
    //     component: 'ReduxProvider',
    //     operation: 'persistError',
    //     error: error.message
    //   });
    //   setPersistError(error);
    // };

    // Force load timeout
    const forceTimeout = setTimeout(() => {
      logger.warn('Forcing app load due to persist timeout', {
        component: 'ReduxProvider', 
        operation: 'forceLoad'
      });
      setForceLoad(true);
    }, 20000); // 20 second absolute maximum

    return () => clearTimeout(forceTimeout);
  }, []);

  // If there's a persist error or force load, clear storage and continue
  if (persistError || forceLoad) {
    // Clear potentially corrupted storage
    try {
      localStorage.removeItem('persist:therapeuticAI');
      logger.info('Cleared potentially corrupted persist storage', {
        component: 'ReduxProvider',
        operation: 'storageClearance'
      });
    } catch (error) {
      logger.error('Failed to clear persist storage', {
        component: 'ReduxProvider',
        operation: 'storageClearance'
      }, error as Error);
    }

    return <>{children}</>;
  }

  return (
    <PersistGate
      loading={<PersistLoadingComponent />}
      persistor={persistor}
      onBeforeLift={() => {
        logger.info('Redux persist rehydration started', {
          component: 'ReduxProvider',
          operation: 'beforeLift'
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
      <EnhancedPersistGate>
        {children}
      </EnhancedPersistGate>
    </Provider>
  );
}
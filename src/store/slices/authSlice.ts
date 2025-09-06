import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { generateSecureRandomString } from '@/lib/utils/utils';

interface SetupData {
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
  secret: string;
}

interface AuthState {
  isAuthenticated: boolean;
  needsSetup: boolean;
  needsVerification: boolean;
  isLoading: boolean;
  error: string | null;

  setupData: SetupData | null;
  isSetupLoading: boolean;
  isVerifying: boolean;
  lastCheckedAt: number | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  needsSetup: false,
  needsVerification: false,
  isLoading: false,
  error: null,

  setupData: null,
  isSetupLoading: false,
  isVerifying: false,
  lastCheckedAt: null,
};

function headersWithRequestId(): Headers {
  const h = new Headers({ 'Content-Type': 'application/json' });
  const reqId = generateSecureRandomString(16, 'abcdefghijklmnopqrstuvwxyz0123456789');
  h.set('X-Request-Id', reqId);
  return h;
}

export const checkSessionStatus = createAsyncThunk(
  'auth/checkSessionStatus',
  async () => {
    const response = await fetch('/api/auth/session', {
      credentials: 'include',
      cache: 'no-cache',
      headers: headersWithRequestId(),
    });
    const raw = await response.json().catch(() => ({}));
    const payload = (raw && typeof raw === 'object' && 'success' in raw)
      ? (raw.success ? (raw.data ?? {}) : {})
      : raw;
    return {
      isAuthenticated: Boolean(payload?.isAuthenticated),
      needsSetup: Boolean(payload?.needsSetup),
      needsVerification: Boolean(payload?.needsVerification),
    };
  }
);

export const loadSetupData = createAsyncThunk(
  'auth/loadSetupData',
  async () => {
    const response = await fetch('/api/auth/setup', {
      cache: 'no-store',
      headers: headersWithRequestId(),
    });
    const raw = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = (raw && (raw.error?.message || raw.error)) || 'Failed to load setup data';
      throw new Error(errorMessage);
    }
    const data = (raw && raw.data) || null;
    if (!data) throw new Error('Invalid setup response');
    return data as SetupData;
  }
);

export const completeSetup = createAsyncThunk(
  'auth/completeSetup',
  async (args: { secret: string; backupCodes: string[]; verificationToken: string }) => {
    const response = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: headersWithRequestId(),
      body: JSON.stringify({
        secret: args.secret,
        backupCodes: args.backupCodes,
        verificationToken: args.verificationToken,
      }),
    });
    const raw = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = (raw && (raw.error?.message || raw.error)) || 'Verification failed';
      throw new Error(errorMessage);
    }
    return { success: true } as const;
  }
);

export const verifyLogin = createAsyncThunk(
  'auth/verifyLogin',
  async (args: { token: string; isBackupCode?: boolean }) => {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      credentials: 'include',
      redirect: 'manual',
      headers: headersWithRequestId(),
      body: JSON.stringify({ token: args.token, isBackupCode: Boolean(args.isBackupCode) }),
    });
    const raw = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = (raw && (raw.error?.message || raw.error)) || 'Verification failed';
      throw new Error(errorMessage);
    }
    return { success: true } as const;
  }
);

// Polls the session endpoint until authenticated or timeout
export const waitForAuthentication = createAsyncThunk(
  'auth/waitForAuthentication',
  async (args: { timeoutMs?: number; intervalMs?: number } = {}) => {
    const timeoutMs = args.timeoutMs ?? 5000;
    const intervalMs = args.intervalMs ?? 200;
    const started = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await fetch('/api/auth/session', {
        credentials: 'include',
        cache: 'no-cache',
        headers: headersWithRequestId(),
      });
      const raw = await res.json().catch(() => ({}));
      const data = (raw && (raw.data ?? raw)) || {} as { isAuthenticated?: boolean };
      if (data.isAuthenticated) {
        return true as const;
      }
      if (Date.now() - started > timeoutMs) {
        return false as const;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearSetupData(state) {
      state.setupData = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkSessionStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkSessionStatus.fulfilled, (state, action: PayloadAction<{ isAuthenticated: boolean; needsSetup: boolean; needsVerification: boolean }>) => {
        state.isAuthenticated = action.payload.isAuthenticated;
        state.needsSetup = action.payload.needsSetup;
        state.needsVerification = action.payload.needsVerification;
        state.isLoading = false;
        state.lastCheckedAt = Date.now();
      })
      .addCase(checkSessionStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to check session';
      })

      .addCase(loadSetupData.pending, (state) => {
        state.isSetupLoading = true;
        state.error = null;
      })
      .addCase(loadSetupData.fulfilled, (state, action: PayloadAction<SetupData>) => {
        state.isSetupLoading = false;
        state.setupData = action.payload;
      })
      .addCase(loadSetupData.rejected, (state, action) => {
        state.isSetupLoading = false;
        state.error = action.error.message || 'Failed to load setup data';
      })

      .addCase(completeSetup.pending, (state) => {
        state.isVerifying = true;
        state.error = null;
      })
      .addCase(completeSetup.fulfilled, (state) => {
        state.isVerifying = false;
        // Sensitive data should not remain in memory after completion
        state.setupData = null;
        state.isAuthenticated = true;
        state.needsSetup = false;
        state.needsVerification = false;
      })
      .addCase(completeSetup.rejected, (state, action) => {
        state.isVerifying = false;
        state.error = action.error.message || 'Failed to complete setup';
      })

      .addCase(verifyLogin.pending, (state) => {
        state.isVerifying = true;
        state.error = null;
      })
      .addCase(verifyLogin.fulfilled, (state) => {
        state.isVerifying = false;
        state.isAuthenticated = true;
        state.needsSetup = false;
        state.needsVerification = false;
      })
      .addCase(verifyLogin.rejected, (state, action) => {
        state.isVerifying = false;
        state.error = action.error.message || 'Verification failed';
      })
      .addCase(waitForAuthentication.pending, () => {
        // intentional no-op; UI remains enabled
      })
      .addCase(waitForAuthentication.fulfilled, (state, action: PayloadAction<boolean>) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.needsVerification = false;
          state.needsSetup = false;
        }
      })
      .addCase(waitForAuthentication.rejected, () => {
        // intentional no-op
      });
  },
});

export const { clearSetupData, clearAuthError } = authSlice.actions;
export default authSlice.reducer;



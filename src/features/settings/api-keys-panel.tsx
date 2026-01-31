/**
 * API Keys Settings Panel
 *
 * Allows users to manage their own API keys (BYOK) for AI providers.
 *
 * Features:
 * - Add/remove API keys for OpenAI
 * - Activate/deactivate BYOK mode (uses GPT-5 Mini)
 * - "Remember my key" checkbox (session-only storage with confirmation)
 * - Clear security warning about browser storage
 *
 * @module api-keys-panel
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useApiKeys, type Provider, PROVIDERS, BYOK_MODEL } from '@/hooks/use-api-keys';
import {
  Loader2,
  Check,
  X,
  Key,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Zap,
  Power,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

interface ProviderConfig {
  id: Provider;
  name: string;
  icon: string;
  keyPrefix: string;
  placeholder: string;
}

const PROVIDER_CONFIGS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    keyPrefix: 'sk-',
    placeholder: 'sk-proj-...',
  },
];

function getProviderConfig(id: Provider): ProviderConfig {
  return PROVIDER_CONFIGS.find((p) => p.id === id) ?? PROVIDER_CONFIGS[0];
}

function maskApiKey(key: string, provider: Provider): string {
  const config = getProviderConfig(provider);
  if (key.length <= 8) {
    return key.substring(0, 3) + '...' + key.substring(key.length - 3);
  }
  const prefix = key.substring(0, config.keyPrefix.length + 3);
  const suffix = key.substring(key.length - 3);
  return `${prefix}...${suffix}`;
}

interface ApiKeysPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface KeyEntryState {
  isEditing: boolean;
  inputValue: string;
  isValidating: boolean;
  validationError: string | null;
  showKey: boolean;
  remember: boolean;
  rememberPending: boolean;
}

const initialKeyEntryState: KeyEntryState = {
  isEditing: false,
  inputValue: '',
  isValidating: false,
  validationError: null,
  showKey: false,
  remember: false,
  rememberPending: false,
};

export function ApiKeysPanel({ open, onOpenChange }: ApiKeysPanelProps) {
  const {
    hasKey,
    setKey,
    removeKey,
    validateKey,
    isLoading,
    error,
    isRemembered,
    keys,
    isActive,
    setActive,
  } = useApiKeys();

  const { showToast } = useToast();

  const [entryStates, setEntryStates] = useState<Record<Provider, KeyEntryState>>(() =>
    PROVIDERS.reduce(
      (acc, p) => ({ ...acc, [p]: { ...initialKeyEntryState } }),
      {} as Record<Provider, KeyEntryState>
    )
  );

  const updateEntryState = useCallback((provider: Provider, updates: Partial<KeyEntryState>) => {
    setEntryStates((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], ...updates },
    }));
  }, []);

  const startEditing = useCallback(
    (provider: Provider) => {
      updateEntryState(provider, {
        isEditing: true,
        inputValue: '',
        validationError: null,
        showKey: false,
        remember: isRemembered(provider),
        rememberPending: false,
      });
    },
    [updateEntryState, isRemembered]
  );

  const cancelEditing = useCallback(
    (provider: Provider) => {
      updateEntryState(provider, { ...initialKeyEntryState });
    },
    [updateEntryState]
  );

  const handleInputChange = useCallback(
    (provider: Provider, value: string) => {
      updateEntryState(provider, {
        inputValue: value,
        validationError: null,
      });
    },
    [updateEntryState]
  );

  const handleRememberChange = useCallback(
    (provider: Provider, checked: boolean) => {
      if (checked) {
        updateEntryState(provider, { rememberPending: true });
        return;
      }
      updateEntryState(provider, { remember: false, rememberPending: false });
    },
    [updateEntryState]
  );

  const confirmRemember = useCallback(
    (provider: Provider) => {
      updateEntryState(provider, { remember: true, rememberPending: false });
    },
    [updateEntryState]
  );

  const cancelRemember = useCallback(
    (provider: Provider) => {
      updateEntryState(provider, { remember: false, rememberPending: false });
    },
    [updateEntryState]
  );

  const toggleShowKey = useCallback((provider: Provider) => {
    setEntryStates((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], showKey: !prev[provider].showKey },
    }));
  }, []);

  const handleValidateAndSave = useCallback(
    async (provider: Provider) => {
      const state = entryStates[provider];
      const key = state.inputValue.trim();

      if (state.rememberPending) {
        updateEntryState(provider, {
          validationError: 'Confirm key storage to remember this key.',
        });
        return;
      }

      if (!key) {
        updateEntryState(provider, { validationError: 'Please enter an API key' });
        return;
      }

      updateEntryState(provider, { isValidating: true, validationError: null });

      try {
        const result = await validateKey(provider, key);

        if (!result.valid) {
          updateEntryState(provider, {
            isValidating: false,
            validationError: result.error ?? 'Invalid API key',
          });
          return;
        }

        const success = await setKey(provider, key, state.remember);

        if (success) {
          updateEntryState(provider, { ...initialKeyEntryState });
        } else {
          updateEntryState(provider, {
            isValidating: false,
            validationError: 'Failed to save key',
          });
        }
      } catch (err) {
        updateEntryState(provider, {
          isValidating: false,
          validationError: err instanceof Error ? err.message : 'Validation failed',
        });
      }
    },
    [entryStates, validateKey, setKey, updateEntryState]
  );

  const handleRemoveKey = useCallback(
    (provider: Provider) => {
      removeKey(provider);
    },
    [removeKey]
  );

  const handleToggleActive = useCallback(() => {
    const newActive = !isActive;
    setActive(newActive);
    showToast({
      title: newActive ? 'BYOK Activated' : 'BYOK Deactivated',
      message: newActive
        ? `Now using ${BYOK_MODEL} with your API key`
        : 'Switched back to default models',
      type: newActive ? 'success' : 'info',
    });
  }, [isActive, setActive, showToast]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const editingProvider = PROVIDERS.find((p) => entryStates[p].isEditing);
        if (editingProvider) {
          cancelEditing(editingProvider);
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, entryStates, cancelEditing]);

  const hasOpenAIKey = hasKey('openai');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-border/50 border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Key className="text-primary h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">API Keys</DialogTitle>
              <p className="text-muted-foreground text-sm">Use your own OpenAI API key</p>
            </div>
          </div>
        </DialogHeader>

        <div className="custom-scrollbar max-h-[60vh] overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {PROVIDER_CONFIGS.map((config) => (
                <ProviderCard
                  key={config.id}
                  config={config}
                  hasKey={hasKey(config.id)}
                  keyValue={keys[config.id]}
                  isRemembered={isRemembered(config.id)}
                  entryState={entryStates[config.id]}
                  onStartEditing={() => startEditing(config.id)}
                  onCancelEditing={() => cancelEditing(config.id)}
                  onInputChange={(value) => handleInputChange(config.id, value)}
                  onRememberChange={(checked) => handleRememberChange(config.id, checked)}
                  onConfirmRemember={() => confirmRemember(config.id)}
                  onCancelRemember={() => cancelRemember(config.id)}
                  onToggleShowKey={() => toggleShowKey(config.id)}
                  onValidateAndSave={() => handleValidateAndSave(config.id)}
                  onRemoveKey={() => handleRemoveKey(config.id)}
                />
              ))}

              {/* Activation section - only show when key exists */}
              {hasOpenAIKey && (
                <Card className="border-border/50 border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {isActive ? 'BYOK Active' : 'BYOK Inactive'}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {isActive
                            ? `Using ${BYOK_MODEL} for all conversations`
                            : 'Using default Groq models'}
                        </p>
                      </div>
                      <Button
                        variant={isActive ? 'destructive' : 'default'}
                        size="sm"
                        onClick={handleToggleActive}
                        className={cn(
                          'gap-1.5',
                          !isActive && 'bg-emerald-600 hover:bg-emerald-700'
                        )}
                      >
                        {isActive ? (
                          <>
                            <Power className="h-3.5 w-3.5" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Zap className="h-3.5 w-3.5" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security notice */}
              <div className="mt-6 flex items-start gap-3 rounded-lg bg-amber-500/10 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <div className="text-sm leading-relaxed text-amber-200/90">
                  <p className="font-medium">Security notice</p>
                  <p className="mt-1 text-amber-200/70">
                    If you enable &quot;Remember my key&quot;, your API key will be stored in your
                    browser&apos;s local storage. Only enable this on trusted devices.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{error.message}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProviderCardProps {
  config: ProviderConfig;
  hasKey: boolean;
  keyValue: string | undefined;
  isRemembered: boolean;
  entryState: KeyEntryState;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onInputChange: (value: string) => void;
  onRememberChange: (checked: boolean) => void;
  onConfirmRemember: () => void;
  onCancelRemember: () => void;
  onToggleShowKey: () => void;
  onValidateAndSave: () => void;
  onRemoveKey: () => void;
}

function ProviderCard({
  config,
  hasKey,
  keyValue,
  isRemembered,
  entryState,
  onStartEditing,
  onCancelEditing,
  onInputChange,
  onRememberChange,
  onConfirmRemember,
  onCancelRemember,
  onToggleShowKey,
  onValidateAndSave,
  onRemoveKey,
}: ProviderCardProps) {
  const {
    isEditing,
    inputValue,
    isValidating,
    validationError,
    showKey,
    remember,
    rememberPending,
  } = entryState;

  return (
    <Card
      className={cn(
        'border-border/50 overflow-hidden border transition-all duration-200',
        hasKey && 'ring-1 ring-emerald-500/30'
      )}
    >
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full text-lg',
                hasKey ? 'bg-emerald-500/10' : 'bg-muted/50'
              )}
            >
              {hasKey ? (
                <span className="text-emerald-400">●</span>
              ) : (
                <span className="text-muted-foreground">○</span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.icon}</span>
                <span className="font-semibold">{config.name}</span>
              </div>
              <p className="text-muted-foreground text-sm">
                {hasKey ? (
                  <span className="text-emerald-400">
                    {keyValue ? maskApiKey(keyValue, config.id) : 'Configured'}{' '}
                    <Check className="mb-0.5 inline h-3 w-3" />
                    {isRemembered && <span className="ml-1 text-xs text-amber-400">(session)</span>}
                  </span>
                ) : (
                  'No key configured'
                )}
              </p>
            </div>
          </div>

          {!isEditing && (
            <Button
              variant={hasKey ? 'ghost' : 'secondary'}
              size="sm"
              onClick={hasKey ? onRemoveKey : onStartEditing}
              className={cn(hasKey && 'text-red-400 hover:bg-red-500/10 hover:text-red-400')}
            >
              {hasKey ? 'Remove' : 'Add Key'}
            </Button>
          )}
        </div>

        {/* Key entry form */}
        {isEditing && (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={config.placeholder}
                className={cn(
                  'pr-10',
                  validationError && 'border-red-500 focus-visible:ring-red-500'
                )}
                disabled={isValidating}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onValidateAndSave();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancelEditing();
                  }
                }}
                aria-label={`${config.name} API key`}
                aria-describedby={validationError ? `${config.id}-error` : undefined}
              />
              <button
                type="button"
                onClick={onToggleShowKey}
                className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                aria-label={showKey ? 'Hide API key' : 'Show API key'}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Remember checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${config.id}-remember`}
                checked={remember || rememberPending}
                onCheckedChange={(checked) => onRememberChange(checked === true)}
              />
              <label
                htmlFor={`${config.id}-remember`}
                className="text-muted-foreground cursor-pointer text-sm"
              >
                Remember my key for this session
              </label>
            </div>

            <div className="border-border/60 bg-muted/40 text-muted-foreground flex items-start gap-2 rounded-md border p-2 text-xs">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <div>
                <p className="text-foreground/80 font-medium">Key storage notice</p>
                <p>
                  Stored in browser session storage. Clears when the tab closes. Still vulnerable to
                  XSS.
                </p>
              </div>
            </div>

            {rememberPending && (
              <div className="border-border/60 bg-muted/60 flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                <span>Store this key until the tab closes?</span>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={onConfirmRemember} className="h-7">
                    Confirm & Remember
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onCancelRemember} className="h-7">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {validationError && (
              <p
                id={`${config.id}-error`}
                className="flex items-center gap-1.5 text-sm text-red-400"
                role="alert"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {validationError}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onValidateAndSave}
                disabled={isValidating || !inputValue.trim()}
                className="gap-1.5"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Validate & Save
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEditing}
                disabled={isValidating}
                className="gap-1.5"
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

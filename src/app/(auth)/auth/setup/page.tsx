'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadSetupData, completeSetup, waitForAuthentication } from '@/store/slices/authSlice';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { therapeuticInteractive } from '@/lib/ui/design-tokens';
import {useTranslations} from 'next-intl';

export default function TOTPSetupPage() {
  const t = useTranslations();
  const dispatch = useAppDispatch();
  const { setupData, isSetupLoading: isLoading, isVerifying } = useAppSelector(s => s.auth);
  const [verificationToken, setVerificationToken] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const hasFetched = useRef(false);
  const STORAGE_KEY = 'totp-setup-data';

  const fetchSetupData = useCallback(async () => {
    try {
      // Clear any previous error to prevent transient failure flash on fresh loads
      setError('');
      await dispatch(loadSetupData()).unwrap();
    } catch (err) {
      const message = (err as Error).message || '';
      if (message === 'TOTP already configured') {
        window.location.href = '/auth/verify';
        return;
      }
      setError(t('auth.setup.error.load'));
    }
  }, [dispatch, t]);

  useEffect(() => {
    // Prevent double execution in development mode
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSetupData();
  }, [fetchSetupData]);

  const handleVerification = async () => {
    if (!setupData || !verificationToken) {
      return;
    }

    setError('');

    try {
      await dispatch(completeSetup({
        secret: setupData.secret,
        backupCodes: setupData.backupCodes,
        verificationToken,
      })).unwrap();

      // Cleanup cached setup data once completed
      if (typeof window !== 'undefined') {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
      }

      // Robust redirect: poll server-side session until authenticated (no cookie reads)
      await dispatch(waitForAuthentication({ timeoutMs: 6000, intervalMs: 200 })).unwrap();
      window.location.replace('/');
    } catch (err) {
      const message = (err as Error).message || 'Verification failed';
      setError(message);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    const codes = setupData.backupCodes.join('\n');
    const blob = new Blob([codes], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-therapist-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBackupCodes = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
  };

  const copyManualKey = () => {
    if (!setupData) return;
    navigator.clipboard.writeText(setupData.manualEntryKey);
  };

  // Prevent initial flash of the failure card before the first load attempt finishes
  const showLoading = isLoading || (!setupData && !error);

  if (showLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('auth.setup.loading')}</p>
        </div>
      </div>
    );
  }

  if (!setupData && error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{t('auth.setup.failed.title')}</CardTitle>
            <CardDescription className="text-center">
              {t('auth.setup.failed.desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              {t('auth.setup.retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className={therapeuticInteractive.statusIconContainer}>
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-semibold mb-2">{t('auth.setup.title')}</h1>
          <p className="text-muted-foreground">{t('auth.setup.subtitle')}</p>
        </div>

        {setupData && step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('auth.setup.step1.title')}</CardTitle>
              <CardDescription>
                {t('auth.setup.step1.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Image 
                  src={setupData.qrCodeUrl} 
                  alt={t('auth.setup.qrAlt', { default: 'TOTP QR Code' })} 
                  width={200} 
                  height={200}
                  className="mx-auto border rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('auth.setup.step1.cantScan')}</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                    {setupData.manualEntryKey}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyManualKey}>
                    {t('auth.setup.copy')}
                  </Button>
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                {t('auth.setup.addedAccount')}
              </Button>
            </CardContent>
          </Card>
        )}

        {setupData && step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('auth.setup.step2.title')}</CardTitle>
              <CardDescription>
                {t('auth.setup.step2.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {setupData.backupCodes.map((code: string, index: number) => (
                  <code key={index} className="text-sm font-mono">
                    {code}
                  </code>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                  {t('auth.setup.download')}
                </Button>
                <Button variant="outline" onClick={copyBackupCodes} className="flex-1">
                  {t('auth.setup.copyAll')}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="saved-codes" 
                  checked={backupCodesSaved}
                  onChange={(e) => setBackupCodesSaved(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="saved-codes" className="text-sm">
                  {t('auth.setup.confirmSaved')}
                </label>
              </div>

              <Button 
                onClick={() => setStep(3)} 
                disabled={!backupCodesSaved}
                className="w-full"
              >
                {t('auth.setup.continueVerification')}
              </Button>
            </CardContent>
          </Card>
        )}

        {setupData && step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('auth.setup.step3.title')}</CardTitle>
              <CardDescription>
                {t('auth.setup.step3.desc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder={t('auth.setup.placeholder')}
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg font-mono"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <Button
                onClick={handleVerification}
                disabled={isVerifying || verificationToken.length !== 6}
                className="w-full"
              >
                {isVerifying ? t('auth.setup.verifying') : t('auth.setup.completeSetup')}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
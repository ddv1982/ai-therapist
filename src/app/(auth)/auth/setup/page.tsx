'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { therapeuticInteractive } from '@/lib/ui/design-tokens';

interface SetupData {
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
  secret: string;
}

export default function TOTPSetupPage() {
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    // Prevent double execution in development mode
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSetupData();
  }, []);

  const fetchSetupData = async () => {
    try {
      const response = await fetch('/api/auth/setup');
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const errorMessage = (payload && (payload.error?.message || payload.error)) || '';
        // If TOTP is already configured, redirect to verification
        if (response.status === 400 && errorMessage === 'TOTP already configured') {
          window.location.href = '/auth/verify';
          return;
        }
        throw new Error(errorMessage || 'Failed to fetch setup data');
      }
      const data = (payload && payload.data) || null;
      if (!data) {
        throw new Error('Invalid setup response');
      }
      setSetupData(data);
      setIsLoading(false);
    } catch {
      setError('Failed to load setup data');
      setIsLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!setupData || !verificationToken) {
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: setupData.secret,
          backupCodes: setupData.backupCodes,
          verificationToken,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (response.ok) {
        // Redirect to main app
        window.location.href = '/';
      } else {
        const errorMessage = (payload && (payload.error?.message || payload.error)) || 'Verification failed';
        setError(errorMessage);
      }
    } catch {
      setError('Failed to verify token');
    } finally {
      setIsVerifying(false);
    }
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;
    
    const codes = setupData.backupCodes.join('\\n');
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
    
    navigator.clipboard.writeText(setupData.backupCodes.join('\\n'));
  };

  const copyManualKey = () => {
    if (!setupData) return;
    
    navigator.clipboard.writeText(setupData.manualEntryKey);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading setup...</p>
        </div>
      </div>
    );
  }

  if (!setupData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Setup Failed</CardTitle>
            <CardDescription className="text-center">
              Unable to generate setup data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Retry
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
          <h1 className="text-3xl font-semibold mb-2">Set Up Two-Factor Authentication</h1>
          <p className="text-muted-foreground">Secure your AI Therapist with TOTP authentication</p>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Scan QR Code</CardTitle>
              <CardDescription>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <Image 
                  src={setupData.qrCodeUrl} 
                  alt="TOTP QR Code" 
                  width={200} 
                  height={200}
                  className="mx-auto border rounded-lg"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Can&apos;t scan? Enter this key manually:</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                    {setupData.manualEntryKey}
                  </code>
                  <Button size="sm" variant="outline" onClick={copyManualKey}>
                    Copy
                  </Button>
                </div>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                I&apos;ve Added the Account
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Save Backup Codes</CardTitle>
              <CardDescription>
                Store these codes safely. You can use them to access your account if you lose your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {setupData.backupCodes.map((code, index) => (
                  <code key={index} className="text-sm font-mono">
                    {code}
                  </code>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={downloadBackupCodes} className="flex-1">
                  Download
                </Button>
                <Button variant="outline" onClick={copyBackupCodes} className="flex-1">
                  Copy All
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
                  I have safely stored these backup codes
                </label>
              </div>

              <Button 
                onClick={() => setStep(3)} 
                disabled={!backupCodesSaved}
                className="w-full"
              >
                Continue to Verification
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Verify Setup</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app to complete setup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value.replace(/\\D/g, '').slice(0, 6))}
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
                {isVerifying ? 'Verifying...' : 'Complete Setup'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
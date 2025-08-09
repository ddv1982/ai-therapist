'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/primitives/button';
import { Input } from '@/components/ui/primitives/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/primitives/card';
import { clearAuthCache } from '@/hooks/auth/use-auth';
import { therapeuticInteractive } from '@/lib/ui/design-tokens';

export default function TOTPVerifyPage() {
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerification = async () => {
    if (!token) {
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          isBackupCode: useBackupCode,
        }),
        credentials: 'include', // Ensure cookies are included
        redirect: 'manual', // Handle redirects manually
      });

      // Handle response
      if (response.ok) {
        const data = await response.json();
        
        // Clear the auth cache to force refresh of authentication status
        clearAuthCache();
        
        console.log('Verification successful:', data);
        
        // Small delay to ensure cookies are set properly
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Debug: Check if cookies are available after verification
        const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const cookiesAvailable = document.cookie.includes('auth-session-token');
        console.log('Cookies after verification:', {
          hasCookie: cookiesAvailable,
          allCookies: document.cookie,
          isMobile
        });
        
        // For mobile devices, sometimes cookies take longer to be available
        // Add a retry mechanism for mobile
        if (isMobile && !cookiesAvailable) {
          console.log('Mobile device detected, waiting longer for cookie...');
          await new Promise(resolve => setTimeout(resolve, 300));
          
          const cookiesAvailableRetry = document.cookie.includes('auth-session-token');
          console.log('Cookie retry result:', {
            hasCookie: cookiesAvailableRetry,
            allCookies: document.cookie
          });
        }
        
        // Redirect to the main app
        window.location.replace(data.redirectUrl || '/');
      } else {
        // Handle error responses
        try {
          const data = await response.json();
          setError(data.error || 'Verification failed');
        } catch {
          setError('Verification failed');
        }
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify token');
      setIsVerifying(false);
    }
  };

  const handleTokenChange = (value: string) => {
    if (useBackupCode) {
      // Backup codes are alphanumeric and 8 characters
      setToken(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
    } else {
      // TOTP tokens are 6 digits
      setToken(value.replace(/\\D/g, '').slice(0, 6));
    }
  };

  const isTokenValid = useBackupCode ? token.length === 8 : token.length === 6;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className={therapeuticInteractive.statusIconContainer}>
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-semibold mb-2">Two-Factor Authentication</h1>
          <p className="text-muted-foreground">
            Enter your authentication code to access AI Therapist
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {useBackupCode ? 'Enter Backup Code' : 'Enter Authentication Code'}
            </CardTitle>
            <CardDescription>
              {useBackupCode 
                ? 'Enter one of your saved backup codes'
                : 'Enter the 6-digit code from your authenticator app'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={useBackupCode ? 'ABC12345' : '000000'}
                value={token}
                onChange={(e) => handleTokenChange(e.target.value)}
                className="text-center text-lg font-mono"
                maxLength={useBackupCode ? 8 : 6}
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleVerification}
              disabled={isVerifying || !isTokenValid}
              className="w-full"
            >
              {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setToken('');
                  setError('');
                }}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                {useBackupCode ? 'Use authenticator code instead' : 'Use backup code instead'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div className="text-blue-700 dark:text-blue-300 text-sm">
                  <p className="font-medium mb-1">Security Note:</p>
                  <p>This helps protect your therapeutic conversations and personal data from unauthorized access.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
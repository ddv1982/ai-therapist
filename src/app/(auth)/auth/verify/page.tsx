export const dynamic = 'force-dynamic';

import React from 'react';
import { VerifyForm } from '@/features/auth/components/verify-form';

export default function TOTPVerifyPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <VerifyForm />
    </div>
  );
}

import { SignIn } from '@clerk/nextjs';
import { metadata } from '@/app/layout';

export const generateMetadata = () => ({
  ...metadata,
  title: 'Sign In - AI Therapist',
  description: 'Sign in to your AI Therapist account to continue your therapeutic journey.',
});

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignIn afterSignInUrl="/" afterSignUpUrl="/" />
      </div>
    </div>
  );
}

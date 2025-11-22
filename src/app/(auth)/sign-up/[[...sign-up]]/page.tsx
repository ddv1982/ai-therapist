import { SignUp } from '@clerk/nextjs';
import { metadata } from '@/app/layout';

export const generateMetadata = () => ({
  ...metadata,
  title: 'Create Account - AI Therapist',
  description: 'Create an account to start your AI-powered therapeutic journey.',
});

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignUp afterSignInUrl="/" afterSignUpUrl="/" />
      </div>
    </div>
  );
}

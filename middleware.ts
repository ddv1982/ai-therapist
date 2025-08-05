import { NextRequest, NextResponse } from 'next/server';
import { isLocalhost } from '@/lib/utils';
import { getNetworkPassword } from '@/lib/network-auth';

// Rate limiting store (in-memory for simplicity)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  
  const entry = rateLimitStore.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxAttempts) {
    return false;
  }
  
  entry.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';
  const clientIP = getClientIP(request);
  
  // Skip middleware for most API routes, static files, and Next.js internals
  // But allow our auth endpoint to be processed
  if (
    (pathname.startsWith('/api') && !pathname.startsWith('/api/auth/network')) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Always allow localhost access without password
  if (isLocalhost(host)) {
    return NextResponse.next();
  }
  
  // Get the shared network password
  const networkPassword = getNetworkPassword();
  
  // Check for existing valid session
  const authCookie = request.cookies.get('network-auth-session');
  if (authCookie?.value === 'authenticated') {
    // Extend session on activity
    const response = NextResponse.next();
    response.cookies.set('network-auth-session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/'
    });
    return response;
  }
  
  // Check rate limiting
  if (!checkRateLimit(clientIP)) {
    return new Response('Too many authentication attempts. Please try again later.', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': '900' // 15 minutes
      }
    });
  }
  
  // Let API routes handle authentication
  if (request.method === 'POST' && pathname.startsWith('/api/auth/network')) {
    return NextResponse.next();
  }
  
  // Show authentication modal for network access
  return showAuthenticationModal();
}


function showAuthenticationModal(): NextResponse {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Network Access - AI Therapist</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: 'hsl(var(--card))',
                        'card-foreground': 'hsl(var(--card-foreground))',
                        primary: 'hsl(var(--primary))',
                        'primary-foreground': 'hsl(var(--primary-foreground))',
                        muted: 'hsl(var(--muted))',
                        'muted-foreground': 'hsl(var(--muted-foreground))',
                        border: 'hsl(var(--border))',
                    }
                }
            }
        }
    </script>
    <style>
        :root {
            --background: 0 0% 100%;
            --foreground: 222.2 84% 4.9%;
            --card: 0 0% 100%;
            --card-foreground: 222.2 84% 4.9%;
            --primary: 142 86% 28%;
            --primary-foreground: 355.7 100% 97.3%;
            --muted: 210 40% 96%;
            --muted-foreground: 215.4 16.3% 46.9%;
            --border: 214.3 31.8% 91.4%;
        }
        
        .dark {
            --background: 222.2 84% 4.9%;
            --foreground: 210 40% 98%;
            --card: 222.2 84% 4.9%;
            --card-foreground: 210 40% 98%;
            --primary: 142 86% 28%;
            --primary-foreground: 355.7 100% 97.3%;
            --muted: 217.2 32.6% 17.5%;
            --muted-foreground: 215 20.2% 65.1%;
            --border: 217.2 32.6% 17.5%;
        }
        
        body {
            background-color: hsl(var(--background));
            color: hsl(var(--foreground));
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div class="text-center mb-6">
                <div class="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                </div>
                <h1 class="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Network Access Protected</h1>
                <p class="text-gray-600 dark:text-gray-300 text-sm">Enter the network password to access your AI Therapist application</p>
            </div>
            
            <form id="authForm" class="space-y-4">
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Network Password
                    </label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password"
                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Enter password from server console"
                        required
                        autofocus
                    />
                </div>
                
                <button 
                    type="submit" 
                    id="submitBtn"
                    class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                    Access Application
                </button>
            </form>
            
            <div id="errorMessage" class="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm hidden"></div>
            
            <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div class="flex items-start">
                    <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="text-blue-700 dark:text-blue-300 text-sm">
                        <p class="font-medium mb-1">How to find your password:</p>
                        <p>Check the terminal/console where you started the server. The password is displayed when the app starts.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Auto-detect dark mode
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        }
        
        document.getElementById('authForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const submitBtn = document.getElementById('submitBtn');
            const errorMessage = document.getElementById('errorMessage');
            
            // Reset error state
            errorMessage.classList.add('hidden');
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Authenticating...';
            
            try {
                const response = await fetch('/api/auth/network', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password })
                });
                
                if (response.ok) {
                    // Redirect to home page
                    window.location.href = '/';
                } else {
                    const data = await response.json();
                    errorMessage.textContent = data.error || 'Authentication failed';
                    errorMessage.classList.remove('hidden');
                }
            } catch (error) {
                errorMessage.textContent = 'Network error. Please try again.';
                errorMessage.classList.remove('hidden');
            } finally {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Access Application';
            }
        });
        
        // Focus password field on page load
        document.getElementById('password').focus();
    </script>
</body>
</html>`;
  
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)  
     * - favicon.ico (favicon file)
     * We handle API routes manually in the middleware function
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
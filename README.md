# 🧠💙 AI Therapist - Compassionate AI Mental Health Support

A modern, responsive therapeutic AI application built with Next.js 14, providing compassionate mental health support through AI-powered conversations. Features beautiful dark/light modes, session management, and mobile-optimized chat experience.

## ✨ Features

### 🎨 Beautiful UI/UX
- **Dual Theme Support** - Elegant dark and light modes with smooth transitions
- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Glass Morphism Effects** - Modern frosted glass aesthetics
- **Smooth Animations** - Gentle transitions and micro-interactions
- **Shimmer Effects** - Interactive button animations

### 💬 Chat Experience
- **Real-time Streaming** - AI responses stream in real-time
- **Markdown Support** - Rich text formatting in AI responses
- **Session Management** - Create, save, and switch between therapy sessions
- **Mobile-Optimized Layout** - Full-width messages on mobile for better readability
- **Touch-Friendly** - Optimized touch interactions and gestures

### 🧠 Therapeutic Features
- **Professional AI Prompting** - Trained with therapeutic principles and techniques
- **Crisis Intervention** - Automatic safety responses for crisis situations
- **Session Reports** - AI-generated insights and progress tracking
- **Judgment-Free Environment** - Safe space for mental health discussions

### 🔧 Technical Features
- **Zero Configuration** - SQLite database with automatic setup
- **TOTP Authentication** - Secure two-factor authentication with device trust
- **Cross-Device Sessions** - Unified session access across all devices
- **Multiple AI Models** - Support for various Groq AI models
- **API Key Flexibility** - Environment variable or UI-based API key configuration
- **Dynamic Model Settings** - Adjustable temperature, max tokens, and top-p
- **Lazy Session Creation** - Sessions only created when user sends first message

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-gitlab-repo-url>
   cd ai-therapist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up your API key** (Choose one method)
   
   **Method 1: Environment Variable (Recommended)**
   ```bash
   cp .env.example .env.local
   # Edit .env.local and add your Groq API key
   GROQ_API_KEY=your_groq_api_key_here
   ```
   
   **Method 2: UI Configuration**
   - Leave environment variable empty
   - Enter API key in the Settings panel within the app

4. **Initialize the database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:3000`
   - **First-time setup**: Scan the QR code with your authenticator app for secure access
   - Start your first therapeutic conversation!

## 📱 Usage

### Authentication Setup
1. **First Visit**: App will guide you through TOTP setup with QR code
2. **Authenticator App**: Use Google Authenticator, Authy, or similar apps
3. **Device Trust**: Each device gets 30-day authentication sessions
4. **Backup Codes**: Save the backup codes for account recovery
5. **Network Access**: Authentication required for network URLs (not localhost)

### Starting a Session
1. Click "Start New Session" or begin typing in the input field
2. Sessions are automatically created when you send your first message
3. Switch between sessions using the sidebar
4. **Cross-Device Access**: All sessions available on any authenticated device

### Mobile Experience  
- Tap the menu button to open/close the sidebar
- Messages are full-width for better readability
- Touch-optimized input and send button
- Sidebar auto-closes when selecting a chat on mobile
- Mobile-optimized authentication flow

### Settings Configuration
- **API Key**: Configure your Groq API key
- **Model Selection**: Choose from available AI models
- **Advanced Settings**: Adjust temperature, max tokens, and top-p values
- **Theme Toggle**: Switch between light and dark modes
- **Security Settings**: Manage trusted devices and backup codes

## 🛠 Development

### Available Scripts

#### Core Development
- `npm run dev` - Start development server (network accessible)
- `npm run dev:local` - Start development server (localhost only)  
- `npm run build` - Build for production
- `npm run start` - Start production server (network accessible)
- `npm run start:local` - Start production server (localhost only)
- `npm run lint` - Run ESLint

#### Database Management
- `npm run db:generate` - Generate Prisma client after schema changes
- `npm run db:push` - Push schema changes to database without migrations
- `npm run db:migrate` - Create and apply database migrations  
- `npm run db:studio` - Open Prisma Studio database GUI

#### Utilities
- `npm run network-ip` - Display network IP addresses

### Project Structure

```
ai-therapist/
├── app/                          # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── chat/               # Chat streaming endpoint
│   │   ├── sessions/           # Session management
│   │   ├── messages/           # Message handling
│   │   └── errors/             # Error logging
│   ├── auth/                   # Authentication pages
│   │   ├── setup/              # TOTP setup page
│   │   └── verify/             # TOTP verification page
│   ├── globals.css             # Global styles and design system
│   ├── layout.tsx              # Root layout component
│   └── page.tsx                # Main chat interface
├── components/                  # Reusable UI components
│   ├── auth/                   # Authentication components
│   └── ui/                     # shadcn/ui components
├── lib/                        # Utility libraries
│   ├── auth-middleware.ts      # Authentication middleware
│   ├── totp-service.ts         # TOTP token management
│   ├── device-fingerprint.ts   # Device trust management
│   ├── db.ts                   # Database configuration
│   ├── therapy-prompts.ts      # AI therapeutic prompts
│   └── theme-context.tsx       # Theme management
├── prisma/                     # Database schema and SQLite file
├── scripts/                    # Utility scripts
│   └── migrate-to-single-user.js # Session consolidation script
└── types/                      # TypeScript type definitions
```

### Design System

#### Typography (4 Sizes Only)
- `text-3xl font-semibold` - Main headers
- `text-xl font-semibold` - Section headings  
- `text-base` - Chat messages and body text
- `text-sm` - Timestamps and metadata

#### 8pt Grid System
- All spacing uses multiples of 8px or 4px
- Consistent `p-2` (8px), `p-4` (16px), `p-6` (24px), etc.

#### Color Hierarchy (60/30/10 Rule)
- 60%: Neutral backgrounds (`bg-background`, `bg-muted`)
- 30%: Text and subtle UI (`text-foreground`, `border-border`)
- 10%: Therapeutic highlights (`bg-primary`, `bg-accent`)

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```bash
# Required
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your_groq_api_key_here"

# Optional (for authentication features)
NEXTAUTH_SECRET="your_nextauth_secret_here"
```

### API Key Configuration
- **Environment Variable**: Set `GROQ_API_KEY` in `.env.local`
- **UI Configuration**: Enter API key in Settings panel if environment variable not set
- **Detection**: App automatically detects if environment variable exists

### Model Configuration
- **Default Model**: qwen/qwen3-32b
- **Available Models**: All Groq models (Featured, Production, Preview)
- **Token Limits**: Automatically enforced per model
- **Settings**: Temperature (0-2), Max Tokens (256-131K), Top P (0.1-1.0)

## 🛡️ Safety & Security Features

### Crisis Intervention
- Automatic detection of crisis keywords
- Immediate safety resource responses
- Professional therapeutic boundaries
- No medical diagnosis or medication advice

### Privacy & Security
- **TOTP Authentication** - Time-based two-factor authentication
- **Device Trust Management** - 30-day trusted device sessions
- **Local SQLite Database** - All data stored locally
- **No External Data Sharing** - Data only sent to Groq API for responses
- **Backup Code Recovery** - Secure account recovery options
- **Network Access Protection** - Authentication required for non-localhost access

### Authentication Features
- **QR Code Setup** - Easy authenticator app configuration
- **Multiple Device Support** - Cross-device session access
- **Session Management** - Automatic session expiration and renewal
- **Mobile Optimized** - Touch-friendly authentication flows

## 🔗 Cross-Device Session Management

### Unified Sessions
- **Single User System** - All sessions use unified user ID (`therapeutic-ai-user`)
- **Cross-Device Access** - Sessions created on mobile, desktop, or any device are accessible everywhere
- **Network URL Support** - Sessions work consistently whether accessing via localhost or network IP
- **Session Continuity** - Start a conversation on your phone, continue on your computer

### Session Migration
If you have existing device-specific sessions from before this update:

```bash
# Consolidate all sessions to unified user
node scripts/migrate-to-single-user.js
```

This script will:
- Move all existing sessions to the unified user account
- Preserve all messages and reports
- Clean up old device-specific user accounts
- Enable cross-device session access

## 🎨 Theming

### Dark Mode
- Deep, comfortable colors for evening therapy sessions
- Enhanced contrast for readability
- Subtle gradients and glass effects

### Light Mode  
- Warm, therapeutic colors with high contrast
- Vibrant blues and teals for therapeutic branding
- Clean, professional appearance

### Custom Theme Variables
The app uses CSS custom properties for theming:
- `--primary`: Main therapeutic blue
- `--accent`: Rich therapeutic teal  
- `--background`: Main background color
- `--foreground`: Primary text color

## 📱 Mobile Optimization

### Responsive Features
- Dynamic viewport height handling (`100dvh`)
- Touch-optimized interactions
- iOS zoom prevention on inputs
- Orientation change support
- Sidebar auto-collapse on mobile

### Mobile-Specific UX
- Full-width message layout
- Compact message headers with role indicators
- Touch-friendly button sizes
- Optimized keyboard interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** - For providing the AI inference API
- **shadcn/ui** - For the beautiful UI component library
- **Next.js** - For the incredible React framework
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide React** - For the beautiful icons

## 🆘 Support

If you encounter any issues:

1. Check the [troubleshooting section](#troubleshooting) 
2. Review the [environment configuration](#environment-variables)
3. Open an issue on GitLab with detailed information

### Troubleshooting

**Authentication Issues**
- **TOTP Setup**: Ensure time sync between device and server
- **Device Trust**: Clear browser cookies to reset device authentication
- **Backup Codes**: Use backup codes if authenticator app is unavailable
- **Network Access**: Authentication only required for network URLs (not localhost)

**API Key Issues**
- Ensure your Groq API key is valid and has sufficient credits
- Check if the key is properly set in environment or UI

**Database Issues**  
- Run `npm run db:generate && npm run db:push` to reset database
- Check that SQLite file has write permissions
- Use `scripts/migrate-to-single-user.js` to consolidate existing sessions

**Build Issues**
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

**Session Migration**
- Run migration script to consolidate device-specific sessions:
  ```bash
  node scripts/migrate-to-single-user.js
  ```

---

**Built with ❤️ for mental health support and AI-powered therapy**
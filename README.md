# 🧠💙 AI Therapist - Compassionate Mental Health Support

A modern therapeutic AI application providing compassionate mental health support through AI-powered conversations with enterprise-grade security and professional therapeutic frameworks.

## ✨ Features

### 🎨 Beautiful Experience
- **Dual Theme Support** - Elegant dark and light modes
- **Mobile Optimized** - Touch-friendly responsive design
- **Real-time Streaming** - AI responses with smooth animations
- **Session Management** - Create and switch between therapy sessions

### 🧠 Therapeutic Framework
- **Professional AI Prompting** - Trained with therapeutic principles
- **CBT & ERP Support** - Cognitive Behavioral Therapy and Exposure Response Prevention
- **Schema Therapy** - Deep pattern recognition and healing approaches
- **Crisis Intervention** - Automatic safety responses
- **Session Reports** - AI-generated insights and progress tracking

### 🔒 Enterprise Security
- **AES-256-GCM Encryption** - All sensitive data encrypted
- **TOTP Authentication** - Secure two-factor authentication
- **Cross-Device Sessions** - Access sessions on any authenticated device
- **HIPAA-Compliant Logging** - No sensitive data exposure

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- SQLite (included)

### Installation

1. **Clone and install**
   ```bash
   git clone <your-repo-url>
   cd ai-therapist
   npm install
   ```

2. **Set up environment**
   ```bash
   # Create .env.local and add your keys
   cat > .env.local <<'EOF'
   DATABASE_URL="file:./prisma/dev.db"
   GROQ_API_KEY=your_groq_api_key_here
   ENCRYPTION_KEY=your_32_character_encryption_key_here
   NEXTAUTH_SECRET=your_nextauth_secret_here
   # Local-only opts
   BYPASS_AUTH=true
   RATE_LIMIT_DISABLED=true
   EOF
   ```

3. **Initialize database**
   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

5. **Open browser**
   - Navigate to `http://localhost:4000`
   - Complete TOTP setup for secure access
   - Start your first therapeutic conversation

## 🛠 Development Commands

### Core Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Management  
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes
- `npm run db:studio` - Open Prisma Studio

### Testing
- `npm run test` - Run unit tests (945 tests, 100% pass rate)
- `npm run test:coverage` - Generate coverage report

## 🧠 AI Model System

### Stateless 3-Tier Selection
The app automatically selects the optimal AI model for each message:

- **🧠 Deep Thinking** - Complex analysis with `openai/gpt-oss-120b`
- **🔍 Web Search** - Current research with browser tools  
- **💬 Regular Chat** - Fast responses with `openai/gpt-oss-20b`

Triggers like "think hard", "search for", or CBT content automatically select the appropriate model.

## 🎯 Therapeutic Features

### CBT Draft Management
- **Real-time Auto-save** - Never lose therapeutic progress
- **Encrypted Storage** - AES-256-GCM encryption for all drafts
- **Cross-Session Persistence** - Access drafts across devices
- **Visual Feedback** - "Saved ✓" indicators

### ERP Therapy Support
- **Compassionate Approach** - Gradual exposure hierarchy
- **Pattern Detection** - Identifies compulsive behaviors and intrusive thoughts
- **Safety Mechanisms** - Built-in protections against forcing behaviors

### Session Reports
- **AI Analysis** - Professional therapeutic insights
- **Privacy Protected** - No personal details reproduced
- **Growth Focused** - Emphasizes healing and progress

## 🔧 Configuration

### Environment Variables
```bash
# Required
DATABASE_URL="file:./prisma/dev.db"
GROQ_API_KEY="your_groq_api_key"

# Security
NEXTAUTH_SECRET="your_secret"
ENCRYPTION_KEY="your_32_char_key"

# Development only
BYPASS_AUTH="true"  # localhost only
```

### API Key Setup
- **Environment Variable** (recommended): Set `GROQ_API_KEY`
- **UI Configuration**: Enter in sidebar if env var not set

## 📱 Mobile Experience

- **Touch Optimized** - All interactions designed for mobile
- **Full-width Messages** - Better readability on small screens
- **Auto-collapsing Sidebar** - Clean mobile navigation
- **Authentication Flow** - Mobile-optimized TOTP setup

## 🛡️ Security Features

### Authentication
- **QR Code Setup** - Easy authenticator app configuration
- **Device Trust** - 30-day authenticated sessions
- **Enhanced Fingerprinting** - Multiple entropy sources
- **Backup Codes** - Encrypted recovery options

### Data Protection
- **Field-level Encryption** - Database encryption for sensitive data
- **CSRF Protection** - Signed tokens prevent attacks
- **Content Security Policy** - XSS attack prevention
- **No External Sharing** - Data only sent to Groq API

## 📊 Testing & Quality

### Comprehensive Test Suite
- **945 Total Tests** with 100% pass rate
- **Security Testing** - Encryption and authentication validation
- **Component Testing** - React Testing Library coverage
- **API Testing** - Complete endpoint validation
- **ERP Framework** - 48 tests for therapeutic patterns

### Test Organization
```
__tests__/
├── api/              # API endpoint tests
├── components/       # React component tests  
├── lib/             # Utility function tests
├── security/        # Security implementation tests
└── integration/     # End-to-end integration tests
```

## 🤝 Troubleshooting

### Common Issues

**Authentication Problems**
- Check time sync for TOTP
- Clear cookies to reset device trust
- Verify `ENCRYPTION_KEY` is set

**API Key Issues**  
- Confirm Groq API key validity
- Check sufficient credits
- Verify environment variable or UI setting

**Database Issues**
- Run `npm run db:generate && npm run db:push`
- Database auto-created at `prisma/dev.db`

**Build Issues**
- Clear `.next` folder: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`
- Run tests: `npm test`

## 🏗️ Architecture

### Modern Stack
- **Next.js 14** with App Router and Turbopack
- **TypeScript** in strict mode
- **Tailwind CSS** with design system
- **Prisma** with SQLite database
- **AI SDK 5** with Groq integration

### Domain-Driven Structure
```
src/
├── app/             # Next.js App Router
├── components/      # React components by domain
├── lib/            # Utilities by domain
├── types/          # TypeScript definitions
└── hooks/          # Custom React hooks
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq** - AI inference API
- **shadcn/ui** - Component library
- **Next.js** - React framework
- **Tailwind CSS** - Styling framework

---

**Built with ❤️ for mental health support and AI-powered therapy**
# AI Therapist API Documentation

Welcome to the AI Therapist API documentation. This comprehensive guide covers all aspects of the therapeutic AI chat application's API endpoints, architecture, and implementation details.

## 📋 Overview

The AI Therapist application is a compassionate mental health support platform that provides professional-quality therapeutic conversations through AI. The API is built with Next.js 14, TypeScript, and modern web standards.

### Key Features

- **Real-time Streaming Chat**: Server-sent events for responsive conversations
- **Session Management**: Persistent conversation history and context
- **Professional Reports**: AI-generated therapeutic insights and analysis
- **Email Integration**: Automated report delivery with multiple service support
- **Comprehensive Validation**: Zod-based input validation and error handling
- **Mobile Optimization**: Responsive design with iOS-specific improvements
- **Accessibility**: WCAG-compliant interface with screen reader support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Groq API key (get one at [console.groq.com](https://console.groq.com))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ai-therapist

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Configure your environment
echo "DATABASE_URL=postgresql://user:password@localhost:5432/ai_therapist" >> .env.local
echo "GROQ_API_KEY=your_groq_api_key_here" >> .env.local

# Set up database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GROQ_API_KEY` | Optional* | Groq API key for AI models |
| `NEXTAUTH_SECRET` | No | Future authentication feature |

*Can be provided via UI if not set in environment

## 📚 API Documentation

### OpenAPI Specification

The complete API specification is available in OpenAPI 3.0 format:

- **File**: [`docs/api.yaml`](./api.yaml)
- **Format**: OpenAPI 3.0.3
- **Validator**: [Swagger Editor](https://editor.swagger.io/)

### Core Endpoints

#### Chat Operations
- `POST /api/chat` - Send message and receive streaming AI response
- `POST /api/messages` - Save messages to database

#### Session Management  
- `GET /api/sessions` - List all chat sessions
- `POST /api/sessions` - Create new session
- `DELETE /api/sessions/{id}` - Delete session

#### Report Generation
- `POST /api/reports` - Generate therapeutic session report
- `POST /api/reports/send` - Generate and email report

#### Configuration
- `GET /api/models` - List available AI models
- `GET /api/env` - Check environment configuration

### Request/Response Examples

#### Starting a Chat Session

```typescript
// Create session
const session = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Anxiety Management' })
});

// Send message with streaming response
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: 'I need help with anxiety' }
    ],
    apiKey: 'your-groq-key',
    model: 'openai/gpt-oss-120b',
    temperature: 0.7
  })
});

// Handle streaming response
const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = new TextDecoder().decode(value);
  // Process server-sent event data
}
```

#### Email Report Generation

```typescript
const reportResponse = await fetch('/api/reports/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session-uuid',
    emailAddress: 'user@example.com',
    messages: sessionMessages,
    emailConfig: {
      service: 'smtp',
      smtpHost: 'smtp.gmail.com',
      smtpUser: 'your-email@gmail.com',
      smtpPass: 'your-app-password',
      fromEmail: 'therapist@yourapp.com'
    }
  })
});
```

## 🏗️ Architecture

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.6+
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod schemas
- **AI Integration**: Groq API
- **Styling**: Tailwind CSS with shadcn/ui
- **Testing**: Jest, React Testing Library, Playwright

### Project Structure

```
ai-therapist/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   │   ├── chat/          # Real-time chat
│   │   ├── sessions/      # Session management
│   │   ├── reports/       # Report generation
│   │   └── models/        # AI model info
│   └── page.tsx           # Main chat interface
├── components/            # React components
│   ├── chat/             # Chat-specific components
│   └── ui/               # Reusable UI components
├── lib/                  # Utility libraries
│   ├── validation.ts     # Zod schemas
│   ├── logger.ts         # Structured logging
│   ├── groq-client.ts    # AI integration
│   └── therapy-prompts.ts # Therapeutic prompts
├── types/                # TypeScript definitions
├── prisma/               # Database schema
├── docs/                 # API documentation
└── __tests__/            # Test suites
```

### Database Schema

```mermaid
erDiagram
    User {
        string id PK
        string email
        string name
        datetime createdAt
        datetime updatedAt
    }
    
    Session {
        string id PK
        string userId FK
        string title
        string status
        datetime startedAt
        datetime endedAt
        datetime createdAt
        datetime updatedAt
    }
    
    Message {
        string id PK
        string sessionId FK
        string role
        text content
        datetime timestamp
        datetime createdAt
    }
    
    SessionReport {
        string id PK
        string sessionId FK
        json keyPoints
        text therapeuticInsights
        json patternsIdentified
        json actionItems
        string moodAssessment
        text progressNotes
        datetime createdAt
    }
    
    User ||--o{ Session : creates
    Session ||--o{ Message : contains
    Session ||--o| SessionReport : generates
```

## 🔒 Security Considerations

### Input Validation
- All endpoints use Zod schemas for request validation
- SQL injection prevention through Prisma ORM
- XSS protection with content sanitization

### API Security
- CORS restrictions for cross-origin requests
- Rate limiting considerations (implement as needed)
- Environment variable protection for sensitive data

### Data Privacy
- Session data encrypted in transit
- Minimal data collection approach
- User consent for data storage

## 🧪 Testing

### Test Coverage

```bash
# Unit tests
npm run test

# Integration tests with coverage
npm run test:coverage

# End-to-end tests
npm run test:e2e

# Run all tests
npm run test:all
```

### Test Structure

- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: API endpoints and database operations
- **E2E Tests**: Complete user workflows
- **Coverage Target**: 70% minimum across all metrics

## 🚀 Deployment

### Development

```bash
npm run dev          # Network accessible
npm run dev:local    # Localhost only
```

### Production

```bash
npm run build        # Build application
npm run start        # Production server (network accessible)
npm run start:local  # Production server (localhost only)
```

### Environment Setup

1. **Database**: Set up PostgreSQL and configure `DATABASE_URL`
2. **API Keys**: Configure `GROQ_API_KEY` or allow UI input
3. **Email**: Configure email service in `/app/api/reports/send/route.ts`
4. **Domain**: Update CORS settings for production domain

## 📈 Monitoring & Observability

### Logging

The application uses structured logging with context tracking:

```typescript
import { logger } from '@/lib/logger';

// Basic logging
logger.info('User started session', { userId: '123' });

// Error logging with stack trace
logger.error('Database error', { userId: '123' }, error);

// API-specific logging
logger.apiError('/api/chat', error, requestContext);
```

### Health Checks

- Database connectivity via Prisma
- AI service availability via Groq API
- Environment configuration validation

## 🤝 Contributing

### Development Guidelines

1. **Code Style**: Follow TypeScript strict mode and ESLint rules
2. **Testing**: Write tests for new features and bug fixes
3. **Documentation**: Update API docs for endpoint changes
4. **Validation**: Add Zod schemas for new data structures

### Pull Request Process

1. Create feature branch from `main`
2. Write comprehensive tests
3. Update documentation as needed
4. Ensure all tests pass
5. Request code review

## 📞 Support

### Resources

- **Issues**: [GitHub Issues](https://github.com/your-org/ai-therapist/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/ai-therapist/discussions)
- **Documentation**: This README and OpenAPI specification

### Professional Disclaimer

⚠️ **Important**: This AI application provides supportive conversation but is not a replacement for professional mental health care. Users experiencing crisis situations should contact qualified mental health professionals or emergency services.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **Groq**: AI inference platform
- **OpenAI**: Model architecture inspiration
- **shadcn/ui**: Component library foundation
- **Therapeutic Community**: Mental health advocacy and guidance
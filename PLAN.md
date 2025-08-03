# Therapist AI App - Development Plan

## Project Overview
A compassionate, judgment-free AI therapist application built with Next.js 14+ and shadcn/ui v4, powered by Qwen3-32B model via Groq API. The app provides professional therapeutic support with session continuity and detailed progress reports.

## Core Design Principles

### Typography System

**4 Font Sizes Only:**
- Size 1: Session headers, main titles
- Size 2: Section headings, important prompts
- Size 3: Chat messages, body text
- Size 4: Timestamps, metadata labels

**2 Font Weights Only:**
- Semibold: Headers, emphasis, key insights
- Regular: Chat content, general UI text

### 8pt Grid System
- All spacing values divisible by 8 or 4
- Consistent padding/margins: 8px, 16px, 24px, 32px, 48px
- Chat message spacing: 16px between messages, 8px internal padding

### 60/30/10 Color Rule
- 60%: Neutral backgrounds (bg-background, card backgrounds)
- 30%: Text and subtle UI elements (text-foreground, borders)
- 10%: Therapeutic accent color (calming blue/green for highlights, buttons)

### Visual Hierarchy
- Clean, therapy-focused interface
- Logical grouping of chat, controls, and session management
- Calming, professional aesthetic

## Technical Architecture

### Framework & Styling
- **Framework:** Next.js 14+ with React Server Components
- **Styling:** shadcn/ui v4 components with Tailwind CSS v4
- **State Management:** React Context + useState for chat state
- **Database:** PostgreSQL with Prisma ORM for session storage
- **Authentication:** NextAuth.js for user sessions

### API Integration
- **Model:** qwen/qwen3-32b via Groq API
- **Environment:** GROQ_API_KEY for authentication
- **Configuration:**
```json
{
  "model": "qwen/qwen3-32b",
  "temperature": 0.6,
  "max_completion_tokens": 40960,
  "top_p": 0.95,
  "stream": true,
  "reasoning_effort": "default"
}
```

## Core Features

### 1. Therapeutic AI Personality
- **Compassion-based approach:** Warm, understanding responses
- **Judgment-free environment:** Non-critical, accepting tone
- **Professional knowledge base:**
  - Family systems therapy
  - Behavioral pattern recognition
  - Mental health condition awareness
  - Multiple therapy approaches (CBT, DBT, humanistic, etc.)

### 2. Chat Interface
- Real-time streaming responses
- Message history with timestamps
- Typing indicators during AI response
- Message status indicators (sent, delivered, read)

### 3. Session Management
- Session start/end controls
- Session timer display
- Auto-save conversation state
- Session history navigation

### 4. Context Persistence
**Database Schema:**
```sql
Users (id, email, created_at, updated_at)
Sessions (id, user_id, title, started_at, ended_at, status)
Messages (id, session_id, role, content, timestamp)
SessionReports (id, session_id, key_points, action_items, insights, created_at)
```

### 5. Session Reports
- Automatically generated after session end
- **Report Contents:**
  - Key discussion points
  - Identified patterns/themes
  - Therapeutic insights
  - Recommended focus areas
  - Progress indicators
  - Action items for reflection

## File Structure
```
therapist-ai-app/
├── app/
│   ├── globals.css                 # Tailwind v4 + shadcn/ui styles
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Dashboard/session selector
│   ├── chat/
│   │   ├── page.tsx               # Main chat interface
│   │   └── [sessionId]/
│   │       └── page.tsx           # Specific session chat
│   ├── reports/
│   │   ├── page.tsx               # Reports overview
│   │   └── [sessionId]/
│   │       └── page.tsx           # Individual session report
│   └── api/
│       ├── chat/
│       │   └── route.ts           # Groq API integration
│       ├── sessions/
│       │   └── route.ts           # Session CRUD operations
│       └── reports/
│           └── route.ts           # Report generation
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── chat/
│   │   ├── chat-interface.tsx     # Main chat component
│   │   ├── message-bubble.tsx     # Individual message
│   │   ├── typing-indicator.tsx   # AI typing animation
│   │   └── session-controls.tsx   # Start/end session
│   ├── reports/
│   │   ├── session-report.tsx     # Report display
│   │   └── report-summary.tsx     # Report overview
│   └── layout/
│       ├── sidebar.tsx            # Session navigation
│       └── header.tsx             # App header
├── lib/
│   ├── db.ts                      # Database connection
│   ├── groq-client.ts             # Groq API client
│   ├── therapy-prompts.ts         # System prompts
│   └── utils.ts                   # Utility functions
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migrations
└── types/
    ├── chat.ts                    # Chat-related types
    ├── session.ts                 # Session types
    └── report.ts                  # Report types
```

## Component Architecture

### Core Components

#### 1. ChatInterface Component
```typescript
interface ChatInterfaceProps {
  sessionId: string;
  initialMessages?: Message[];
}
```
- Real-time message streaming
- Auto-scroll to latest message
- Message input with therapeutic prompting
- Session status display

#### 2. MessageBubble Component
```typescript
interface MessageBubbleProps {
  message: Message;
  isUser: boolean;
  timestamp: Date;
}
```
- Follows 8pt grid spacing
- User messages: right-aligned, accent color
- AI messages: left-aligned, neutral styling
- Timestamp formatting

#### 3. SessionControls Component
```typescript
interface SessionControlsProps {
  sessionId?: string;
  onStartSession: () => void;
  onEndSession: () => void;
  sessionDuration: number;
}
```
- Start/end session buttons
- Session timer
- Session status indicator

#### 4. SessionReport Component
```typescript
interface SessionReportProps {
  report: SessionReport;
  session: Session;
}
```
- Key insights display
- Action items list
- Progress visualization
- Export functionality

## Database Schema

### Tables
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Session reports table
CREATE TABLE session_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  key_points TEXT[],
  therapeutic_insights TEXT[],
  patterns_identified TEXT[],
  action_items TEXT[],
  mood_assessment VARCHAR(100),
  progress_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Integration

### Groq Client Setup
```typescript
// lib/groq-client.ts
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const createTherapyCompletion = async (messages: Message[]) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: THERAPY_SYSTEM_PROMPT
      },
      ...messages
    ],
    model: 'qwen/qwen3-32b',
    temperature: 0.6,
    max_completion_tokens: 40960,
    top_p: 0.95,
    stream: true,
    reasoning_effort: 'default'
  });

  return completion;
};
```

### System Prompt Design
```typescript
// lib/therapy-prompts.ts
export const THERAPY_SYSTEM_PROMPT = `
You are a compassionate, professional AI therapist with expertise in:

- Family systems therapy and generational patterns
- Cognitive-behavioral therapy (CBT) techniques
- Dialectical behavior therapy (DBT) skills
- Humanistic and person-centered approaches
- Trauma-informed care
- Mental health condition recognition

Core Principles:
- Always respond with compassion and without judgment
- Create a safe, non-threatening therapeutic space
- Ask thoughtful, open-ended questions
- Reflect emotions and validate experiences
- Identify behavioral patterns gently
- Offer practical coping strategies when appropriate
- Maintain professional boundaries
- Never provide medical diagnoses or medication advice

Remember: You are here to listen, understand, and guide through therapeutic conversation.
`;
```

## Implementation Phases

### Phase 1: Core Foundation (Week 1-2)
- [ ] Next.js 14 project setup with shadcn/ui v4
- [ ] Database schema and Prisma setup
- [ ] Basic authentication with NextAuth.js
- [ ] Groq API integration and testing
- [ ] Core UI components following design principles

### Phase 2: Chat Interface (Week 3-4)
- [ ] Real-time chat interface with streaming
- [ ] Message persistence and retrieval
- [ ] Session management (start/end)
- [ ] Context loading from previous sessions
- [ ] Typing indicators and message status

### Phase 3: Therapeutic Features (Week 5-6)
- [ ] Advanced therapeutic prompting system
- [ ] Pattern recognition in conversations
- [ ] Mood tracking integration
- [ ] Session continuity with context awareness
- [ ] Safety checks and crisis intervention prompts

### Phase 4: Reports & Analytics (Week 7-8)
- [ ] Automated session report generation
- [ ] Key insights extraction
- [ ] Progress tracking over time
- [ ] Export functionality for reports
- [ ] Data visualization for progress

### Phase 5: Polish & Testing (Week 9-10)
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Accessibility compliance
- [ ] Security audit
- [ ] User experience refinement

## Styling Guidelines

### Color Scheme (Therapeutic Theme)
```css
/* globals.css - Tailwind v4 with @theme */
@theme {
  --color-background: oklch(0.99 0 0); /* Soft white */
  --color-foreground: oklch(0.15 0 0); /* Warm dark gray */
  --color-primary: oklch(0.65 0.12 220); /* Calming blue */
  --color-secondary: oklch(0.75 0.08 160); /* Gentle green */
  --color-accent: oklch(0.70 0.10 190); /* Therapeutic teal */
  --color-muted: oklch(0.95 0 0); /* Light background */
  --color-border: oklch(0.90 0 0); /* Subtle borders */
}
```

### Typography Scale
```css
/* Following 4-size system */
.text-therapy-xl { /* Size 1 - Headers */
  font-size: 2rem;
  font-weight: 600;
  line-height: 1.2;
}

.text-therapy-lg { /* Size 2 - Subheadings */
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.text-therapy-base { /* Size 3 - Body text */
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
}

.text-therapy-sm { /* Size 4 - Small text */
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.4;
}
```

## Security & Privacy Considerations

### Data Protection
- End-to-end encryption for sensitive conversations
- HIPAA-compliant data handling procedures
- Regular data purging policies
- User consent mechanisms
- Audit logging for access patterns

### AI Safety
- Content filtering for harmful outputs
- Crisis intervention detection and routing
- Professional boundaries enforcement
- Regular prompt injection testing
- Escalation procedures for severe cases

## Success Metrics

### User Experience
- Session completion rates
- User retention over time
- Average session duration
- User satisfaction scores
- Therapeutic progress indicators

### Technical Performance
- API response times < 2 seconds
- 99.9% uptime availability
- Real-time streaming latency < 500ms
- Database query performance
- Error rates < 0.1%

## Future Enhancements

### Advanced Features
- Voice-to-text therapy sessions
- Integration with wearable mood tracking
- Group therapy session support
- Professional therapist handoff system
- Mobile app development
- Multi-language support

### AI Improvements
- Fine-tuned therapy-specific models
- Personalized therapeutic approaches
- Predictive crisis intervention
- Integration with mental health assessments
- Continuous learning from anonymized sessions

This plan provides a comprehensive roadmap for building a professional, compassionate AI therapist application while strictly adhering to the design principles outlined in your guidelines.
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (network accessible)
- `npm run dev:local` - Start development server (localhost only)
- `npm run build` - Build for production
- `npm run start` - Start production server (network accessible)
- `npm run start:local` - Start production server (localhost only)
- `npm run network-ip` - Display network IP addresses
- `npm run lint` - Run ESLint

### Database Management
- `npm run db:generate` - Generate Prisma client after schema changes
- `npm run db:push` - Push schema changes to database without migrations
- `npm run db:migrate` - Create and apply database migrations
- `npm run db:studio` - Open Prisma Studio database GUI

### Important Notes
- Always run `npm run db:generate` after modifying `prisma/schema.prisma`
- Use `db:push` for development, `db:migrate` for production deployments
- The app requires PostgreSQL database and Groq API key to function
- `npm run dev` binds to `0.0.0.0` for network access from other devices
- Use `npm run dev:local` if you only want localhost access

## Architecture Overview

### Therapeutic AI Application
This is a compassionate AI therapist application built with specific therapeutic principles and safety considerations. The architecture centers around providing professional mental health support through AI conversation.

### Key Architectural Components

**Database Schema (Prisma + PostgreSQL)**
- `User` → `Session` → `Message` relationship for chat history
- `SessionReport` for therapeutic insights and progress tracking
- All models use UUID primary keys and proper cascade deletes
- Database stores conversation history for session continuity

**API Integration Pattern**
- Chat API (`/api/chat`) streams responses from Groq API using qwen-2.5-72b-instruct model
- API key is passed from frontend settings rather than environment variables for user flexibility

**Therapeutic System Design**
- System prompts in `lib/therapy-prompts.ts` define AI personality and therapeutic approach
- Session reports use AI to generate therapeutic insights and action items
- Email report generation allows users to receive session summaries via email

**Frontend State Management**
- React Context + useState for chat state (no external state management) 
- Real-time streaming implemented with ReadableStream API
- Session management integrated into main chat interface
- Email report modal with mobile-responsive design

### Design System Constraints

**Typography System (4 Sizes Only)**
- `text-3xl font-semibold` for main headers
- `text-xl font-semibold` for section headings  
- `text-base` for chat messages and body text
- `text-sm` for timestamps and metadata

**8pt Grid System**
- All spacing must be divisible by 8px or 4px
- Use Tailwind classes: `p-2` (8px), `p-4` (16px), `p-6` (24px), `p-8` (32px), `p-12` (48px)

**Color Hierarchy (60/30/10 Rule)**
- 60%: `bg-background`, `bg-muted` for neutral backgrounds
- 30%: `text-foreground`, `border-border` for text and subtle UI
- 10%: `bg-primary`, `bg-accent` for therapeutic highlights and buttons

### Technology Stack Specifics

**Tailwind CSS v3 Configuration**
- Uses HSL CSS variables for theming: `hsl(var(--background))`
- shadcn/ui components with custom therapeutic color scheme
- PostCSS configuration with autoprefixer for browser compatibility
- Custom utilities in `globals.css` for consistent therapeutic styling

**Next.js 14+ App Router**
- Server components where possible
- API routes use streaming for real-time chat responses
- File-based routing with grouped routes under `app/`

**Groq API Integration**
- Streaming chat completions with custom therapeutic system prompts
- Full model selection from Groq's catalog (Featured, Production, Preview)
- Advanced settings: Temperature (0-2), Max Tokens (256-131K), Top P (0.1-1.0)
- API key can be provided via UI settings or GROQ_API_KEY environment variable
- Automatic filtering of `<think></think>` tags from AI responses (complete response buffering)
- Model-specific token limits displayed and enforced (e.g., Qwen 40K, Llama 131K, Gemma 8K)
- Session management with auto-generated titles and delete functionality

### Critical Safety Features

- System bypasses normal AI processing for immediate safety intervention

**Therapeutic Boundaries**
- AI system prompt enforces professional therapeutic principles
- No medical diagnosis or medication advice allowed
- Maintains compassionate, judgment-free conversation tone

### Component Structure

**Main Chat Interface** (`app/page.tsx`)
- Single-page application with sidebar for sessions and settings
- Real-time streaming chat with typing indicators
- Integrated session management with create/delete functionality
- Model-specific token limits with dynamic slider constraints
- Session titles auto-generated from first user message
- API key configuration with environment variable detection

**UI Components** (`components/ui/`)
- shadcn/ui based components adapted for therapeutic use
- Custom Button, Card, Textarea components following design system
- All components use consistent `cn()` utility for class merging

### Environment Requirements

**Required Environment Variables**
- `DATABASE_URL` - PostgreSQL connection string
- `GROQ_API_KEY` - Groq API key (auto-detected by frontend, hides manual input when present)
- `NEXTAUTH_SECRET` - For future authentication features

**Optional Environment Variables (for Email Reports)**
- Configure your preferred email service in `/app/api/reports/send/route.ts`
- Examples: SendGrid, Nodemailer (SMTP), AWS SES, or any email service

**API Key Behavior**
- If `GROQ_API_KEY` is set in environment, the settings panel shows "✓ API Key Configured"
- If not set, users can manually enter API key in settings panel
- Frontend checks `/api/env` route to detect if environment variable exists

**Database Setup**
- PostgreSQL required with UUID extension
- Prisma handles all database operations
- Schema supports cascading deletes for data integrity
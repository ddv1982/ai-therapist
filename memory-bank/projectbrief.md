# Project Brief

AI Therapist is a modern therapeutic web application that provides compassionate mental health support through AI-powered conversations. The product emphasizes clinical soundness (CBT, ERP, Schema Therapy), strong privacy and security (field-level encryption, TOTP, no IP logging), and a polished chat-first UX optimized for mobile and desktop.

## Core Objectives
- Deliver safe, empathetic, and useful therapeutic conversations.
- Provide CBT diary workflows and generate actionable session reports.
- Maintain robust privacy: encrypted data at rest, minimal logging, and no external data sharing beyond Groq.
- Ensure reliability and performance via caching, circuit breaking, and request deduplication.
- Keep the codebase simple, typed, and maintainable with consistent patterns.

## User Value
- Immediate, judgment-free support with clinically informed guidance.
- Clear artifacts of progress (session reports, CBT diary entries).
- Consistent experience across devices with strong authentication.

## Scope (Initial)
- Chat interface with streaming responses.
- CBT diary flow culminating in a reflective summary before sending to chat.
- Secure authentication with enhanced TOTP and trusted devices.
- Session management and memory features that respect privacy.

## Non-Goals (for now)
- Multi-tenant user management beyond single-user local deployment.
- Third-party analytics that could compromise privacy.



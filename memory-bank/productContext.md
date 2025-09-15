# Product Context

## Why this exists
People need accessible, private, and consistent therapeutic support. Many tools are chatbots or journaling apps without clinical guardrails or strong privacy. AI Therapist blends a high-quality chat experience with CBT/ERP frameworks and rigorous security.

## Problems solved
- Fragmented experience between journaling and chat → unified CBT diary to chat handoff.
- Poor privacy defaults → encryption, minimal logging, and local-friendly setup.
- Inconsistent model usage → centralized model selection with AI SDK 5 providers.
- Fragile sessions and drafts → Redux-based state with persistence safeguards.

## How it should work
- Users write CBT entries through a guided, step-by-step flow. Final reflection precedes "Send to Chat" and stays in the current conversation until explicitly sent.
- Chat uses streaming, stable layout, and consistent typography. Session switching is explicit.
- Session reports include only sections supported by the chat/diary context; irrelevant sections are omitted.
- Authentication via TOTP with device trust; verification endpoint accessible in LAN dev without prior auth.

## User experience goals
- Fast, stable UI with no layout jank and minimal shimmer.
- Clear saving states and error recovery.
- Mobile-first ergonomics and PWA-friendly behavior.
- Respectful defaults for privacy and security without getting in the way.

## Personas
- Individual seeking self-guided therapeutic support.
- Developer/operator running locally who values observability and safety.

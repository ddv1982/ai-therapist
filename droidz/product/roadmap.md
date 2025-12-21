# Therapist AI App — Roadmap

Status cadence: build in feature-first slices, respect existing import aliases, keep security and safety gates enforced in every phase.

## Phase 0: Foundation (done, maintain)
- Core AI therapy chat (CBT/ERP/Schema), session reports, session switching.
- Security posture: Clerk-authenticated, server-only Convex, field-level encryption, CSP, webhook verification.
- Performance: Next.js 16 App Router + React 19, Turbopack, streaming responses; i18n (EN/NL) and dark-mode UX.
- Ongoing: keep tests green (Jest/Playwright), lint + type checks on every change.

## Phase 1: Trust & Quality (0–3 months) — Must Have
- **Safety & clinical guardrails**: reinforce crisis detection/escalation flows; add clinician review notes in reports.
- **Session quality scoring**: lightweight rubric for adherence to CBT/ERP/Schema patterns; surface score in reports.
- **Latency budget**: <500ms first token P95 in prod; add perf monitors and alerts.
- **Data protection**: periodic encryption key rotation playbook; audit Convex ownership checks for all queries/mutations.

## Phase 2: Guided Practice & Insights (3–6 months) — Should Have
- **Guided exercises**: in-chat breathing/grounding flows and CBT thought records with stored completions.
- **Mood check-ins**: daily/weekly prompts; trend view tied to sessions; respectful defaults for privacy.
- **Progress dashboards**: per-user goals, streaks, and skills practiced; exportable summaries for clinician review.
- **Report upgrades**: cross-session themes, homework suggestions, and clear next-step actions.

## Phase 3: Collaboration & Scale (6–12 months) — Could Have
- **Clinician workspace**: read-only report review, feedback annotations, and share-back to user (with consent).
- **Team/organization readiness**: feature flags for cohorts, audit trails, and configurable retention windows.
- **Mobile polish**: offline-tolerant flows and PWA hardening; evaluate native shell only if justified by usage.
- **Model flexibility**: BYOK/local model routing guardrails; cost controls and usage caps per org/user.

## Phase 4: Expansion (12+ months) — Future
- **Advanced modalities**: add ACT/DBT tracks once safety validated.
- **Integrations**: calendar reminders for exercises, secure data export to clinician systems (opt-in).
- **Enterprise**: SSO/SAML, data residency options, org-level analytics.

## Delivery Principles
- Ship in thin vertical slices per feature folder; keep alias imports (`@/*`, `@convex/*`, `@tests/*`).
- Every shipped item must include: tests (unit + critical E2E where relevant), lint/type clean, and safety review.
- Protect user trust: no feature launches without crisis-handling verification and privacy review.
   - **Description**: Enhanced crisis intervention
   - **Features**:
     - Instant crisis line numbers (by region)
     - Safety plan creation
     - Emergency contacts management
     - Immediate coping strategies
   - **Success Metrics**: <1 second to display crisis resources
   - **Effort**: 1 week

8. **Additional Therapeutic Frameworks**
   - **Description**: Expand beyond CBT/ERP/Schema
   - **Features**:
     - Dialectical Behavior Therapy (DBT)
     - Acceptance and Commitment Therapy (ACT)
     - Internal Family Systems (IFS)
     - Mindfulness-Based Stress Reduction (MBSR)
   - **Success Metrics**: 85%+ accurate framework application
   - **Effort**: 5 weeks (ongoing refinement)

#### 🎯 Personalization & Context

**Priority**: Should Have

9. **User Preferences**
   - **Description**: Customize therapeutic experience
   - **Features**:
     - Preferred therapeutic approaches
     - Conversation style settings (direct vs gentle)
     - Topic preferences and boundaries
     - Session length preferences
   - **Success Metrics**: 50%+ customize settings
   - **Effort**: 2 weeks

10. **Contextual Awareness**
    - **Description**: Remember user context across sessions
    - **Features**:
      - Long-term memory of key information
      - Recurring challenge tracking
      - Goal and commitment reminders
      - Relationship mapping
    - **Success Metrics**: 75%+ feel AI "remembers them"
    - **Effort**: 4 weeks

11. **Smart Suggestions**
    - **Description**: Proactive recommendations
    - **Features**:
      - Session topic suggestions based on patterns
      - Optimal session timing recommendations
      - Exercise suggestions based on mood
      - Resource recommendations
    - **Success Metrics**: 40%+ click suggestions
    - **Effort**: 3 weeks

#### 📱 User Experience Improvements

**Priority**: Should Have

12. **Enhanced Mobile Experience**
    - **Description**: Native-like mobile functionality
    - **Features**:
      - Voice input for hands-free journaling
      - Push notifications for reminders
      - Offline mode for journaling
      - Haptic feedback for interactions
    - **Success Metrics**: 80%+ mobile users rate UX excellent
    - **Effort**: 4 weeks

13. **Accessibility Enhancements**
    - **Description**: Make app usable for everyone
    - **Features**:
      - Screen reader optimization
      - High contrast dark theme options
      - Font size customization
      - Keyboard navigation improvements
      - WCAG 2.1 AA compliance
    - **Success Metrics**: 100% WCAG 2.1 AA compliance
    - **Effort**: 3 weeks

14. **Onboarding Experience**
    - **Description**: Help new users get started
    - **Features**:
      - Interactive tutorial
      - Sample therapeutic conversation
      - Feature discovery prompts
      - Customization wizard
    - **Success Metrics**: 70%+ complete onboarding
    - **Effort**: 2 weeks

#### 🤝 Social & Community (Optional)

**Priority**: Could Have

15. **Anonymous Peer Support**
    - **Description**: Connect with others (optional feature)
    - **Features**:
      - Opt-in anonymous community forum
      - Shared experiences (with consent)
      - Peer support groups by topic
      - Moderation and safety features
    - **Success Metrics**: 20%+ opt into community
    - **Effort**: 6 weeks
    - **Note**: Requires careful privacy consideration

### Phase 2 Priorities (MoSCoW Method)

#### Must Have (Q1 2026)

1. Personal Dashboard
2. Mood Tracking
3. Progress Visualization
4. Enhanced Session Reports
5. Crisis Resources Enhancement

#### Should Have (Q2 2026)

6. Guided Exercises
7. Therapeutic Journaling
8. Additional Frameworks (DBT, ACT)
9. User Preferences
10. Contextual Awareness
11. Enhanced Mobile Experience
12. Accessibility Enhancements
13. Onboarding Experience

#### Could Have (End of Q2 2026)

14. Smart Suggestions
15. Anonymous Peer Support (evaluate feasibility)

#### Won't Have (Postponed to Phase 3)

- Native mobile apps (iOS/Android)
- Provider integrations
- Enterprise features
- API access for third parties

---

## Phase 3: Growth (🚀 FUTURE)

**Timeline**: Q3-Q4 2026 (6 months)  
**Status**: 🚀 Future  
**Goal**: Scale platform and expand reach

### Feature Categories

#### 📱 Native Mobile Applications

16. **iOS App**
    - Native Swift/SwiftUI application
    - Apple Health integration
    - Siri shortcuts
    - Widget support
    - Apple Watch complications

17. **Android App**
    - Native Kotlin/Jetpack Compose
    - Google Fit integration
    - Google Assistant integration
    - Home screen widgets

#### 🏥 Provider Integration

18. **Therapist Collaboration**
    - Optional sharing of AI session insights with therapist
    - Homework progress tracking
    - Therapist dashboard for monitoring
    - Integration with EHR systems

19. **Referral Network**
    - Directory of licensed therapists
    - AI-assisted therapist matching
    - Seamless transition from AI to human therapy
    - Follow-up after human therapy sessions

#### 🌐 Global Expansion

20. **Internationalization**
    - Support for 10+ languages
    - Cultural adaptation of therapeutic approaches
    - Regional crisis resources
    - Local payment methods

21. **Localized AI Models**
    - Language-specific therapeutic training
    - Cultural context awareness
    - Regional mental health frameworks

#### 🤖 Advanced AI Capabilities

22. **Voice Interactions**
    - Voice-based therapy sessions
    - Speech emotion detection
    - Natural conversation flow
    - Text-to-speech for AI responses

23. **Predictive Analytics**
    - Risk assessment algorithms
    - Early warning for mental health decline
    - Proactive intervention suggestions
    - Pattern prediction across user base

24. **Personalized AI Models**
    - Fine-tuned models per user (privacy-preserving)
    - Learning from user feedback
    - Adaptive conversation strategies
    - Improved context understanding

#### 💼 B2B & Enterprise

25. **Employee Assistance Programs (EAP)**
    - White-label deployment for companies
    - Aggregate (anonymized) insights for HR
    - Usage analytics and ROI tracking
    - Custom branding and therapeutic focuses

26. **Educational Institutions**
    - Student mental health support
    - Campus crisis intervention
    - Integration with student services
    - Parental opt-in for minors

27. **Healthcare Organizations**
    - Integration with hospital systems
    - Pre/post-therapy supplementary support
    - Care coordination features
    - Insurance billing support

### Phase 3 Priorities

#### Q3 2026

- Native mobile apps (iOS & Android)
- Provider integration foundations
- Internationalization (5 languages)

#### Q4 2026

- Voice interactions
- Predictive analytics
- B2B pilot programs
- Expanded language support (10+ languages)

---

## Phase 4: Platform (💡 VISION)

**Timeline**: 2027+  
**Status**: 💡 Long-term Vision  
**Goal**: Build comprehensive mental health ecosystem

### Strategic Initiatives

#### 🌟 Ecosystem Development

28. **Developer API**
    - Public API for integrations
    - Webhooks for events
    - Custom therapeutic modules
    - Partner integrations

29. **Therapeutic Content Marketplace**
    - Third-party exercises and programs
    - Guided courses from experts
    - Specialized frameworks (trauma, grief, relationships)
    - Revenue sharing with creators

30. **Research Platform**
    - Anonymized data for mental health research
    - Partnership with academic institutions
    - Clinical trial participation
    - Evidence generation for AI therapy efficacy

#### 🏆 Market Leadership

31. **Insurance Coverage**
    - Partnerships with insurance providers
    - Reimbursement codes for AI therapy
    - Pre-authorization workflows
    - Claims processing

32. **Clinical Validation**
    - Published research studies
    - FDA clearance for therapeutic claims (if applicable)
    - Clinical guideline compliance
    - Partnerships with medical societies

33. **Global Mental Health Impact**
    - Non-profit partnerships
    - Free access programs for underserved populations
    - Disaster/crisis response capabilities
    - Public health collaborations

---

## Feature Request Process

### How We Prioritize

We evaluate feature requests using the **RICE Framework**:

- **Reach**: How many users will this benefit?
- **Impact**: How much will it improve the experience? (0.25-3x scale)
- **Confidence**: How sure are we about Reach and Impact? (%)
- **Effort**: How many person-weeks required?

**RICE Score = (Reach × Impact × Confidence) / Effort**

Higher RICE scores get prioritized within each phase.

### Request Submission

1. **Internal Team**: Submit via GitHub Issues with `feature-request` label
2. **User Feedback**: Collected through in-app feedback and support channels
3. **Research Insights**: From user interviews and analytics

### Evaluation Criteria

✅ **Align with mission** - Supports accessible, secure, compassionate therapy  
✅ **User value** - Clear benefit to user experience  
✅ **Technical feasibility** - Can be built with existing stack  
✅ **Security & privacy** - Maintains our security standards  
✅ **Scalability** - Won't create performance bottlenecks  
✅ **Resource availability** - Team has bandwidth to build and maintain

---

## Success Criteria by Phase

### Phase 1: MVP Foundation (✅ Complete)

- ✅ Core therapeutic chat operational
- ✅ Enterprise security implemented
- ✅ 1,000+ active users
- ✅ 80%+ user satisfaction
- ✅ 99.9% uptime
- ✅ All tests passing

### Phase 2: Enhancement (Target)

- 📊 10,000+ active users
- 📊 70%+ return rate (7-day)
- 📊 85%+ rate features as helpful
- 📊 50%+ use advanced features (mood tracking, exercises)
- 📊 Average 15+ min session length
- 📊 8+ sessions per user per month

### Phase 3: Growth (Target)

- 🚀 100,000+ active users
- 🚀 Mobile apps launched (iOS & Android)
- 🚀 10+ languages supported
- 🚀 Provider partnerships established
- 🚀 B2B pilot programs active
- 🚀 20% month-over-month growth

### Phase 4: Platform (Vision)

- 💡 1M+ active users
- 💡 Insurance partnerships secured
- 💡 Clinical validation published
- 💡 API ecosystem established
- 💡 Global mental health impact demonstrated

---

## Technology Evolution

### Current Stack (Phase 1)

- Next.js 16, React 19, TypeScript
- Convex backend
- React Query state management
- Clerk authentication
- Groq AI models
- Tailwind CSS v4

### Planned Additions (Phase 2)

- Advanced analytics libraries (D3.js, Recharts)
- Audio/video processing for exercises
- Enhanced mobile PWA capabilities
- Real-time notifications

### Future Considerations (Phase 3+)

- Native mobile frameworks (Swift, Kotlin)
- Voice AI and speech recognition
- Machine learning pipelines for personalization
- Distributed architecture for global scale
- GraphQL API layer

---

## Risk Management

### Technical Risks

| Risk                             | Impact   | Probability | Mitigation                                              |
| -------------------------------- | -------- | ----------- | ------------------------------------------------------- |
| AI model failures                | High     | Medium      | Comprehensive testing, human review, fallback responses |
| Performance degradation at scale | High     | Medium      | Load testing, caching, CDN, database optimization       |
| Security vulnerabilities         | Critical | Low         | Security audits, penetration testing, bug bounty        |
| Third-party service outages      | Medium   | Medium      | Redundancy, circuit breakers, graceful degradation      |

### Product Risks

| Risk                           | Impact   | Probability | Mitigation                                                |
| ------------------------------ | -------- | ----------- | --------------------------------------------------------- |
| Feature scope creep            | Medium   | High        | Strict roadmap adherence, RICE prioritization             |
| User adoption challenges       | High     | Medium      | User research, iterative testing, onboarding optimization |
| Regulatory compliance issues   | Critical | Low         | Legal review, HIPAA compliance, transparency              |
| Competition from large players | High     | Medium      | Focus on quality, community, therapeutic excellence       |

---

## Dependencies & Prerequisites

### Phase 2 Dependencies

- Phase 1 completion ✅
- Analytics infrastructure setup
- User research on feature priorities
- Design system expansion

### Phase 3 Dependencies

- Phase 2 feature validation
- Mobile development team hiring
- International legal/regulatory review
- AI voice model selection

### Phase 4 Dependencies

- Phase 3 market validation
- Research partnerships established
- Regulatory pathway identified
- Enterprise sales team built

---

## Maintenance & Ongoing Work

### Continuous Improvements (All Phases)

#### Security & Compliance

- Regular security audits (quarterly)
- Penetration testing (bi-annual)
- Dependency updates (monthly)
- Compliance reviews (quarterly)

#### Performance & Reliability

- Performance monitoring and optimization
- Error tracking and resolution
- Uptime monitoring and alerts
- Load testing for scale

#### Quality Assurance

- Maintain 100% test pass rate
- Add tests for new features
- E2E test coverage expansion
- Automated regression testing

#### User Experience

- A/B testing for UX improvements
- User feedback analysis
- Accessibility audits
- Design refinements

#### Therapeutic Effectiveness

- AI response quality monitoring
- Therapeutic framework validation
- Crisis response testing
- User outcome tracking

---

## Changelog & Version History

### Version 1.0 (Current)

- Initial roadmap creation
- Phase 1 completion documentation
- Phase 2-4 planning

---

## Document Information

**Version**: 1.1  
**Last Updated**: December 4, 2025  
**Owner**: Product Team  
**Review Frequency**: Quarterly  
**Status**: Active

For more context, see:

- [Product Mission](./mission.md)
- [Technical Stack Documentation](./tech-stack.md)
- [Project README](../../README.md)

---

**Questions or suggestions?** Submit a GitHub Issue with the `roadmap` label or contact the product team.

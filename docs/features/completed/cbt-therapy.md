# CBT Therapy Feature

## **Overview**
Complete Cognitive Behavioral Therapy implementation with 10+ interactive components, guided workflows, and comprehensive data management for therapeutic interventions.

## **Key Components**

### **CBT Form Components**
- **Situation Prompt** - Initial situation assessment and description
- **Emotion Scale** - Multi-dimensional emotion rating and tracking
- **Thought Record** - Automatic thought identification and analysis
- **Schema Modes** - Core belief and schema pattern recognition
- **Challenge Questions** - Cognitive restructuring techniques
- **Rational Thoughts** - Balanced thought development
- **Action Plan** - Behavioral intervention planning
- **Final Emotion Reflection** - Outcome assessment and progress tracking

### **Chat Integration**
- **CBT Message Components** - Specialized chat interface for therapy
- **Step-by-step Guidance** - Contextual help and instructions
- **Progress Indication** - Visual workflow progression
- **Data Validation** - Input validation and error handling
- **Export Functionality** - Session data export capabilities

### **Data Management**
- **CBT Data Manager** - Centralized data handling and state management
- **Form Schema Validation** - Comprehensive input validation
- **Step Mapping** - Intelligent workflow navigation
- **Data Persistence** - Local and session storage management
- **Export Utilities** - Multiple format exports (PDF, JSON, etc.)

## **Implementation Details**

### **CBT Workflow Structure**
```typescript
// CBT Step Sequence
const cbtSteps = [
  'situation',           // Describe the situation
  'emotions',            // Identify emotions and intensity
  'thoughts',            // Capture automatic thoughts
  'schemas',              // Identify core beliefs/schemas
  'challenges',           // Challenge negative thoughts
  'rational',              // Develop balanced thoughts
  'action',                // Create action plan
  'reflection'            // Final emotion assessment
]
```

### **Component Architecture**
```typescript
// Main CBT Form
const CBTForm = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [cbtData, setCbtData] = useCBTData()
  
  return (
    <CBTStepWrapper currentStep={currentStep}>
      {renderCurrentStep()}
    </CBTStepWrapper>
  )
}
```

### **Data Schema**
```typescript
interface CBTData {
  situation: string
  emotions: Array<{
    name: string
    intensity: number
    color: string
  }>
  thoughts: string[]
  schemas: string[]
  challenges: string[]
  rationalThoughts: string[]
  actionPlan: string[]
  finalEmotions: Array<{
    name: string
    intensity: number
  }>
  timestamp: Date
}
```

## **File Structure**
```
src/features/therapy/cbt/
├── cbt-export-button.tsx              // Export functionality
├── cbt-form-schema.ts               // Validation schemas
├── cbt-form.tsx                     // Main form component
├── index.ts                         // Public exports

src/features/therapy/cbt/chat-components/
├── action-plan.tsx                  // Action planning
├── cbt-message.tsx                    // Chat interface
├── challenge-questions.tsx            // Thought challenging
├── core-belief.tsx                    // Schema identification
├── emotion-scale.tsx                // Emotion rating
├── final-emotion-reflection.tsx     // Outcome assessment
├── index.ts                         // Component exports
├── rational-thoughts.tsx           // Balanced thinking
├── schema-modes.tsx                 // Schema patterns
├── situation-prompt.tsx              // Situation description
└── thought-record.tsx               // Thought analysis

src/features/therapy/cbt/hooks/
├── use-cbt-chat-experience.ts       // Chat integration
└── index.ts

src/features/therapy/cbt/utils/
├── step-mapping.ts                 // Workflow navigation
└── index.ts

src/hooks/therapy/
├── use-cbt-data-manager.ts          // Data management
├── use-cbt-export.ts                // Export functionality
└── index.ts
```

## **Usage Examples**

### **Starting CBT Session**
```typescript
// Initialize CBT form
const startCBTSession = () => {
  const cbtData = initializeCBTData()
  setCurrentStep('situation')
  navigateToCBTForm()
}
```

### **Emotion Scale Component**
```typescript
// Multi-dimensional emotion tracking
const EmotionScale = ({ emotion, onChange }) => {
  return (
    <TherapySlider
      value={emotion.intensity}
      onChange={(value) => onChange(emotion.name, value)}
      min={0}
      max={100}
      step={1}
      label={emotion.name}
      color={emotion.color}
    />
  )
}
```

### **Thought Challenging**
```typescript
// Cognitive restructuring
const ChallengeQuestions = ({ thought, onChallenge }) => {
  const challenges = generateChallengeQuestions(thought)
  
  return (
    <div>
      {challenges.map((question, index) => (
        <TherapeuticCard key={index}>
          <h4>{question.text}</h4>
          <Textarea
            value={question.answer}
            onChange={(e) => onChallenge(index, e.target.value)}
            placeholder="Your response..."
          />
        </TherapeuticCard>
      ))}
    </div>
  )
}
```

## **Data Export Features**

### **Export Formats**
- **PDF** - Professional formatted documents
- **JSON** - Raw data for analysis
- **CSV** - Spreadsheet compatible format
- **Markdown** - Human-readable format

### **Export Content**
- **Complete CBT session** data
- **Progress tracking** and outcomes
- **Emotion patterns** and trends
- **Thought analysis** summaries
- **Action plans** and follow-ups

## **Therapeutic Guidelines**

### **Evidence-Based Approach**
- **Cognitive Behavioral Therapy** principles
- **Structured workflow** following CBT protocols
- **Progressive muscle relaxation** techniques
- **Mindfulness integration** where appropriate

### **Professional Boundaries**
- **No medical diagnosis** or prescription advice
- **Crisis detection** with appropriate referrals
- **Therapeutic relationship** maintenance
- **Ethical guidelines** adherence

## **Performance Optimization**

### **Rendering Performance**
- **Component memoization** for expensive renders
- **Lazy loading** for heavy components
- **Virtual scrolling** for long lists
- **Image optimization** for emotion icons

### **Data Management**
- **Local storage** for draft preservation
- **Session storage** for temporary data
- **Redux integration** for global state
- **Optimistic updates** for responsive UI

## **Accessibility Features**
- **ARIA labels** for screen readers
- **Keyboard navigation** support
- **High contrast** mode compatibility
- **Font scaling** support
- **Voice input** compatibility

## **Testing Coverage**
- **Component tests** for all CBT components
- **Integration tests** for complete workflows
- **Validation tests** for data integrity
- **Accessibility tests** for compliance
- **Performance tests** for responsiveness

## **Internationalization**
- **Multi-language support** (English, Dutch)
- **Cultural adaptation** for therapeutic concepts
- **Localized emotion** names and descriptions
- **Translation parity** across all components

## **Dependencies**
- **react-hook-form** for form management
- **zod** for schema validation
- **date-fns** for date formatting
- **jspdf** for PDF generation
- **html2canvas** for screenshot exports

# Internationalization Feature

## **Overview**
Comprehensive multi-language support with English and Dutch languages, featuring complete translation parity, cultural adaptation, and automated testing for consistency.

## **Key Components**

### **Language Support**
- **English (en)** - Primary language with complete feature coverage
- **Dutch (nl)** - Secondary language with full translation parity
- **Dynamic switching** - Seamless language switching without page reload
- **Persistent preferences** - User language preferences stored and remembered
- **Fallback mechanisms** - Graceful degradation when translations are missing

### **Translation Management**
- **Message files** - Structured translation files with nested keys
- **Type safety** - TypeScript integration for compile-time checking
- **Pluralization** - Proper handling of singular/plural forms
- **Interpolation** - Dynamic content insertion in translations
- **Formatting** - Date, time, and number localization

### **Cultural Adaptation**
- **Therapeutic concepts** - Culturally appropriate mental health terminology
- **Emotion naming** - Localized emotion names and descriptions
- **Date formats** - Region-specific date and time formatting
- **Currency/numbers** - Localized numerical representations
- **Reading direction** - Support for LTR and RTL languages (future-ready)

## **Implementation Details**

### **Translation Files Structure**
```json
// English translations (src/i18n/messages/en.json)
{
  "auth": {
    "login": {
      "title": "Sign In",
      "submit": "Sign In",
      "error": "Invalid credentials"
    }
  },
  "therapy": {
    "cbt": {
      "emotionScale": {
        "title": "Rate Your Emotions",
        "instruction": "Slide to indicate intensity"
      }
    }
  }
}

// Dutch translations (src/i18n/messages/nl.json)
{
  "auth": {
    "login": {
      "title": "Inloggen",
      "submit": "Inloggen",
      "error": "Ongeldige inloggegevens"
    }
  },
  "therapy": {
    "cbt": {
      "emotionScale": {
        "title": "Beoordeel Je Emoties",
        "instruction": "Schuif om intensiteit aan te geven"
      }
    }
  }
}
```

### **Configuration Setup**
```typescript
// i18n configuration (src/i18n/config.ts)
export const i18nConfig = {
  locales: ['en', 'nl'],
  defaultLocale: 'en',
  localePrefix: 'always'
}

// Request handling (src/i18n/request.ts)
import {getRequestConfig} from 'next-intl/server'

export default getRequestConfig(async ({locale}) => ({
  messages: (await import(`./messages/${locale}.json`)).default
}))
```

### **Component Integration**
```typescript
// Using translations in components
import {useTranslations} from 'next-intl'

const LoginForm = () => {
  const t = useTranslations('auth.login')
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{t('submit')}</button>
      {error && <span>{t('error')}</span>}
    </div>
  )
}
```

## **File Structure**
```
src/i18n/
├── config.ts                    // i18n configuration
├── request.ts                   // Request handling
└── messages/
    ├── en.json                  // English translations
    └── nl.json                  // Dutch translations

__tests__/
├── i18n-parity.test.ts         // Translation completeness
└── integration/
    └── i18n-cbt-flow.test.tsx  // CBT flow testing
```

## **Translation Parity Testing**

### **Automated Testing**
```typescript
// Translation completeness validation
describe('i18n Parity', () => {
  it('should have complete translation parity', () => {
    const englishKeys = extractKeys(enMessages)
    const dutchKeys = extractKeys(nlMessages)
    
    expect(englishKeys).toEqual(dutchKeys)
  })
  
  it('should validate CBT flow translations', () => {
    const cbtFlow = testCBTFlowInDutch()
    expect(cbtFlow).toBeComplete()
  })
})
```

### **CBT Flow Integration Testing**
```typescript
// Complete CBT workflow testing in Dutch
const testDutchCBTFlow = async () => {
  await switchLanguage('nl')
  await startCBTSession()
  
  // Test each CBT step with Dutch translations
  await testSituationPrompt()
  await testEmotionScale()
  await testThoughtRecord()
  await testSchemaModes()
  await testChallengeQuestions()
  await testRationalThoughts()
  await testActionPlan()
  await testFinalReflection()
}
```

## **Usage Examples**

### **Language Switching**
```typescript
// Language switcher component
const LanguageSwitcher = () => {
  const [locale, setLocale] = useState('en')
  
  const switchLanguage = (newLocale: string) => {
    setLocale(newLocale)
    router.push(`/${newLocale}${pathname}`)
  }
  
  return (
    <Select value={locale} onValueChange={switchLanguage}>
      <SelectItem value="en">English</SelectItem>
      <SelectItem value="nl">Nederlands</SelectItem>
    </Select>
  )
}
```

### **Formatted Messages**
```typescript
// Dynamic content with interpolation
const WelcomeMessage = ({name, sessionCount}) => {
  const t = useTranslations('dashboard')
  
  return (
    <h1>
      {t('welcome', {name, count: sessionCount})}
    </h1>
  )
}

// Pluralization
const SessionCounter = ({count}) => {
  const t = useTranslations('sessions')
  return <span>{t('count', {count})}</span>
}
```

### **Date Localization**
```typescript
// Localized date formatting
const SessionDate = ({date}) => {
  const locale = useLocale()
  const formattedDate = new Intl.DateTimeFormat(locale).format(date)
  
  return <time>{formattedDate}</time>
}
```

## **Therapeutic Content Translation**

### **CBT Component Translations**
- **Situation descriptions** - Contextual situation prompts
- **Emotion names** - Standardized emotion terminology
- **Thought patterns** - Cognitive distortion descriptions
- **Schema modes** - Core belief patterns
- **Challenge questions** - Therapeutic questioning techniques
- **Action plans** - Behavioral intervention descriptions

### **Mental Health Terminology**
- **Professional accuracy** - Maintaining clinical precision
- **Cultural sensitivity** - Appropriate cultural adaptations
- **Accessibility** - Clear, understandable language
- **Consistency** - Uniform terminology across components

## **Performance Features**

### **Bundle Optimization**
- **Code splitting** by language
- **Lazy loading** of translation files
- **Tree shaking** for unused translations
- **Compression** for message files

### **Caching Strategy**
- **Browser caching** for translation files
- **Service worker** for offline support
- **Memory caching** for active translations
- **CDN distribution** for global access

## **Quality Assurance**

### **Translation Workflow**
1. **Source extraction** from components
2. **Professional translation** by native speakers
3. **Clinical review** by mental health professionals
4. **Technical validation** for completeness
5. **User testing** for natural flow

### **Automated Checks**
- **Key completeness** validation
- **Interpolation syntax** checking
- **Pluralization rules** verification
- **HTML safety** validation
- **Performance impact** monitoring

## **Accessibility Considerations**

### **Screen Reader Support**
- **Semantic HTML** structure
- **ARIA labels** for interactive elements
- **Language attributes** for proper pronunciation
- **Alternative text** for visual content

### **Cognitive Accessibility**
- **Simple language** options
- **Consistent terminology** across languages
- **Clear navigation** patterns
- **Error message** clarity

## **Future Expansion**

### **Language Roadmap**
- **German (de)** - Planned for Q2 2025
- **French (fr)** - Planned for Q3 2025
- **Spanish (es)** - Planned for Q4 2025
- **RTL support** - Arabic, Hebrew preparation

### **Advanced Features**
- **AI-powered translation** assistance
- **Community translations** crowd-sourcing
- **Real-time translation** updates
- **Regional dialects** support

## **Dependencies**
- **next-intl** - Next.js internationalization
- **@formatjs/intl** - Internationalization utilities
- **react-intl** - React integration
- **i18next** - Translation framework
- **formatjs** - Message formatting

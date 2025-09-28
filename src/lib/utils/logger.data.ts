// Extracted constants for logger filtering to keep logger.ts compact

export const SENSITIVE_THERAPEUTIC_KEYS = new Set([
  'situation','emotions','thoughts','automaticThoughts','rationalThoughts',
  'coreBeliefText','coreBelief','coreBeliefs','challengeQuestions','schemaModes',
  'initialEmotions','finalEmotions','newBehaviors','alternativeResponses',
  'schemaReflection','confirmingBehaviors','avoidantBehaviors','overridingBehaviors',
  'content','message','messages','sessionReport','therapeuticContent',
  'sessionData','chatHistory','conversationData','therapeuticData',
  'email','phone','address','personalInfo','medicalInfo','healthData',
  'patientId','patientData','userProfile','personalDetails',
  'password','token','secret','key','credential','apiKey','sessionKey',
  'refreshToken','accessToken','authToken','csrfToken','totpSecret',
  'ip','clientIP','clientIp','remoteAddress','x-forwarded-for','x-real-ip',
  'fear','anger','sadness','joy','anxiety','shame','guilt','depression',
  'trauma','mentalState','mood','emotionalState','psychologicalData',
  'formData','inputData','userInput','therapeuticInput','sessionInput',
  'cbtFormData','diaryEntry','thoughtRecord'
]);

export const SENSITIVE_PATTERNS = [
  /I feel/i, /I think/i, /I believe/i, /My thoughts/i, /My emotions/i,
  /depression/i, /anxiety/i, /trauma/i, /abuse/i, /suicidal/i, /self-harm/i,
  /therapy/i, /therapist/i, /counseling/i, /psychiatric/i, /medication/i,
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
  /\b\d{10,}\b/ // Phone number pattern
];

/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'Test123!@#',
    name: 'Test User'
  },
  newUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'NewUser123!@#',
    name: 'New Test User'
  }
};

export const testMessages = {
  greeting: 'Hello, I would like to talk about my anxiety.',
  followUp: 'Can you help me understand my triggers?',
  crisis: 'I am feeling very overwhelmed right now.',
  casual: 'How are you today?',
  long: 'I have been struggling with anxiety for several years now. It started when I was in college and has gotten progressively worse. I find myself worrying about everything from work deadlines to social situations. Sometimes I have trouble sleeping because my mind won\'t stop racing. I\'ve tried some relaxation techniques but they don\'t seem to help much. I\'m hoping therapy can provide me with better tools to manage these feelings.'
};

export const testSessionData = {
  titles: [
    'Anxiety Management Session',
    'CBT Practice',
    'Daily Check-in',
    'Schema Therapy Session'
  ]
};

export const testMemoryData = {
  entries: [
    {
      content: 'Patient reports high anxiety in social situations',
      category: 'Symptoms'
    },
    {
      content: 'Trigger: Large group gatherings',
      category: 'Triggers'
    },
    {
      content: 'Coping strategy: Deep breathing exercises',
      category: 'Coping Strategies'
    },
    {
      content: 'Progress: Attended family gathering with less anxiety',
      category: 'Progress'
    }
  ]
};

export const testObsessionsData = {
  obsessions: [
    {
      trigger: 'Door unlocked',
      thought: 'Someone will break in',
      feeling: 'Anxiety',
      intensity: 8
    },
    {
      trigger: 'Stove left on',
      thought: 'House will catch fire',
      feeling: 'Fear',
      intensity: 9
    }
  ],
  compulsions: [
    {
      action: 'Check door lock multiple times',
      frequency: 'Every time leaving house',
      duration: '10 minutes'
    },
    {
      action: 'Check stove repeatedly',
      frequency: 'Before bed and when leaving',
      duration: '5 minutes'
    }
  ]
};

export const testSettings = {
  preferences: {
    notifications: true,
    darkMode: false,
    autoSave: true,
    anonymousData: false
  },
  features: {
    webSearch: true,
    advancedMode: false,
    betaFeatures: false
  }
};

/**
 * Generate unique email for new user registration
 */
export function generateTestEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate unique session title
 */
export function generateSessionTitle(): string {
  return `Test Session ${Date.now()}`;
}

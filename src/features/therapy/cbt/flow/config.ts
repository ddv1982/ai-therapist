import { CBT_STEP_ORDER, type CBTStepConfigMap } from './types';

export const CBT_STEP_CONFIG: CBTStepConfigMap = {
  situation: {
    id: 'situation',
    messages: {
      component: {
        translationKey: 'steps.situation.prompt',
        defaultText: "What happened?",
      },
      aiResponse: {
        translationKey: 'ai.situationNext',
        defaultText:
          "Thank you for sharing that situation with me. Understanding the context is so important for CBT work. Now let's explore how this situation made you feel emotionally.",
      },
    },
    metadata: {
      title: {
        translationKey: 'steps.situation.title',
        defaultText: 'Describe the situation',
      },
      subtitle: {
        translationKey: 'steps.situation.subtitle',
        defaultText: 'Capture the triggering event and context.',
      },
      completedLabel: {
        translationKey: 'steps.situation.completed',
        defaultText: 'Situation Analysis',
      },
      icon: 'MessageCircle',
    },
    persist: (context, payload) => ({
      ...context,
      situation: payload,
    }),
  },
  emotions: {
    id: 'emotions',
    messages: {
      component: {
        translationKey: 'steps.emotions.prompt',
        defaultText: 'How are you feeling?',
      },
      aiResponse: {
        translationKey: 'ai.emotionsNext',
        defaultText:
          "I can see you're experiencing some significant emotions around this situation. These feelings are completely valid. Now let's examine what thoughts were running through your mind during this experience.",
      },
    },
    metadata: {
      title: {
        translationKey: 'steps.emotions.title',
        defaultText: 'Rate your emotions',
      },
      subtitle: {
        translationKey: 'steps.emotions.subtitle',
        defaultText: 'Notice emotional intensity before processing your thoughts.',
      },
      completedLabel: {
        translationKey: 'steps.emotions.completed',
        defaultText: 'Emotion Assessment',
      },
      icon: 'Heart',
    },
    persist: (context, payload) => ({
      ...context,
      emotions: payload,
    }),
  },
  thoughts: {
    id: 'thoughts',
    messages: {
      component: {
        translationKey: 'steps.thoughts.prompt',
        defaultText: 'What thoughts went through your mind?',
      },
      aiResponse: {
        translationKey: 'ai.thoughtsNext',
        defaultText:
          "Those automatic thoughts can be really powerful and feel very real in the moment. Let's dig deeper into what core beliefs might be underlying these thoughts.",
      },
    },
    metadata: {
      title: {
        translationKey: 'steps.thoughts.title',
        defaultText: 'Capture automatic thoughts',
      },
      subtitle: {
        translationKey: 'steps.thoughts.subtitle',
        defaultText: 'Record the thoughts that appeared during the situation.',
      },
      completedLabel: {
        translationKey: 'steps.thoughts.completed',
        defaultText: 'Automatic Thoughts',
      },
      icon: 'Brain',
    },
    persist: (context, payload) => ({
      ...context,
      thoughts: payload,
    }),
  },
  'core-belief': {
    id: 'core-belief',
    messages: {
      component: {
        translationKey: 'steps.coreBelief.prompt',
        defaultText: "What's the core belief?",
      },
      aiResponse: {
        translationKey: 'ai.coreBeliefNext',
        defaultText:
          "I can see the core belief you've identified. This insight is really valuable - recognizing these deep patterns is the first step toward change. Now let's challenge this belief together.",
      },
    },
    metadata: {
      title: {
        translationKey: 'steps.coreBelief.title',
        defaultText: 'Name the core belief',
      },
      subtitle: {
        translationKey: 'steps.coreBelief.subtitle',
        defaultText: 'Explore the deeper belief that fuels your automatic thoughts.',
      },
      completedLabel: {
        translationKey: 'steps.coreBelief.completed',
        defaultText: 'Core Belief Exploration',
      },
      icon: 'Target',
    },
    persist: (context, payload) => ({
      ...context,
      coreBelief: payload,
    }),
  },
  'challenge-questions': {
    id: 'challenge-questions',
    messages: {
      component: {
        translationKey: 'steps.challenge.prompt',
        defaultText: 'Challenge the belief',
      },
      aiResponse: {
        translationKey: 'ai.challengeNext',
        defaultText:
          "Excellent work examining your belief from different angles. Those challenge questions help us see beyond our automatic thinking patterns. Now let's develop some more balanced, rational thoughts.",
      },
    },
    metadata: {
      title: {
        translationKey: 'steps.challenge.title',
        defaultText: 'Challenge the thought',
      },
      subtitle: {
        translationKey: 'steps.challenge.subtitle',
        defaultText: 'Use guided questions to test the accuracy of your belief.',
      },
      completedLabel: {
        translationKey: 'steps.challenge.completed',
        defaultText: 'Thought Challenging',
      },
      icon: 'HelpCircle',
    },
    persist: (context, payload) => ({
      ...context,
      challengeQuestions: payload,
    }),
  },
  'rational-thoughts': {
    id: 'rational-thoughts',
    messages: {
      component: {
        translationKey: 'steps.rational.prompt',
        defaultText: 'Rational alternatives',
      },
      aiResponse: {
        translationKey: 'ai.rationalNext',
        defaultText:
          "These rational alternatives you've developed are really insightful. Having these balanced thoughts ready can be incredibly helpful when the old patterns try to resurface. Now let's explore which schema modes feel most active for you right now.",
      },
    },
    metadata: {
      title: {
        translationKey: 'steps.rational.title',
        defaultText: 'Create balanced responses',
      },
      subtitle: {
        translationKey: 'steps.rational.subtitle',
        defaultText: 'Write compassionate, realistic statements to counter your belief.',
      },
      completedLabel: {
        translationKey: 'steps.rational.completed',
        defaultText: 'Rational Response Development',
      },
      icon: 'Lightbulb',
    },
    persist: (context, payload) => ({
      ...context,
      rationalThoughts: payload,
    }),
  },
  'schema-modes': {
    id: 'schema-modes',
    messages: {
      component: {
        translationKey: 'steps.schema.prompt',
        defaultText: 'Schema modes',
      },
      aiResponse: {
        translationKey: 'ai.schemaNext',
        defaultText:
          "Thank you for identifying those schema modes. Understanding which parts of yourself are most active can provide valuable insights into your emotional patterns. Next, let's outline a concrete action plan for future situations.",
      },
    },
    metadata: {
      title: {
        translationKey: 'steps.schema.title',
        defaultText: 'Identify schema modes',
      },
      subtitle: {
        translationKey: 'steps.schema.subtitle',
        defaultText: 'Notice which coping modes are present and how intense they feel.',
      },
      completedLabel: {
        translationKey: 'steps.schema.completed',
        defaultText: 'Schema Mode Analysis',
      },
      icon: 'Users',
    },
    persist: (context, payload) => ({
      ...context,
      schemaModes: payload,
    }),
  },
  actions: {
    id: 'actions',
    messages: {
      component: {
        translationKey: 'steps.actions.prompt',
        defaultText: 'Future Action Plan',
      },
      aiResponse: {
        translationKey: 'ai.actionsNext',
        defaultText:
          "Great plan. Now, as a final step, please reflect on how you feel after this whole process. When you're ready, you can send your session to chat for analysis.",
      },
    },
    metadata: {
      title: {
        translationKey: 'steps.actions.title',
        defaultText: 'Plan helpful actions',
      },
      subtitle: {
        translationKey: 'steps.actions.subtitle',
        defaultText: 'Capture new behaviours and confidence in your revised belief.',
      },
      completedLabel: {
        translationKey: 'steps.actions.completed',
        defaultText: 'Action Plan Development',
      },
      icon: 'Activity',
    },
    persist: (context, payload) => ({
      ...context,
      actionPlan: {
        ...context.actionPlan,
        ...payload,
      },
    }),
  },
  'final-emotions': {
    id: 'final-emotions',
    messages: {
      component: {
        translationKey: 'steps.finalEmotions.prompt',
        defaultText: 'How do you feel now?',
      },
      aiResponse: {
        translationKey: 'ai.finalNext',
        defaultText:
          "Wonderful work! You've completed a comprehensive CBT exploration. This kind of structured reflection can be incredibly helpful for understanding patterns and developing new ways of responding to challenging situations.",
      },
    },
    metadata: {
      title: {
        translationKey: 'steps.finalEmotions.title',
        defaultText: 'Reflect on current emotions',
      },
      subtitle: {
        translationKey: 'steps.finalEmotions.subtitle',
        defaultText: 'Compare how you feel now with how you felt at the start.',
      },
      completedLabel: {
        translationKey: 'steps.finalEmotions.completed',
        defaultText: 'Emotional Reflection',
      },
      icon: 'Heart',
    },
    persist: (context, payload) => ({
      ...context,
      finalEmotions: payload,
      actionPlan: context.actionPlan
        ? { ...context.actionPlan, finalEmotions: payload }
        : { finalEmotions: payload, newBehaviors: '', originalThoughtCredibility: 5 },
    }),
  },
};

export const TOTAL_CBT_STEPS = CBT_STEP_ORDER.length;

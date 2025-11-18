import {
  messageBase,
  messageVariants,
  messageTypography,
  messageDesignSystem,
  getMessageTokens,
  buildMessageClasses,
} from '@/lib/ui/design-system/message';

describe('message design system', () => {
  describe('messageBase', () => {
    it('has all base properties', () => {
      expect(messageBase.container).toBeDefined();
      expect(messageBase.avatar).toBeDefined();
      expect(messageBase.contentWrapper).toBeDefined();
      expect(messageBase.bubble).toBeDefined();
      expect(messageBase.timestamp).toBeDefined();
    });

    it('has string values for classes', () => {
      expect(typeof messageBase.container).toBe('string');
      expect(typeof messageBase.avatar).toBe('string');
      expect(typeof messageBase.bubble).toBe('string');
    });
  });

  describe('messageVariants', () => {
    it('has user variant', () => {
      expect(messageVariants.user).toBeDefined();
      expect(messageVariants.user.container).toBeDefined();
      expect(messageVariants.user.avatar).toBeDefined();
      expect(messageVariants.user.bubble).toBeDefined();
    });

    it('has assistant variant', () => {
      expect(messageVariants.assistant).toBeDefined();
      expect(messageVariants.assistant.container).toBeDefined();
      expect(messageVariants.assistant.avatar).toBeDefined();
      expect(messageVariants.assistant.bubble).toBeDefined();
    });

    it('has different styling for user and assistant', () => {
      expect(messageVariants.user.avatar).not.toBe(messageVariants.assistant.avatar);
      expect(messageVariants.user.bubble).not.toBe(messageVariants.assistant.bubble);
    });
  });

  describe('messageTypography', () => {
    it('has all typography levels', () => {
      expect(messageTypography.h1).toBeDefined();
      expect(messageTypography.h2).toBeDefined();
      expect(messageTypography.h3).toBeDefined();
      expect(messageTypography.body).toBeDefined();
      expect(messageTypography.small).toBeDefined();
    });

    it('all typography are strings', () => {
      expect(typeof messageTypography.h1).toBe('string');
      expect(typeof messageTypography.h2).toBe('string');
      expect(typeof messageTypography.body).toBe('string');
    });
  });

  describe('messageDesignSystem', () => {
    it('exports complete design system', () => {
      expect(messageDesignSystem.base).toBe(messageBase);
      expect(messageDesignSystem.variants).toBe(messageVariants);
      expect(messageDesignSystem.typography).toBe(messageTypography);
    });
  });

  describe('getMessageTokens', () => {
    it('returns tokens for user role', () => {
      const tokens = getMessageTokens('user');

      expect(tokens.base).toBe(messageBase);
      expect(tokens.variant).toBe(messageVariants.user);
      expect(tokens.typography).toBe(messageTypography);
    });

    it('returns tokens for assistant role', () => {
      const tokens = getMessageTokens('assistant');

      expect(tokens.base).toBe(messageBase);
      expect(tokens.variant).toBe(messageVariants.assistant);
      expect(tokens.typography).toBe(messageTypography);
    });
  });

  describe('buildMessageClasses', () => {
    it('builds container classes for user', () => {
      const classes = buildMessageClasses('user', 'container');

      expect(classes).toContain('flex');
      expect(classes.length).toBeGreaterThan(0);
    });

    it('builds container classes for assistant', () => {
      const classes = buildMessageClasses('assistant', 'container');

      expect(classes).toContain('flex');
      expect(classes.length).toBeGreaterThan(0);
    });

    it('builds avatar classes for user', () => {
      const classes = buildMessageClasses('user', 'avatar');

      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-primary-foreground');
    });

    it('builds avatar classes for assistant', () => {
      const classes = buildMessageClasses('assistant', 'avatar');

      expect(classes).toContain('bg-purple-600');
    });

    it('builds bubble classes for user', () => {
      const classes = buildMessageClasses('user', 'bubble');

      expect(classes).toContain('bg-primary');
      expect(classes).toContain('text-white');
    });

    it('builds bubble classes for assistant', () => {
      const classes = buildMessageClasses('assistant', 'bubble');

      expect(classes).toContain('bg-card');
      expect(classes).toContain('text-foreground');
    });

    it('builds timestamp classes for user', () => {
      const classes = buildMessageClasses('user', 'timestamp');

      expect(classes.length).toBeGreaterThan(0);
    });

    it('builds timestamp classes for assistant', () => {
      const classes = buildMessageClasses('assistant', 'timestamp');

      expect(classes).toContain('text-muted-foreground');
    });

    it('combines base and variant classes', () => {
      const classes = buildMessageClasses('user', 'avatar');

      // Should contain both base classes and variant classes
      expect(classes).toContain('flex-shrink-0');
      expect(classes).toContain('bg-primary');
    });

    it('trims extra whitespace', () => {
      const classes = buildMessageClasses('user', 'container');

      expect(classes).not.toMatch(/^\s/);
      expect(classes).not.toMatch(/\s$/);
    });
  });
});

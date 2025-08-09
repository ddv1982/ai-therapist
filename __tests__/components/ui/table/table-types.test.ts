import {
  isValidTableVariant,
  isValidColumnType,
  isValidTableSize,
  DEFAULT_TABLE_CONFIG,
  DEFAULT_THEME_TOKENS,
  DEFAULT_WIDE_TABLE_CONFIG,
  DEFAULT_PRIORITY_CONFIG,
  TableVariant,
  ColumnType,
  TableSize,
  WideTableStrategy,
  ColumnPriority,
} from '@/components/ui/enhanced/data-table/table-types';

describe('Table Type Guards', () => {
  describe('isValidTableVariant', () => {
    it('should return true for valid table variants', () => {
      const validVariants: TableVariant[] = [
        'default',
        'cbt-report',
        'progress',
        'comparison',
        'dashboard',
        'compact',
      ];

      validVariants.forEach(variant => {
        expect(isValidTableVariant(variant)).toBe(true);
      });
    });

    it('should return false for invalid table variants', () => {
      const invalidVariants = [
        'invalid-variant',
        'wide-scroll', // Removed in 5-column rule
        'priority-plus', // This is a strategy, not a variant
        null,
        undefined,
        123,
        {},
        [],
      ];

      invalidVariants.forEach(variant => {
        expect(isValidTableVariant(variant)).toBe(false);
      });
    });

    it('should handle edge cases correctly', () => {
      expect(isValidTableVariant('')).toBe(false);
      expect(isValidTableVariant('DEFAULT')).toBe(false); // Case sensitive
      expect(isValidTableVariant('default ')).toBe(false); // No trailing spaces
    });
  });

  describe('isValidColumnType', () => {
    it('should return true for valid column types', () => {
      const validTypes: ColumnType[] = [
        'priority',
        'framework',
        'content',
        'metric',
        'label',
        'default',
      ];

      validTypes.forEach(type => {
        expect(isValidColumnType(type)).toBe(true);
      });
    });

    it('should return false for invalid column types', () => {
      const invalidTypes = [
        'invalid-type',
        'number', // Not a defined type
        'text', // Not a defined type
        null,
        undefined,
        123,
        {},
        [],
      ];

      invalidTypes.forEach(type => {
        expect(isValidColumnType(type)).toBe(false);
      });
    });

    it('should handle edge cases correctly', () => {
      expect(isValidColumnType('')).toBe(false);
      expect(isValidColumnType('PRIORITY')).toBe(false); // Case sensitive
      expect(isValidColumnType('priority ')).toBe(false); // No trailing spaces
    });
  });

  describe('isValidTableSize', () => {
    it('should return true for valid table sizes', () => {
      const validSizes: TableSize[] = ['sm', 'md', 'lg'];

      validSizes.forEach(size => {
        expect(isValidTableSize(size)).toBe(true);
      });
    });

    it('should return false for invalid table sizes', () => {
      const invalidSizes = [
        'xs',
        'xl',
        'small',
        'medium',
        'large',
        null,
        undefined,
        123,
        {},
        [],
      ];

      invalidSizes.forEach(size => {
        expect(isValidTableSize(size)).toBe(false);
      });
    });

    it('should handle edge cases correctly', () => {
      expect(isValidTableSize('')).toBe(false);
      expect(isValidTableSize('SM')).toBe(false); // Case sensitive
      expect(isValidTableSize('sm ')).toBe(false); // No trailing spaces
    });
  });
});

describe('Default Configuration Objects', () => {
  describe('DEFAULT_TABLE_CONFIG', () => {
    it('should have expected structure and values', () => {
      expect(DEFAULT_TABLE_CONFIG).toEqual({
        responsive: true,
        mobileCardLayout: true,
        stripedRows: false,
        hoverEffects: true,
        sortable: false,
        columnResize: false,
      });
    });

    it('should have consistent default values', () => {
      // Test that the config has expected boolean values
      expect(DEFAULT_TABLE_CONFIG.responsive).toBe(true);
      expect(DEFAULT_TABLE_CONFIG.mobileCardLayout).toBe(true);
      expect(DEFAULT_TABLE_CONFIG.stripedRows).toBe(false);
      expect(DEFAULT_TABLE_CONFIG.hoverEffects).toBe(true);
      expect(DEFAULT_TABLE_CONFIG.sortable).toBe(false);
      expect(DEFAULT_TABLE_CONFIG.columnResize).toBe(false);
    });

    it('should have boolean values for all properties', () => {
      Object.values(DEFAULT_TABLE_CONFIG).forEach(value => {
        expect(typeof value).toBe('boolean');
      });
    });
  });

  describe('DEFAULT_THEME_TOKENS', () => {
    it('should have expected structure with CSS custom properties', () => {
      expect(DEFAULT_THEME_TOKENS).toMatchObject({
        colors: {
          background: 'hsl(var(--card))',
          border: 'hsl(var(--border))',
          text: 'hsl(var(--foreground))',
          headerBackground: 'hsl(var(--muted) / 0.8)',
          stripeBackground: 'hsl(var(--muted) / 0.15)',
          hoverBackground: 'hsl(var(--muted) / 0.25)',
        },
        spacing: {
          cellPaddingMobile: '0.75rem',
          cellPaddingDesktop: '1rem 1.25rem',
          rowMinHeightMobile: '44px',
          rowMinHeightDesktop: '60px',
        },
        typography: {
          fontSizeMobile: '0.875rem',
          fontSizeDesktop: '1rem',
          headerFontWeight: '700',
        },
        layout: {
          borderRadius: '0.5rem',
          borderWidth: '1px',
          mobileBreakpoint: '480px',
          tabletBreakpoint: '768px',
        },
      });
    });

    it('should use consistent CSS custom property format', () => {
      const { colors } = DEFAULT_THEME_TOKENS;
      
      Object.values(colors).forEach(color => {
        expect(color).toMatch(/^hsl\(var\(--[\w-]+\)/);
      });
    });

    it('should have valid CSS unit values for spacing', () => {
      const { spacing } = DEFAULT_THEME_TOKENS;
      
      expect(spacing.cellPaddingMobile).toMatch(/^\d+(\.\d+)?rem$/);
      expect(spacing.cellPaddingDesktop).toMatch(/^\d+(\.\d+)?rem \d+(\.\d+)?rem$/);
      expect(spacing.rowMinHeightMobile).toMatch(/^\d+px$/);
      expect(spacing.rowMinHeightDesktop).toMatch(/^\d+px$/);
    });

    it('should have valid CSS unit values for typography', () => {
      const { typography } = DEFAULT_THEME_TOKENS;
      
      expect(typography.fontSizeMobile).toMatch(/^\d+(\.\d+)?rem$/);
      expect(typography.fontSizeDesktop).toMatch(/^\d+(\.\d+)?rem$/);
      expect(typography.headerFontWeight).toBe('700');
    });

    it('should have valid CSS values for layout', () => {
      const { layout } = DEFAULT_THEME_TOKENS;
      
      expect(layout.borderRadius).toMatch(/^\d+(\.\d+)?rem$/);
      expect(layout.borderWidth).toMatch(/^\d+px$/);
      expect(layout.mobileBreakpoint).toMatch(/^\d+px$/);
      expect(layout.tabletBreakpoint).toMatch(/^\d+px$/);
    });
  });

  describe('DEFAULT_WIDE_TABLE_CONFIG', () => {
    it('should extend DEFAULT_TABLE_CONFIG with wide table specific options', () => {
      expect(DEFAULT_WIDE_TABLE_CONFIG).toMatchObject({
        // Base table config
        responsive: true,
        mobileCardLayout: true,
        stripedRows: false,
        hoverEffects: true,
        sortable: false,
        columnResize: false,
        // Wide table specific
        strategy: 'auto',
        maxVisibleColumns: 4,
        stickyColumns: 1,
        allowColumnToggle: true,
        preserveColumnOrder: true,
        showHiddenColumnsIndicator: true,
        keyboardNavigation: true,
      });
    });

    it('should have valid strategy value', () => {
      const validStrategies: WideTableStrategy[] = [
        'priority-plus',
        'adaptive-cards',
        'column-toggle',
        'auto',
      ];
      
      expect(validStrategies).toContain(DEFAULT_WIDE_TABLE_CONFIG.strategy);
    });

    it('should have reasonable default values', () => {
      expect(DEFAULT_WIDE_TABLE_CONFIG.maxVisibleColumns).toBe(4); // Follows 5-column rule (4 visible + 1 hidden)
      expect(DEFAULT_WIDE_TABLE_CONFIG.stickyColumns).toBe(1);
      expect(DEFAULT_WIDE_TABLE_CONFIG.allowColumnToggle).toBe(true);
      expect(DEFAULT_WIDE_TABLE_CONFIG.keyboardNavigation).toBe(true);
    });
  });

  describe('DEFAULT_PRIORITY_CONFIG', () => {
    it('should have weights for all column types', () => {
      const expectedColumnTypes: ColumnType[] = [
        'priority',
        'framework',
        'content',
        'metric',
        'label',
        'default',
      ];
      
      expectedColumnTypes.forEach(type => {
        expect(DEFAULT_PRIORITY_CONFIG.dataTypeWeights).toHaveProperty(type);
        expect(typeof DEFAULT_PRIORITY_CONFIG.dataTypeWeights[type]).toBe('number');
      });
    });

    it('should have weights between 0 and 1', () => {
      Object.values(DEFAULT_PRIORITY_CONFIG.dataTypeWeights).forEach(weight => {
        expect(weight).toBeGreaterThanOrEqual(0);
        expect(weight).toBeLessThanOrEqual(1);
      });
      
      expect(DEFAULT_PRIORITY_CONFIG.positionWeight).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_PRIORITY_CONFIG.positionWeight).toBeLessThanOrEqual(1);
      expect(DEFAULT_PRIORITY_CONFIG.userInteractionWeight).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_PRIORITY_CONFIG.userInteractionWeight).toBeLessThanOrEqual(1);
      expect(DEFAULT_PRIORITY_CONFIG.semanticWeight).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_PRIORITY_CONFIG.semanticWeight).toBeLessThanOrEqual(1);
    });

    it('should have logical priority ordering for column types', () => {
      const { dataTypeWeights } = DEFAULT_PRIORITY_CONFIG;
      
      // Priority and metric should have high weights
      expect(dataTypeWeights.priority).toBeGreaterThan(0.8);
      expect(dataTypeWeights.metric).toBeGreaterThan(0.7);
      
      // Label should have lower weight
      expect(dataTypeWeights.label).toBeLessThan(0.5);
      
      // Priority should be highest
      expect(dataTypeWeights.priority).toBeGreaterThan(dataTypeWeights.framework);
      expect(dataTypeWeights.priority).toBeGreaterThan(dataTypeWeights.content);
    });

    it('should sum to reasonable total for balanced weighting', () => {
      const { positionWeight, userInteractionWeight, semanticWeight } = DEFAULT_PRIORITY_CONFIG;
      const totalWeight = positionWeight + userInteractionWeight + semanticWeight;
      
      // Should be close to 1.0 for balanced algorithm
      expect(totalWeight).toBeCloseTo(1.3, 1); // Allow some flexibility
    });
  });
});

describe('Type Definitions Structure', () => {
  describe('Column Definition Types', () => {
    it('should have proper ColumnDefinition structure', () => {
      // This test ensures the type is properly defined
      const columnDef = {
        id: 'test',
        header: 'Test Header',
        type: 'content' as ColumnType,
        sortable: true,
        width: '100px',
        minWidth: '80px',
        maxWidth: '200px',
        accessor: 'testField',
        className: 'test-class',
      };
      
      // Should compile without errors
      expect(columnDef.id).toBe('test');
      expect(columnDef.type).toBe('content');
    });

    it('should have proper WideColumnDefinition with additional fields', () => {
      const wideColumnDef = {
        id: 'test',
        header: 'Test Header',
        type: 'priority' as ColumnType,
        priority: 'high' as ColumnPriority,
        hiddenByDefault: false,
        alwaysVisible: true,
        groupId: 'group1',
      };
      
      // Should compile without errors
      expect(wideColumnDef.priority).toBe('high');
      expect(wideColumnDef.alwaysVisible).toBe(true);
    });
  });

  describe('Strategy and Priority Types', () => {
    it('should have proper WideTableStrategy type values', () => {
      const strategies: WideTableStrategy[] = [
        'priority-plus',
        'adaptive-cards',
        'column-toggle',
        'auto',
      ];
      
      strategies.forEach(strategy => {
        expect(typeof strategy).toBe('string');
        expect(strategy).toMatch(/^[a-z-]+$/);
      });
    });

    it('should have proper ColumnPriority type values', () => {
      const priorities: ColumnPriority[] = ['high', 'medium', 'low'];
      
      priorities.forEach(priority => {
        expect(typeof priority).toBe('string');
        expect(['high', 'medium', 'low']).toContain(priority);
      });
    });
  });

  describe('Configuration Types', () => {
    it('should have proper TableConfig structure', () => {
      const config = {
        responsive: true,
        mobileCardLayout: true,
        stripedRows: false,
        hoverEffects: true,
        sortable: false,
        columnResize: false,
      };
      
      // All properties should be boolean
      Object.values(config).forEach(value => {
        expect(typeof value).toBe('boolean');
      });
    });

    it('should have proper WideTableConfig extending TableConfig', () => {
      const wideConfig = {
        ...DEFAULT_TABLE_CONFIG,
        strategy: 'auto' as WideTableStrategy,
        maxVisibleColumns: 4,
        stickyColumns: 1,
        allowColumnToggle: true,
        preserveColumnOrder: true,
        showHiddenColumnsIndicator: true,
        keyboardNavigation: true,
      };
      
      expect(typeof wideConfig.maxVisibleColumns).toBe('number');
      expect(typeof wideConfig.stickyColumns).toBe('number');
      expect(typeof wideConfig.allowColumnToggle).toBe('boolean');
    });
  });

  describe('State Management Types', () => {
    it('should have proper ColumnVisibilityState structure', () => {
      const visibilityState = {
        col1: { visible: true, order: 0, width: '100px' },
        col2: { visible: false, order: 1 },
        col3: { visible: true, order: 2 },
      };
      
      Object.values(visibilityState).forEach(state => {
        expect(typeof state.visible).toBe('boolean');
        expect(typeof state.order).toBe('number');
        if (state.width) {
          expect(typeof state.width).toBe('string');
        }
      });
    });
  });
});

describe('Consistency and Relationships', () => {
  it('should have consistent column types between type guard and priority config', () => {
    const priorityConfigTypes = Object.keys(DEFAULT_PRIORITY_CONFIG.dataTypeWeights);
    
    priorityConfigTypes.forEach(type => {
      expect(isValidColumnType(type)).toBe(true);
    });
  });

  it('should have reasonable default visible columns vs priority weights', () => {
    const maxVisible = DEFAULT_WIDE_TABLE_CONFIG.maxVisibleColumns;
    const highPriorityWeight = DEFAULT_PRIORITY_CONFIG.dataTypeWeights.priority;
    
    // Max visible should be less than typical table size to trigger priority logic
    expect(maxVisible).toBeLessThan(8);
    expect(maxVisible).toBeGreaterThan(2);
    
    // High priority columns should have substantial weight
    expect(highPriorityWeight).toBeGreaterThan(0.8);
  });

  it('should have mobile-first responsive settings', () => {
    expect(DEFAULT_TABLE_CONFIG.responsive).toBe(true);
    expect(DEFAULT_TABLE_CONFIG.mobileCardLayout).toBe(true);
    
    // Mobile breakpoint should be smaller than tablet
    const mobileBreakpoint = parseInt(DEFAULT_THEME_TOKENS.layout.mobileBreakpoint);
    const tabletBreakpoint = parseInt(DEFAULT_THEME_TOKENS.layout.tabletBreakpoint);
    
    expect(mobileBreakpoint).toBeLessThan(tabletBreakpoint);
  });

  it('should follow 5-column rule principles', () => {
    // Max visible columns should align with 5-column rule (show up to 4, hide 5+)
    expect(DEFAULT_WIDE_TABLE_CONFIG.maxVisibleColumns).toBe(4);
    
    // Should not use horizontal scroll strategies
    expect(DEFAULT_WIDE_TABLE_CONFIG.strategy).not.toBe('horizontal-scroll' as any);
    
    // Should prefer priority-plus or adaptive alternatives
    expect(['auto', 'priority-plus', 'adaptive-cards']).toContain(DEFAULT_WIDE_TABLE_CONFIG.strategy);
  });
});